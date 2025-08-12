import * as vscode from 'vscode';
import * as https from 'https';
import { getRecipeEditorHtml } from './webview/getRecipeEditorHtml';

// --- Interfaces ---
interface Item {
    id: string;
    name: string;
    icon: string;
}
interface MojangItem {
    name: string;
}
interface CachedData {
    schemaVersion: number;
    items: Item[];
}

// --- Local Project Item Discovery ---
async function findProjectItems(webview: vscode.Webview): Promise<Item[]> {
    const projectItems: Item[] = [];
    const itemDefinitionFiles = await vscode.workspace.findFiles('**/items/**/*.json', '**/node_modules/**');

    for (const fileUri of itemDefinitionFiles) {
        try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const json = JSON.parse(fileContent.toString());
            const itemComponent = json['minecraft:item'];
            if (!itemComponent) continue;

            const identifier = itemComponent.description?.identifier;
            if (!identifier) continue;
            
            projectItems.push({
                id: identifier,
                name: identifier.split(':').pop()?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || identifier,
                icon: '', // Icon is always empty.
            });

        } catch (e) {
            console.warn(`Could not parse project item file ${fileUri.fsPath}:`, e);
        }
    }
    return projectItems;
}

// --- Vanilla Minecraft Data Service ---
namespace VanillaDataService {
    const CACHE_SCHEMA_VERSION = 9;
    const CACHE_KEY = 'vanillaItemRegistryCache';
    const MINIMUM_MATCH_SCORE = 20;

    let isInitializing = false;
    let context: vscode.ExtensionContext;

    async function fetchJson<T>(url: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const options = { headers: { 'User-Agent': 'VSCode-AddonCrate-Recipe-Editor' } };
            https.get(url, options, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to get '${url}' (Status Code: ${res.statusCode})`));
                    res.resume();
                    return;
                }
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const jsonString = data.replace(/^\s*\/\/.*$/gm, '');
                        if (!jsonString) throw new Error(`Received empty data from ${url}`);
                        resolve(JSON.parse(jsonString));
                    } catch (e: any) {
                        reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
                    }
                });
            }).on('error', (err) => reject(err));
        });
    }

    function scoreMatch(itemId: string, textureName: string): number {
        if (itemId === textureName) return 100;
        const keywords = itemId.split('_');
        let score = 0;
        for (const keyword of keywords) {
            if (textureName.includes(keyword)) score += 50;
        }
        return (score / Math.max(1, keywords.length));
    }

    const extractPathsFromTextureEntry = (entry: any): string[] => {
        const result: string[] = [];
        const pushPath = (p: any) => {
            if (typeof p === 'string') result.push(p);
            else if (p && typeof p === 'object') {
                if (typeof p.path === 'string') result.push(p.path);
                else if (typeof p.textures === 'string') result.push(p.textures);
                else if (Array.isArray(p.textures)) {
                    for (const sub of p.textures) {
                        if (typeof sub === 'string') result.push(sub);
                        else if (sub && typeof sub.path === 'string') result.push(sub.path);
                    }
                }
            }
        };

        if (typeof entry === 'string') pushPath(entry);
        else if (Array.isArray(entry)) {
            for (const e of entry) pushPath(e);
        } else if (entry && typeof entry === 'object') {
            if (typeof entry.textures === 'string') pushPath(entry.textures);
            else if (Array.isArray(entry.textures)) {
                for (const e of entry.textures) pushPath(e);
            } else if (typeof entry.path === 'string') pushPath(entry.path);
            else {
                for (const k of Object.keys(entry)) {
                    const v = (entry as any)[k];
                    if (typeof v === 'string' && v.startsWith('textures/')) result.push(v);
                }
            }
        }
        return result;
    };

    const buildReverseMap = (map: any) => {
        const reverseMap = new Map<string, string>();
        for (const key in map) {
            const raw = map[key];
            let candidatePaths: string[] = [];

            if (raw == null) continue;

            if (typeof raw === 'string') {
                candidatePaths = [raw];
            } else if (raw.textures !== undefined) {
                candidatePaths = extractPathsFromTextureEntry(raw.textures);
            } else if (raw.path !== undefined) {
                candidatePaths = [raw.path];
            } else {
                if (typeof raw === 'object') {
                    const stack: any[] = [raw];
                    while (stack.length) {
                        const node = stack.pop();
                        if (!node) continue;
                        if (typeof node === 'string' && node.startsWith('textures/')) candidatePaths.push(node);
                        else if (Array.isArray(node)) {
                            for (const e of node) stack.push(e);
                        } else if (typeof node === 'object') {
                            for (const v of Object.values(node)) stack.push(v);
                        }
                    }
                }
            }

            for (const p of candidatePaths) {
                if (!p || typeof p !== 'string') continue;
                const normalized = p.replace(/^\.\/+/, '').replace(/\/+/g, '/');
                const shortName = normalized.split('/').pop();
                if (shortName && !reverseMap.has(shortName)) {
                    reverseMap.set(shortName, normalized);
                }
            }
        }
        return reverseMap;
    };

    async function buildRegistry(): Promise<Item[]> {
        const baseUrl = 'https://raw.githubusercontent.com/Mojang/bedrock-samples/main';
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        statusBarItem.text = `$(sync~spin) Fetching Minecraft item data...`;
        statusBarItem.show();

        try {
            const [itemsData, itemTextureData, terrainTextureData] = await Promise.all([
                fetchJson<{ data_items: MojangItem[] }>(`${baseUrl}/metadata/vanilladata_modules/mojang-items.json`),
                fetchJson<any>(`${baseUrl}/resource_pack/textures/item_texture.json`),
                fetchJson<any>(`${baseUrl}/resource_pack/textures/terrain_texture.json`)
            ]);

            const finalRegistry: Item[] = [];
            const itemsToProcess = new Set<MojangItem>(itemsData.data_items);
            const itemTextureMap = itemTextureData.texture_data || itemTextureData;
            const terrainTextureMap = terrainTextureData.texture_data || terrainTextureData;

            const reverseItemTextureMap = buildReverseMap(itemTextureMap);
            const reverseTerrainTextureMap = buildReverseMap(terrainTextureMap);
            
            const assignedTexturePaths = new Set<string>();

            const getTexturePath = (textureData: any) => {
                if (!textureData) return '';
                if (typeof textureData === 'string') return textureData;
                if (Array.isArray(textureData)) {
                    const arr: string[] = [];
                    for (const e of textureData) {
                        if (typeof e === 'string') arr.push(e);
                        else if (e && typeof e.path === 'string') arr.push(e.path);
                        else if (e && typeof e.textures === 'string') arr.push(e.textures);
                    }
                    return arr.length > 0 ? arr[0] : '';
                }
                if (typeof textureData === 'object') {
                    if (typeof textureData.textures === 'string') return textureData.textures;
                    if (Array.isArray(textureData.textures)) {
                        for (const t of textureData.textures) {
                            if (typeof t === 'string') return t;
                            if (t && typeof t.path === 'string') return t.path;
                        }
                    }
                    if (typeof textureData.path === 'string') return textureData.path;
                }
                return '';
            };

            // Pass 1: High-Confidence Matches
            for (const item of Array.from(itemsToProcess)) {
                const shortName = item.name.replace('minecraft:', '');
                let foundPath: string | undefined = '';

                if (itemTextureMap[shortName]) {
                    foundPath = getTexturePath(itemTextureMap[shortName]);
                } else if (terrainTextureMap[shortName]) {
                    foundPath = getTexturePath(terrainTextureMap[shortName]);
                } else if (reverseItemTextureMap.has(shortName)) {
                    foundPath = reverseItemTextureMap.get(shortName);
                } else if (reverseTerrainTextureMap.has(shortName)) {
                    foundPath = reverseTerrainTextureMap.get(shortName);
                }

                if (foundPath) {
                    const normalizedFoundPath = foundPath.replace(/^\.\/+/, '').replace(/\/+/g, '/');
                    if (assignedTexturePaths.has(normalizedFoundPath)) continue;
                    
                    finalRegistry.push({ id: item.name, name: formatName(shortName), icon: '' });
                    itemsToProcess.delete(item);
                    assignedTexturePaths.add(normalizedFoundPath);
                    for (const [k, v] of Array.from(reverseItemTextureMap.entries())) {
                        if (v === normalizedFoundPath) reverseItemTextureMap.delete(k);
                    }
                    for (const [k, v] of Array.from(reverseTerrainTextureMap.entries())) {
                        if (v === normalizedFoundPath) reverseTerrainTextureMap.delete(k);
                    }
                }
            }

            // Pass 2: Scored Fallback
            const remainingTextures = new Map<string, string>();
            for (const [k, v] of reverseItemTextureMap.entries()) remainingTextures.set(v, k);
            for (const [k, v] of reverseTerrainTextureMap.entries()) remainingTextures.set(v, k);

            const remainingItems = Array.from(itemsToProcess);
            type Candidate = { item: MojangItem, itemShort: string, texturePath: string, textureShort: string, score: number };
            const candidates: Candidate[] = [];

            for (const item of remainingItems) {
                const itemShort = item.name.replace('minecraft:', '');
                for (const [path, textureShort] of remainingTextures.entries()) {
                    if (assignedTexturePaths.has(path)) continue;
                    const score = scoreMatch(itemShort, textureShort);
                    if (score >= MINIMUM_MATCH_SCORE) {
                        candidates.push({ item, itemShort, texturePath: path, textureShort, score });
                    }
                }
            }
            
            candidates.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const aExact = (a.itemShort === a.textureShort) ? 1 : 0;
                const bExact = (b.itemShort === b.textureShort) ? 1 : 0;
                return bExact - aExact;
            });

            const assignedItems = new Set<string>();
            for (const c of candidates) {
                if (assignedItems.has(c.item.name) || assignedTexturePaths.has(c.texturePath)) continue;
                finalRegistry.push({ id: c.item.name, name: formatName(c.itemShort), icon: '' });
                assignedItems.add(c.item.name);
                assignedTexturePaths.add(c.texturePath);
            }

            // Pass 3: Add any remaining items without an icon match
            for (const item of remainingItems) {
                if (assignedItems.has(item.name)) continue;
                const shortName = item.name.replace('minecraft:', '');
                finalRegistry.push({ id: item.name, name: formatName(shortName), icon: '' });
            }

            vscode.window.showInformationMessage('Successfully updated Minecraft item data.');
            return finalRegistry;

        } catch (e: any) {
            console.error('Failed to build Vanilla item registry:', e);
            vscode.window.showErrorMessage(`Could not fetch Minecraft data. Check internet or API rate limits. Error: ${e.message}`);
            return [];
        } finally {
            statusBarItem.dispose();
        }
    }

    export async function clearCache(): Promise<void> {
        try {
            await context.globalState.update(CACHE_KEY, undefined);
        } catch (e) {
            console.error('Failed to clear vanilla cache:', e);
            throw e;
        }
    }

    const formatName = (id: string) => id.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    export function initialize(ctx: vscode.ExtensionContext) {
        context = ctx;
    }

    export async function getItemRegistry(): Promise<Item[]> {
        if (isInitializing) {
            while (isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const cachedData: CachedData | undefined = context.globalState.get(CACHE_KEY);
            return cachedData?.items || [];
        }

        isInitializing = true;
        try {
            const cachedData: CachedData | undefined = context.globalState.get(CACHE_KEY);
            if (cachedData && cachedData.schemaVersion === CACHE_SCHEMA_VERSION) {
                return cachedData.items;
            }
            const items = await buildRegistry();
            if (items.length > 0) {
                const dataToCache: CachedData = { schemaVersion: CACHE_SCHEMA_VERSION, items };
                await context.globalState.update(CACHE_KEY, dataToCache);
                return items;
            } else if (cachedData) {
                return cachedData.items;
            }
            return [];
        } finally {
            isInitializing = false;
        }
    }
}

// --- Custom Editor Provider ---
export class RecipeEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'addoncrate.recipeEditor';

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        VanillaDataService.initialize(context);
        // Pre-warm the cache on activation, but don't block on it or show errors.
        VanillaDataService.getItemRegistry().catch((err) => { 
            console.warn("Pre-warming vanilla item cache failed on activation:", err.message);
        });
        
        const provider = new RecipeEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(RecipeEditorProvider.viewType, provider, {
            webviewOptions: { retainContextWhenHidden: true }
        });
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup webview
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [ this.context.extensionUri, ...vscode.workspace.workspaceFolders?.map(f => f.uri) ?? [] ]
        };
        webviewPanel.webview.html = getRecipeEditorHtml(webviewPanel.webview, this.context.extensionUri);

        // --- CORE FIX: Use closures to maintain state per editor ---
        // The message handler is created inside this resolve method, so it has exclusive access
        // to the `document` object of this specific editor panel.
        webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
                case 'ready':
                    // Pass the correct document to the update function
                    await this.updateWebview(webviewPanel.webview, document);
                    return;
                case 'save':
                    // Use the correct document to save the data
                    await this.updateDocument(document, message.data);
                    return;
                case 'error':
                    vscode.window.showErrorMessage(message.message);
                    return;
            }
        });

        // Listen for changes to the file on disk (e.g., from an external edit or git operation)
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            // Only update the webview if the change was for the document this panel is showing
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(webviewPanel.webview, document);
            }
        });

        // Clean up the subscription when the panel is closed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    /**
     * Sends the latest document content and the full item registry to the webview.
     * This is now a private helper method that requires the correct document to be passed in.
     */
    private async updateWebview(webview: vscode.Webview, document: vscode.TextDocument) {
        const [vanillaItems, projectItems] = await Promise.all([
            VanillaDataService.getItemRegistry(),
            findProjectItems(webview)
        ]);
        
        webview.postMessage({
            type: 'init',
            recipe: document.getText(), // Get text from the correct document
            itemRegistry: { vanilla: vanillaItems, project: projectItems }
        });
    }
    
    /**
     * Writes the updated recipe JSON back to the correct file on disk.
     * This is now a private helper method that requires the correct document to be passed in.
     */
    private async updateDocument(document: vscode.TextDocument, recipeJson: any): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        // Replace the entire content of the correct document
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), JSON.stringify(recipeJson, null, 2));
        
        try {
            await vscode.workspace.applyEdit(edit);
            // We don't need to explicitly save; applyEdit marks the file as dirty.
            // This gives the user control over saving.
            // To force a save, you could uncomment the next line:
            // await document.save();
            vscode.window.showInformationMessage(`Updated ${vscode.workspace.asRelativePath(document.uri)}`);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Error saving recipe: ${e.message}`);
        }
    }
}

/**
 * Provides access to the clearCache function for the command registered in extension.ts.
 */
export async function clearVanillaCache(): Promise<void> {
    return VanillaDataService.clearCache();
}