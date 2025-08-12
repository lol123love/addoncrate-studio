// src/commands/createLootTableCommand.ts

import * as vscode from 'vscode';
import { LootTableCreatorPanel } from '../features/lootTableCreator/LootTableCreatorPanel';

/**
 * Registers the 'addoncrate-creator.createLootTable' command in VS Code.
 */
export function registerCreateLootTableCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.createLootTable';

    const commandHandler = () => {
        LootTableCreatorPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}