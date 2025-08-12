// src/commands/openProjectCommand.ts

import * as vscode from 'vscode';
import { OpenProjectPanel } from '../features/openProject/OpenProjectPanel';

/**
 * Registers the 'addoncrate-creator.openProject' command, which opens a UI
 * for the user to select one of their existing AddonCrate projects to open.
 */
export function registerOpenProjectCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.openProject';

    const commandHandler = () => {
        OpenProjectPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}