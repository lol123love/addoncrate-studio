// src/commands/createFileCommand.ts

import * as vscode from 'vscode';
import { FileCreatorPanel } from '../features/fileCreator/FileCreatorPanel';

/**
 * Registers the 'addoncrate-creator.createFile' command in VS Code.
 */
export function registerCreateFileCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.createFile';

    const commandHandler = () => {
        FileCreatorPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}