// src/features/importProject/ImportProjectPanel.ts

import * as vscode from 'vscode';
import { getImportProjectHtml } from './webview/getImportProjectHtml';
import { ProjectImporter } from '../../services/ProjectImporter';
import { IImportOptions } from '../../types/ImportOptions';

export class ImportProjectPanel {
    public static currentPanel: ImportProjectPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = getImportProjectHtml(panel.webview, extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'selectFolder':
                        this.handleFolderSelection(message.packType);
                        return;
                    case 'importProject':
                        const importer = new ProjectImporter(message.data as IImportOptions);
                        await importer.import();
                        this.dispose();
                        return;
                    case 'showError':
                        vscode.window.showErrorMessage(message.message);
                        return;
                }
            },
            null,
            this._disposables
        );
    }
    
    private async handleFolderSelection(packType: 'behavior' | 'resource' | 'saveLocation') {
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: `Select Folder`,
        });

        if (uris && uris.length > 0) {
            this._panel.webview.postMessage({
                type: 'folderSelected',
                packType: packType,
                path: uris[0].fsPath,
            });
        }
    }

    public static createAndShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (ImportProjectPanel.currentPanel) {
            ImportProjectPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel('importProject', 'AddonCrate: Import Project', column || vscode.ViewColumn.One, { 
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });

        ImportProjectPanel.currentPanel = new ImportProjectPanel(panel, extensionUri);
    }

    public dispose() {
        ImportProjectPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }
}