// src/commands/createEntityCommand.ts

import * as vscode from 'vscode';
import { EntityCreatorPanel } from '../features/entityCreator/EntityCreatorPanel';

/**
 * Registers the 'addoncrate-creator.createEntity' command in VS Code.
 * When executed, this command will open the Entity Creator webview panel.
 */
export function registerCreateEntityCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.createEntity';

    const commandHandler = () => {
        // When the command is executed, create and show the entity creator panel
        EntityCreatorPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}