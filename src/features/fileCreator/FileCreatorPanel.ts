// src/features/fileCreator/FileCreatorPanel.ts

import * as vscode from 'vscode';
import { getFileCreatorHtml } from './webview/getFileCreatorHtml';
import { FileGenerator } from '../../services/FileGenerator';
import { IFileOptions } from '../../types/FileOptions';

export class FileCreatorPanel {
    public static currentPanel: FileCreatorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = getFileCreatorHtml(panel.webview, extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'createFile':
                        const generator = new FileGenerator(message.data as IFileOptions);
                        await generator.generate();
                        this.dispose();
                        return;
                    
                    // Handle error messages from the webview
                    case 'showError':
                        vscode.window.showErrorMessage(message.message);
                        return;
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

        if (FileCreatorPanel.currentPanel) {
            FileCreatorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel('fileCreator', 'AddonCrate: New File', column || vscode.ViewColumn.One, { 
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });

        FileCreatorPanel.currentPanel = new FileCreatorPanel(panel, extensionUri);
    }

    public dispose() {
        FileCreatorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }
}