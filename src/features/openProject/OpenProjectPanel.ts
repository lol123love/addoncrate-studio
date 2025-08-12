// src/features/openProject/OpenProjectPanel.ts

import * as vscode from 'vscode';
import { getOpenProjectHtml } from './webview/getOpenProjectHtml';
import { Logger } from '../../services/Logger';

interface IProject {
    name: string;
    folderPath: string; // The full filesystem path to the project's root folder
    iconUri?: vscode.Uri; // The special, webview-safe URI for the icon
}

export class OpenProjectPanel {
    public static currentPanel: OpenProjectPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, projects: IProject[]) {
        this._panel = panel;
        this._panel.webview.html = getOpenProjectHtml(panel.webview, extensionUri, projects);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.type === 'openProject') {
                    const projectUri = vscode.Uri.file(message.path);
                    await vscode.commands.executeCommand('vscode.openFolder', projectUri, { forceNewWindow: false });
                    this.dispose();
                }
            },
            null,
            this._disposables
        );
    }

    public static async createAndShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (OpenProjectPanel.currentPanel) {
            OpenProjectPanel.currentPanel._panel.reveal(column);
            return;
        }
        
        const projectsRoot = vscode.workspace.getConfiguration('addoncrate').get<string>('projects.location');
        if (!projectsRoot) {
            vscode.window.showErrorMessage('A default projects location is not set. Please set one via the "Set Projects Location" command.');
            return;
        }
        
        const projectsRootUri = vscode.Uri.file(projectsRoot);
        Logger.initialize(); // Ensure the output channel is ready

        const panel = vscode.window.createWebviewPanel(
            'openProject', 
            'AddonCrate: Open Project', 
            column || vscode.ViewColumn.One, 
            { 
                enableScripts: true,
                // **FIX & EXPLANATION**: This is the crucial security step.
                // We are telling VS Code that our webview is ONLY allowed to load resources
                // from the extension's own directory (`extensionUri`) and from the user's
                // configured projects folder (`projectsRootUri`). If an icon's path is not
                // inside one of these folders, it will be blocked and appear as a broken image.
                localResourceRoots: [extensionUri, projectsRootUri]
            }
        );

        const projects = await this._findProjects(projectsRootUri, panel.webview);
        OpenProjectPanel.currentPanel = new OpenProjectPanel(panel, extensionUri, projects);
    }

    private static async _findProjects(projectsRootUri: vscode.Uri, webview: vscode.Webview): Promise<IProject[]> {
        const foundProjects: IProject[] = [];
        Logger.log(`Scanning for projects in: ${projectsRootUri.fsPath}`);

        try {
            const entries = await vscode.workspace.fs.readDirectory(projectsRootUri);
            for (const [name, type] of entries) {
                if (type === vscode.FileType.Directory) {
                    const projectFolderUri = vscode.Uri.joinPath(projectsRootUri, name);
                    const configFileUri = vscode.Uri.joinPath(projectFolderUri, 'addoncrate.json');

                    try {
                        const rawContent = await vscode.workspace.fs.readFile(configFileUri);
                        const config = JSON.parse(Buffer.from(rawContent).toString('utf8'));
                        let projectIconUri: vscode.Uri | undefined;
                        
                        // **FIX & EXPLANATION**: The logic to find the icon is now wrapped in more
                        // detailed logging to help diagnose issues in a user's specific environment.
                        const findIcon = async (packPath: string | undefined, packType: 'RP' | 'BP'): Promise<vscode.Uri | undefined> => {
                            if (!packPath) return undefined;
                            try {
                                const potentialIconPath = vscode.Uri.joinPath(projectFolderUri, packPath, 'pack_icon.png');
                                // First, check if the file actually exists on disk.
                                await vscode.workspace.fs.stat(potentialIconPath);
                                // If it exists, convert it to the special webview URL format.
                                // This is the step that generates the 'vscode-resource' URL.
                                Logger.log(`Found icon for '${config.name || name}' in ${packType} at: ${potentialIconPath.fsPath}`);
                                return webview.asWebviewUri(potentialIconPath);
                            } catch (e) {
                                // This catch block will trigger if `stat` fails (file not found).
                                Logger.log(`Icon not found in ${packType} for project '${config.name || name}'.`);
                                return undefined;
                            }
                        };

                        // We prioritize the Resource Pack icon, then fall back to the Behavior Pack icon.
                        projectIconUri = await findIcon(config.packs?.resource, 'RP');
                        if (!projectIconUri) {
                            projectIconUri = await findIcon(config.packs?.behavior, 'BP');
                        }

                        foundProjects.push({
                            name: config.name || name,
                            folderPath: projectFolderUri.fsPath,
                            iconUri: projectIconUri,
                        });

                    } catch {
                        // Not a valid AddonCrate project (no addoncrate.json), skip it silently.
                    }
                }
            }
        } catch (e: any) {
            const errorMessage = `Failed to scan for projects: ${e.message}`;
            Logger.log(errorMessage);
            vscode.window.showErrorMessage(errorMessage);
        }

        Logger.log(`Found ${foundProjects.length} projects.`);
        return foundProjects.sort((a, b) => a.name.localeCompare(b.name));
    }

    public dispose() {
        OpenProjectPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }
}