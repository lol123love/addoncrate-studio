// src/commands/createProjectCommand.ts
import * as vscode from 'vscode';
import { ProjectCreatorPanel } from '../features/projectCreator/ProjectCreatorPanel';

export function registerCreateProjectCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.createProject';

    const commandHandler = () => {
        ProjectCreatorPanel.createAndShow(context.extensionUri);
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}