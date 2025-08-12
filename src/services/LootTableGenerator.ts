// src/services/LootTableGenerator.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { ILootTableOptions } from '../types/LootTableOptions';

export class LootTableGenerator {
    constructor(private options: ILootTableOptions) {}

    public async generate() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage('You must have a project open to create a loot table.');
            return;
        }
        
        const rootFolder = folders[0];
        const configFileUri = vscode.Uri.joinPath(rootFolder.uri, 'addoncrate.json');
        let config;

        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            config = JSON.parse(Buffer.from(rawContent).toString('utf8'));
        } catch (error) {
            vscode.window.showErrorMessage('Could not find a valid "addoncrate.json" in your project root.');
            return;
        }

        if (!config.packs?.behavior) {
            vscode.window.showErrorMessage('Your "addoncrate.json" must define a "behavior" pack location.');
            return;
        }
        
        const bpFolderUri = vscode.Uri.joinPath(rootFolder.uri, config.packs.behavior);
        const lootTableFolderUri = vscode.Uri.joinPath(bpFolderUri, 'loot_tables');
        
        // Ensure directory exists
        await vscode.workspace.fs.createDirectory(lootTableFolderUri);
        
        const fileName = this.options.fileName.endsWith('.json') ? this.options.fileName : `${this.options.fileName}.json`;
        const finalFileUri = vscode.Uri.joinPath(lootTableFolderUri, fileName);

        const lootTableJson = {
            pools: this.options.pools.map(pool => ({
                rolls: pool.rolls,
                entries: pool.entries.map(entry => {
                    const finalEntry: any = {
                        type: entry.type,
                        weight: entry.weight
                    };
                    if (entry.name) {
                        finalEntry.name = entry.name;
                    }
                    if (entry.functions) {
                        finalEntry.functions = entry.functions;
                    }
                    return finalEntry;
                })
            }))
        };
        
        try {
            await this._writeFile(finalFileUri, JSON.stringify(lootTableJson, null, 4));
            vscode.window.showInformationMessage(`Successfully created loot table: ${fileName}`);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to create loot table: ${e.message}`);
        }
    }

    private async _writeFile(uri: vscode.Uri, content: string | Uint8Array) {
        const buffer: Uint8Array = typeof content === 'string'
            ? new TextEncoder().encode(content)
            : content;
        
        await vscode.workspace.fs.writeFile(uri, buffer);
    }
}