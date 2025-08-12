// src/sidebar/SidebarProvider.ts

import * as vscode from 'vscode';
import { getSidebarHtml } from './webview/getSidebarHtml';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = getSidebarHtml(webviewView.webview, this._extensionUri);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'command':
                    vscode.commands.executeCommand(data.command);
                    break;
                case 'webviewReady':
                    this.updateProjectStatus();
                    break;
            }
        });

        vscode.workspace.onDidChangeWorkspaceFolders(() => this.updateProjectStatus());
        // Also update if the config file itself changes
        vscode.workspace.onDidSaveTextDocument(e => {
            if (e.fileName.endsWith('addoncrate.json')) {
                this.updateProjectStatus();
            }
        });
    }

    public async updateProjectStatus() {
        if (!this._view) return;

        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            this._view.webview.postMessage({
                type: 'updateProjectStatus',
                name: 'No Project Open',
                packs: ['Use a creation tool to get started.'],
            });
            return;
        }

        const rootFolder = folders[0];
        const configFileUri = vscode.Uri.joinPath(rootFolder.uri, 'addoncrate.json');

        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            const config = JSON.parse(Buffer.from(rawContent).toString('utf8'));

            const detectedPacks: string[] = [];
            if (config.packs?.behavior) detectedPacks.push('Behavior Pack');
            if (config.packs?.resource) detectedPacks.push('Resource Pack');

            this._view.webview.postMessage({
                type: 'updateProjectStatus',
                name: config.name || rootFolder.name,
                packs: detectedPacks,
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'updateProjectStatus',
                name: 'No AddonCrate Project Detected',
                packs: ['Open a folder containing an "addoncrate.json" file.'],
            });
        }
    }
}