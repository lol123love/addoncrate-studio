// src/features/entityCreator/EntityCreatorPanel.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { getEntityCreatorHtml } from './webview/getEntityCreatorHtml';
import { EntityGenerator } from '../../services/EntityGenerator';
import { IEntityOptions } from '../../types/EntityOptions';

export class EntityCreatorPanel {
    public static currentPanel: EntityCreatorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _rpFolderUri: vscode.Uri;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, namespace: string, rpFolderUri: vscode.Uri) {
        this._panel = panel;
        this._rpFolderUri = rpFolderUri;
        this._extensionUri = extensionUri;
        this._panel.webview.html = getEntityCreatorHtml(panel.webview, extensionUri, namespace);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'createEntity':
                        const generator = new EntityGenerator(message.data as IEntityOptions, this._extensionUri);
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

    private async handleFileSelection(fileType: 'model' | 'animation' | 'animationController' | 'texture') {
        let targetFolder: vscode.Uri;
        const dialogOptions: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select File',
        };

        switch (fileType) {
            case 'texture':
                targetFolder = vscode.Uri.joinPath(this._rpFolderUri, 'textures/entity');
                dialogOptions.defaultUri = targetFolder;
                dialogOptions.filters = { 'Images': ['png'] };
                break;
            case 'model':
                targetFolder = vscode.Uri.joinPath(this._rpFolderUri, 'models/entity');
                dialogOptions.defaultUri = targetFolder;
                dialogOptions.filters = { 'Geometry Files': ['geo.json'] };
                break;
            case 'animation':
                targetFolder = vscode.Uri.joinPath(this._rpFolderUri, 'animations');
                dialogOptions.defaultUri = targetFolder;
                dialogOptions.filters = { 'Animation Files': ['animation.json'] };
                break;
            case 'animationController':
                targetFolder = vscode.Uri.joinPath(this._rpFolderUri, 'animation_controllers');
                dialogOptions.defaultUri = targetFolder;
                dialogOptions.filters = { 'Animation Controller Files': ['controller.json'] };
                break;
        }

        const uris = await vscode.window.showOpenDialog(dialogOptions);
        if (uris && uris.length > 0) {
            const sourceUri = uris[0];
            const fileName = path.basename(sourceUri.fsPath);

            this._panel.webview.postMessage({
                type: 'fileSelected',
                fileType: fileType,
                fileName: fileName,
                fsPath: sourceUri.fsPath,
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
                throw new Error('Namespace or resource pack path not found in addoncrate.json');
            }
            namespace = config.namespace;
            rpFolderUri = vscode.Uri.joinPath(rootFolder.uri, config.packs.resource);
        } catch (e) {
            vscode.window.showErrorMessage('Could not find a valid "addoncrate.json" with a "namespace" and "packs.resource" in your project root.');
            return;
        }

        // FIX: Corrected typo 'now' to 'currentPanel' and fixed undefined check.
        if (EntityCreatorPanel.currentPanel) {
            EntityCreatorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel('entityCreator', 'AddonCrate: New Entity', column || vscode.ViewColumn.One, { 
            enableScripts: true,
            localResourceRoots: [extensionUri, rootFolder.uri]
        });

        EntityCreatorPanel.currentPanel = new EntityCreatorPanel(panel, extensionUri, namespace, rpFolderUri);
    }

    public dispose() {
        EntityCreatorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}