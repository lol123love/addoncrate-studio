// src/commands/createBlockCommand.ts

import * as vscode from 'vscode';
import { BlockCreatorPanel } from '../features/blockCreator/BlockCreatorPanel';

/**
 * Registers the 'addoncrate-creator.createBlock' command in VS Code.
 * When executed, this command will open the Block Creator webview panel.
 */
export function registerCreateBlockCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.createBlock';

    const commandHandler = () => {
        BlockCreatorPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}