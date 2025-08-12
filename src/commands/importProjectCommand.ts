// src/commands/importProjectCommand.ts

import * as vscode from 'vscode';
import { ImportProjectPanel } from '../features/importProject/ImportProjectPanel';

/**
 * Registers the 'addoncrate-creator.importProject' command, which opens a UI
 * to import existing Behavior and/or Resource packs into a new AddonCrate project.
 */
export function registerImportProjectCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.importProject';

    const commandHandler = () => {
        ImportProjectPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}