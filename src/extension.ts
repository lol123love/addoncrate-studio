import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { registerCreateProjectCommand } from './commands/createProjectCommand';
import { registerSetProjectsLocationCommand } from './commands/setProjectsLocationCommand';
import { registerCreateItemCommand } from './commands/createItemCommand';
import { registerCreateEntityCommand } from './commands/createEntityCommand';
import { registerCreateBlockCommand } from './commands/createBlockCommand';
import { registerCreateLootTableCommand } from './commands/createLootTableCommand';
import { registerCreateFileCommand } from './commands/createFileCommand';
import { registerImportProjectCommand } from './commands/importProjectCommand';
import { registerExportProjectCommand } from './commands/exportProjectCommand';
import { registerOpenProjectCommand } from './commands/openProjectCommand';
import { ModelViewerProvider } from './features/modelViewer/ModelViewerProvider';
import { RecipeEditorProvider, clearVanillaCache } from './features/recipeEditor/RecipeEditorProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('AddonCrate Creator is active!');

    // Register all commands
    registerCreateProjectCommand(context);
    registerOpenProjectCommand(context);
    registerImportProjectCommand(context);
    registerExportProjectCommand(context);
    registerSetProjectsLocationCommand(context);
    registerCreateFileCommand(context);
    registerCreateItemCommand(context);
    registerCreateEntityCommand(context);
    registerCreateBlockCommand(context);
    registerCreateLootTableCommand(context);

    // Register clear cache command
    context.subscriptions.push(
      vscode.commands.registerCommand('addoncrate.clearVanillaCache', async () => {
        try {
          await clearVanillaCache();
          vscode.window.showInformationMessage('Vanilla item cache cleared.');
        } catch (err: any) {
          vscode.window.showErrorMessage('Failed to clear vanilla item cache: ' + (err?.message ?? err));
        }
      })
    );

    // Register Custom Editor Provider for 3D models & recipe editor
    context.subscriptions.push(ModelViewerProvider.register(context));
    context.subscriptions.push(RecipeEditorProvider.register(context));

    // Register the sidebar webview provider
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("addoncrateCreatorView", sidebarProvider)
    );
}

export function deactivate() {}
