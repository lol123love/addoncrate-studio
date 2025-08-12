// src/features/modelViewer/ModelViewerProvider.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { getModelViewerHtml } from './webview/getModelViewerHtml';

interface Texture {
    name: string;
    uri: string;
}

interface Animation {
    name: string;
    content: string;
}

export class ModelViewerProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'addoncrate.modelViewer';

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new ModelViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(ModelViewerProvider.viewType, provider);
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.context.extensionUri,
                // Allow loading resources from the entire workspace
                ...vscode.workspace.workspaceFolders?.map(f => f.uri) ?? []
            ]
        };
        webviewPanel.webview.html = getModelViewerHtml(webviewPanel.webview, this.context.extensionUri);

        const updateWebview = () => {
            webviewPanel.webview.postMessage({
                type: 'update',
                text: document.getText(),
            });
        };

        webviewPanel.webview.onDidReceiveMessage(async e => {
            if (e.type === 'ready') {
                const modelContent = document.getText();
                let modelIdentifier = '';
                try {
                    const geo = JSON.parse(modelContent);
                    modelIdentifier = geo['minecraft:geometry']?.[0]?.description?.identifier ?? '';
                } catch {
                    // Ignore parsing errors, identifier will be empty
                }

                const textures = await this._findProjectTextures(webviewPanel.webview);
                const animations = await this._findProjectAnimations();
                
                webviewPanel.webview.postMessage({
                    type: 'init',
                    text: modelContent,
                    textures: textures,
                    animations: animations,
                    modelIdentifier: modelIdentifier // Pass identifier to webview for sorting
                });
            }
        });

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    private async _findProjectRoot(): Promise<vscode.Uri | undefined> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) return undefined;
        return folders[0].uri;
    }

    private async _readResourcePackPath(): Promise<string | undefined> {
        const rootFolder = await this._findProjectRoot();
        if (!rootFolder) return undefined;

        const configFileUri = vscode.Uri.joinPath(rootFolder, 'addoncrate.json');
        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            const config = JSON.parse(Buffer.from(rawContent).toString('utf8'));
            return config.packs?.resource;
        } catch {
            return undefined;
        }
    }

    private async _findProjectTextures(webview: vscode.Webview): Promise<Texture[]> {
        const rootFolder = await this._findProjectRoot();
        const rpPath = await this._readResourcePackPath();
        if (!rootFolder || !rpPath) return [];

        const rpFolderUri = vscode.Uri.joinPath(rootFolder, rpPath);
        const textureBaseFolders = [
            vscode.Uri.joinPath(rpFolderUri, 'textures') // Scan the entire textures folder
        ];
        
        const allTextures: Texture[] = [];
        for (const folder of textureBaseFolders) {
            const texturesInFolder = await this._scanFolderForTexturesRecursive(folder, rpFolderUri, webview);
            allTextures.push(...texturesInFolder);
        }
        return allTextures;
    }

    private async _scanFolderForTexturesRecursive(folderUri: vscode.Uri, rpRootUri: vscode.Uri, webview: vscode.Webview): Promise<Texture[]> {
        const allTextures: Texture[] = [];
        
        const scan = async (currentFolder: vscode.Uri) => {
            try {
                const entries = await vscode.workspace.fs.readDirectory(currentFolder);
                for (const [name, type] of entries) {
                    const entryUri = vscode.Uri.joinPath(currentFolder, name);
                    if (type === vscode.FileType.File && (name.endsWith('.png') || name.endsWith('.tga'))) {
                        const relativePath = path.relative(rpRootUri.fsPath, entryUri.fsPath).replace(/\\/g, '/');
                        allTextures.push({
                            name: relativePath,
                            uri: webview.asWebviewUri(entryUri).toString(),
                        });
                    } else if (type === vscode.FileType.Directory) {
                        await scan(entryUri); // Recurse into subdirectories
                    }
                }
            } catch {
                // Folder might not exist or we don't have permissions, which is fine.
            }
        };

        await scan(folderUri);
        return allTextures;
    }

    private async _findProjectAnimations(): Promise<Animation[]> {
        const rootFolder = await this._findProjectRoot();
        const rpPath = await this._readResourcePackPath();
        if (!rootFolder || !rpPath) return [];

        const animationsFolderUri = vscode.Uri.joinPath(rootFolder, rpPath, 'animations');
        const allAnimations: Animation[] = [];

        try {
            const entries = await vscode.workspace.fs.readDirectory(animationsFolderUri);
            for (const [name, type] of entries) {
                if (type === vscode.FileType.File && name.endsWith('.json')) {
                    const fileUri = vscode.Uri.joinPath(animationsFolderUri, name);
                    const rawContent = await vscode.workspace.fs.readFile(fileUri);
                    const content = Buffer.from(rawContent).toString('utf8');
                    allAnimations.push({
                        name: name,
                        content: content
                    });
                }
            }
        } catch {
            // animations folder might not exist
        }
        return allAnimations;
    }
}