// src/commands/createItemCommand.ts

import * as vscode from 'vscode';
import { ItemCreatorPanel } from '../features/itemCreator/ItemCreatorPanel';

export function registerCreateItemCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.createItem';

    const commandHandler = () => {
        // When the command is executed, create and show the item creator panel
        ItemCreatorPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}