// src/features/blockCreator/BlockCreatorPanel.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { getBlockCreatorHtml } from './webview/getBlockCreatorHtml';
import { BlockGenerator } from '../../services/BlockGenerator';
import { IBlockOptions } from '../../types/BlockOptions';

export class BlockCreatorPanel {
    public static currentPanel: BlockCreatorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _rpFolderUri: vscode.Uri;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, namespace: string, rpFolderUri: vscode.Uri) {
        this._panel = panel;
        this._rpFolderUri = rpFolderUri;
        this._extensionUri = extensionUri;
        this._panel.webview.html = getBlockCreatorHtml(panel.webview, extensionUri, namespace);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'createBlock':
                        // FIX: Pass the extension's URI to the generator.
                        const generator = new BlockGenerator(message.data as IBlockOptions, this._extensionUri);
                        await generator.generate();
                        this.dispose();
                        return;
                    
                    case 'selectFile':
                        this.handleFileSelection(message.fileType);
                        return;
                }
            },
            null,
            this._disposables
        );
    }
    
    private async handleFileSelection(fileType: 'texture') {
        const targetFolder = vscode.Uri.joinPath(this._rpFolderUri, 'textures', 'blocks');
        const dialogOptions: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select Texture',
            defaultUri: targetFolder,
            filters: { 'Images': ['png'] }
        };

        const uris = await vscode.window.showOpenDialog(dialogOptions);
        if (uris && uris.length > 0) {
            const sourceUri = uris[0];
            const fileName = path.basename(sourceUri.fsPath);

            this._panel.webview.postMessage({
                type: 'fileSelected',
                fileType: fileType,
                fileName: fileName.replace('.png', ''),
                fsPath: sourceUri.fsPath
            });
        }
    }

    public static async createAndShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showErrorMessage("You must open a project folder first.");
            return;
        }
        
        const rootFolder = folders[0];
        const configFileUri = vscode.Uri.joinPath(rootFolder.uri, 'addoncrate.json');
        let namespace = '';
        let rpFolderUri: vscode.Uri;

        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            const config = JSON.parse(Buffer.from(rawContent).toString('utf8'));
            if (!config.namespace || !config.packs?.resource) {
                throw new Error();
            }
            namespace = config.namespace;
            rpFolderUri = vscode.Uri.joinPath(rootFolder.uri, config.packs.resource);
        } catch (e) {
            vscode.window.showErrorMessage('Could not find a valid "addoncrate.json" with a "namespace" and "packs.resource" in your project root.');
            return;
        }

        if (BlockCreatorPanel.currentPanel) {
            BlockCreatorPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('blockCreator', 'AddonCrate: New Block', column || vscode.ViewColumn.One, { 
            enableScripts: true,
            localResourceRoots: [extensionUri, rootFolder.uri]
        });
        BlockCreatorPanel.currentPanel = new BlockCreatorPanel(panel, extensionUri, namespace, rpFolderUri);
    }

    public dispose() {
        BlockCreatorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            // FIX: Added curly braces to satisfy linter.
            if (x) {
                x.dispose();
            }
        }
    }
}