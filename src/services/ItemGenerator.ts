// src/services/ItemGenerator.ts

import * as vscode from 'vscode';
import { IItemOptions } from '../types/ItemOptions';

export class ItemGenerator {
    private iconShortName: string;
    private iconFileName: string;

    constructor(private options: IItemOptions, private extensionUri: vscode.Uri) {
        this.iconShortName = this.options.icon.endsWith('.png')
            ? this.options.icon.slice(0, -4)
            : this.options.icon;
        this.iconFileName = `${this.iconShortName}.png`;
    }

    public async generate() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage('You must have a project open to create an item.');
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

        await this._generateBehaviorPackFile(bpFolderUri, config.namespace);
        await this._generateResourcePackTextureAlias(rpFolderUri);
        await this._copyOrGeneratePlaceholderTexture(rpFolderUri);

        const finalIdentifier = `${config.namespace}:${this.options.itemId}`;
        const selection = await vscode.window.showInformationMessage(`Successfully created item "${finalIdentifier}" and linked textures!`, 'Open Item File');
        if (selection === 'Open Item File') {
            const itemFileUri = vscode.Uri.joinPath(bpFolderUri, 'items', `${this.options.itemId}.json`);
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(itemFileUri));
        }
    }

    private async _generateBehaviorPackFile(bpFolderUri: vscode.Uri, namespace: string) {
        const itemsFolderUri = vscode.Uri.joinPath(bpFolderUri, 'items');
        await vscode.workspace.fs.createDirectory(itemsFolderUri);

        const finalIdentifier = `${namespace}:${this.options.itemId}`;
        const itemFileUri = vscode.Uri.joinPath(itemsFolderUri, `${this.options.itemId}.json`);

        const itemJson: any = {
            "format_version": "1.21.0",
            "minecraft:item": {
                "description": { "identifier": finalIdentifier },
                "components": {}
            }
        };

        const { description, components } = itemJson["minecraft:item"];

        if (this.options.menuCategory) {
            description.menu_category = this.options.menuCategory;
        }

        components["minecraft:display_name"] = { value: this.options.displayName };
        components["minecraft:icon"] = { "texture": this.iconShortName };
        components["minecraft:max_stack_size"] = this.options.maxStackSize;
        if (this.options.handEquipped) components["minecraft:hand_equipped"] = true;
        if (this.options.foil) components["minecraft:foil"] = true;

        if (this.options.isTool.enabled) {
            components["minecraft:durability"] = { max_durability: this.options.isTool.durability };
            components["minecraft:damage"] = { value: this.options.isTool.damage };

            if (this.options.isTool.enchantable) {
                components["minecraft:enchantable"] = this.options.isTool.enchantable;
            }

            const repairItems = this.options.isTool.repairItems.split(',').map(s => s.trim()).filter(Boolean);
            if (repairItems.length > 0) {
                components["minecraft:repairable"] = {
                    repair_items: [{
                        items: repairItems,
                        repair_amount: "query.max_durability * 0.25"
                    }]
                };
            }
        }
        
        await this._writeFile(itemFileUri, JSON.stringify(itemJson, null, 4));
    }

    private async _generateResourcePackTextureAlias(rpFolderUri: vscode.Uri) {
        const itemTextureFileUri = vscode.Uri.joinPath(rpFolderUri, 'textures', 'item_texture.json');
        let textureJson: any = {
            resource_pack_name: "vanilla",
            texture_name: "atlas.items",
            texture_data: {}
        };

        try {
            const rawContent = await vscode.workspace.fs.readFile(itemTextureFileUri);
            textureJson = JSON.parse(Buffer.from(rawContent).toString('utf8'));
        } catch (e) {
            // File doesn't exist, which is fine.
        }

        textureJson.texture_data[this.iconShortName] = {
            textures: `textures/items/${this.iconShortName}`
        };

        await this._writeFile(itemTextureFileUri, JSON.stringify(textureJson, null, 4));
    }

    private async _copyOrGeneratePlaceholderTexture(rpFolderUri: vscode.Uri) {
        const texturesFolderUri = vscode.Uri.joinPath(rpFolderUri, 'textures', 'items');
        await vscode.workspace.fs.createDirectory(texturesFolderUri);
        const textureDestUri = vscode.Uri.joinPath(texturesFolderUri, this.iconFileName);

        try {
            await vscode.workspace.fs.stat(textureDestUri);
        } catch (e) {
            // File doesn't exist, so copy user file or default.
            if (this.options.iconPath) {
                const sourceUri = vscode.Uri.file(this.options.iconPath);
                await vscode.workspace.fs.copy(sourceUri, textureDestUri, { overwrite: true });
            } else {
                const defaultIconUri = vscode.Uri.joinPath(this.extensionUri, 'dist', 'assets', 'default_pack_icon.png');
                await vscode.workspace.fs.copy(defaultIconUri, textureDestUri);
            }
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