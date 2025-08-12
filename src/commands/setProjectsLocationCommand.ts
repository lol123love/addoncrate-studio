// src/commands/setProjectsLocationCommand.ts

import * as vscode from 'vscode';

export function registerSetProjectsLocationCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.setProjectsLocation';

    const commandHandler = async () => {
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Default Projects Folder'
        });

        if (uris && uris.length > 0) {
            const path = uris[0].fsPath;
            await vscode.workspace.getConfiguration('addoncrate').update('projects.location', path, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Default projects location set to: ${path}`);
        }
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}