// src/services/BlockGenerator.ts

import * as vscode from 'vscode';
import { IBlockOptions } from '../types/BlockOptions';

export class BlockGenerator {
    private textureShortName: string;

    constructor(private options: IBlockOptions, private extensionUri: vscode.Uri) {
        this.textureShortName = this.options.texture.endsWith('.png')
            ? this.options.texture.slice(0, -4)
            : this.options.texture;
    }

    public async generate() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage('You must have a project open to create a block.');
            return;
        }
        
        const rootFolder = folders[0];
        const configFileUri = vscode.Uri.joinPath(rootFolder.uri, 'addoncrate.json');
        let config;

        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            config = JSON.parse(Buffer.from(rawContent).toString('utf8'));
        } catch (error) {
            vscode.window.showErrorMessage('Could not find a valid "addoncrate.json" in the root of your project.');
            return;
        }

        if (!config.namespace || !config.packs?.behavior || !config.packs?.resource) {
            vscode.window.showErrorMessage('Your "addoncrate.json" must define a "namespace", a "behavior" pack, and a "resource" pack.');
            return;
        }
        
        const bpFolderUri = vscode.Uri.joinPath(rootFolder.uri, config.packs.behavior);
        const rpFolderUri = vscode.Uri.joinPath(rootFolder.uri, config.packs.resource);
        const fullIdentifier = `${config.namespace}:${this.options.identifier}`;

        await this._generateBehaviorPackFile(bpFolderUri, fullIdentifier);
        await this._updateResourcePackFiles(rpFolderUri, fullIdentifier);
        await this._updateLanguageFile(bpFolderUri, fullIdentifier);

        vscode.window.showInformationMessage(`Successfully created block "${fullIdentifier}"!`);
    }

    private async _generateBehaviorPackFile(bpFolderUri: vscode.Uri, fullIdentifier: string) {
        await this._createDirectory(bpFolderUri, 'blocks');
        const blockFileUri = vscode.Uri.joinPath(bpFolderUri, 'blocks', `${this.options.identifier}.json`);

        const blockJson = {
            "format_version": "1.21.0",
            "minecraft:block": {
                "description": {
                    "identifier": fullIdentifier
                },
                "components": {
                    "minecraft:display_name": `tile.${fullIdentifier}.name`,
                    "minecraft:destructible_by_mining": { "seconds_to_destroy": this.options.destroyTime },
                    "minecraft:destructible_by_explosion": { "explosion_resistance": this.options.explosionResistance },
                    "minecraft:friction": this.options.friction,
                    "minecraft:light_emission": this.options.lightEmission,
                    "minecraft:light_dampening": this.options.lightDampening,
                    "minecraft:map_color": this.options.mapColor,
                    "minecraft:material_instances": {
                        "*": {
                            "texture": this.textureShortName,
                            "render_method": "opaque"
                        }
                    }
                }
            }
        };

        await this._writeFile(blockFileUri, JSON.stringify(blockJson, null, 4));
    }

    private async _updateResourcePackFiles(rpFolderUri: vscode.Uri, fullIdentifier: string) {
        // 1. Update/Create textures/terrain_texture.json
        const terrainTextureUri = vscode.Uri.joinPath(rpFolderUri, 'textures/terrain_texture.json');
        let terrainTextureJson: any = { resource_pack_name: "vanilla", texture_name: "atlas.terrain", texture_data: {} };
        try {
            const rawContent = await vscode.workspace.fs.readFile(terrainTextureUri);
            terrainTextureJson = JSON.parse(Buffer.from(rawContent).toString('utf8'));
        } catch (e) { /* File doesn't exist, will be created */ }
        
        terrainTextureJson.texture_data[this.textureShortName] = {
            textures: `textures/blocks/${this.textureShortName}`
        };
        await this._writeFile(terrainTextureUri, JSON.stringify(terrainTextureJson, null, 4));

        // 2. Update/Create blocks.json
        const blocksJsonUri = vscode.Uri.joinPath(rpFolderUri, 'blocks.json');
        let blocksJson: any = { "format_version": [1, 1, 0] };
        try {
            const rawContent = await vscode.workspace.fs.readFile(blocksJsonUri);
            blocksJson = JSON.parse(Buffer.from(rawContent).toString('utf8'));
        } catch (e) { /* File doesn't exist, will be created */ }

        blocksJson[fullIdentifier] = {
            "sound": this.options.material,
            "textures": this.textureShortName
        };
        await this._writeFile(blocksJsonUri, JSON.stringify(blocksJson, null, 4));

        // 3. Copy user texture or create placeholder texture if it doesn't exist
        const textureDestUri = vscode.Uri.joinPath(rpFolderUri, `textures/blocks/${this.textureShortName}.png`);
        try {
            await vscode.workspace.fs.stat(textureDestUri);
        } catch (e) {
            await this._createDirectory(rpFolderUri, 'textures/blocks');
            if (this.options.texturePath) {
                const sourceUri = vscode.Uri.file(this.options.texturePath);
                await vscode.workspace.fs.copy(sourceUri, textureDestUri, { overwrite: true });
            } else {
                const defaultTextureUri = vscode.Uri.joinPath(this.extensionUri, 'dist', 'assets', 'default_pack_icon.png');
                await vscode.workspace.fs.copy(defaultTextureUri, textureDestUri);
            }
        }
    }

    private async _updateLanguageFile(bpFolderUri: vscode.Uri, fullIdentifier: string) {
        await this._createDirectory(bpFolderUri, 'texts');
        const langFileUri = vscode.Uri.joinPath(bpFolderUri, 'texts', 'en_US.lang');
        const newEntry = `\ntile.${fullIdentifier}.name=${this.options.displayName}`;
        
        try {
            const existingContent = await vscode.workspace.fs.readFile(langFileUri);
            const newContent = Buffer.concat([existingContent, Buffer.from(newEntry, 'utf8')]);
            await this._writeFile(langFileUri, newContent);
        } catch (e) {
            await this._writeFile(langFileUri, newEntry.trim());
        }
    }

    private async _createDirectory(root: vscode.Uri, dirPath: string) {
        if (dirPath === '.') return;
        const parts = dirPath.split('/');
        let current = root;
        for (const part of parts) {
            current = vscode.Uri.joinPath(current, part);
            try {
                await vscode.workspace.fs.createDirectory(current);
            } catch (e) { /* Directory likely already exists */ }
        }
    }

    private async _writeFile(uri: vscode.Uri, content: string | Uint8Array) {
        const buffer: Uint8Array = typeof content === 'string'
            ? new TextEncoder().encode(content)
            : content;
        
        try {
            await vscode.workspace.fs.writeFile(uri, buffer);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to write file: ${uri.fsPath}. ${e.message}`);
        }
    }
}