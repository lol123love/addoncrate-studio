// src/features/projectCreator/ProjectCreatorPanel.ts

import * as vscode from 'vscode';
import { getProjectCreatorHtml } from './webview/getProjectCreatorHtml';
import { ProjectGenerator } from '../../services/ProjectGenerator';
import { IProjectOptions } from '../../types/ProjectOptions';

/**
 * Manages the webview panel for creating a new addon project.
 * This class is responsible for creating, showing, and communicating with the UI.
 */
export class ProjectCreatorPanel {
    public static currentPanel: ProjectCreatorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html = getProjectCreatorHtml(this._panel.webview, this._extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview (i.e., form submissions and button clicks)
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'createProject':
                        try {
                            // --- THIS IS THE FIX ---
                            // Pass the extension's URI to the generator so it can find the default icon.
                            const generator = new ProjectGenerator(message.data as IProjectOptions, this._extensionUri);
                            await generator.generate();
                            this.dispose(); // Close panel on successful project creation
                        } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                            vscode.window.showErrorMessage(`Failed to create project: ${errorMessage}`);
                        }
                        return;

                    case 'command':
                        vscode.commands.executeCommand(message.command);
                        return;
                    
                    case 'selectPackIcon':
                        this.handleIconSelection();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private async handleIconSelection() {
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Pack Icon',
            filters: { 'Images': ['png'] }
        });

        if (uris && uris.length > 0) {
            const fileUri = uris[0];
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const dataUri = `data:image/png;base64,${Buffer.from(fileContent).toString('base64')}`;
            
            this._panel.webview.postMessage({
                type: 'packIconSelected',
                fsPath: fileUri.fsPath,
                dataUri: dataUri
            });
        }
    }
    
    /**
     * Creates a new ProjectCreatorPanel or reveals an existing one.
     * @param extensionUri The URI of the extension's root directory.
     */
    public static createAndShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (ProjectCreatorPanel.currentPanel) {
            ProjectCreatorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'projectCreator',
            'AddonCrate: New Project',
            column || vscode.ViewColumn.One,
            { 
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        ProjectCreatorPanel.currentPanel = new ProjectCreatorPanel(panel, extensionUri);
    }

    /**
     * Cleans up resources when the panel is closed.
     */
    public dispose() {
        ProjectCreatorPanel.currentPanel = undefined;

        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}