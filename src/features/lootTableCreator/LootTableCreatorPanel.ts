// src/features/lootTableCreator/LootTableCreatorPanel.ts

import * as vscode from 'vscode';
import { getLootTableCreatorHtml } from './webview/getLootTableCreatorHtml';
import { LootTableGenerator } from '../../services/LootTableGenerator';
import { ILootTableOptions } from '../../types/LootTableOptions';

export class LootTableCreatorPanel {
    public static currentPanel: LootTableCreatorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        // FIX: Removed extra empty string argument from the function call.
        this._panel.webview.html = getLootTableCreatorHtml(panel.webview, extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.type === 'createLootTable') {
                    const generator = new LootTableGenerator(message.data as ILootTableOptions);
                    await generator.generate();
                    this.dispose();
                }
            },
            null,
            this._disposables
        );
    }
    
    public static async createAndShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showErrorMessage("You must open a project folder first.");
            return;
        }

        if (LootTableCreatorPanel.currentPanel) {
            LootTableCreatorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel('lootTableCreator', 'AddonCrate: New Loot Table', column || vscode.ViewColumn.One, { 
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });

        LootTableCreatorPanel.currentPanel = new LootTableCreatorPanel(panel, extensionUri);
    }

    public dispose() {
        LootTableCreatorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }
}