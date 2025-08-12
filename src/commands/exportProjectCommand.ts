// src/commands/exportProjectCommand.ts

import * as vscode from 'vscode';
import * as path from 'path';
// FIX: Changed from namespace import to default import
import JSZip from 'jszip';

/**
 * Recursively adds all files and subdirectories from a given folder URI to a JSZip instance.
 * @param zip The JSZip instance to add files to.
 * @param folderUri The URI of the folder to add.
 * @param rootFolderName The name of the root folder within the zip archive.
 */
async function addFolderToZip(zip: JSZip, folderUri: vscode.Uri, rootFolderName: string) {
    // The error on this line is resolved by fixing the import.
    // 'zip.folder()' returns another JSZip instance representing the subfolder.
    const folderZip = zip.folder(rootFolderName);
    if (!folderZip) {
        // This should not happen if the folderName is valid, but it's a good guard clause.
        throw new Error(`Could not create folder in zip: ${rootFolderName}`);
    }

    const files = await vscode.workspace.fs.readDirectory(folderUri);

    for (const [fileName, fileType] of files) {
        const fileUri = vscode.Uri.joinPath(folderUri, fileName);
        if (fileType === vscode.FileType.File) {
            const content = await vscode.workspace.fs.readFile(fileUri);
            folderZip.file(fileName, content);
        } else if (fileType === vscode.FileType.Directory) {
            await addFolderToZip(folderZip, fileUri, fileName);
        }
    }
}

/**
 * Registers the command to export the current project as a .mcaddon file.
 */
export function registerExportProjectCommand(context: vscode.ExtensionContext) {
    const command = 'addoncrate-creator.exportProject';

    const commandHandler = async () => {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showErrorMessage("You must have an AddonCrate project open to export.");
            return;
        }

        const rootFolder = folders[0];
        const configFileUri = vscode.Uri.joinPath(rootFolder.uri, 'addoncrate.json');
        let config;

        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            config = JSON.parse(Buffer.from(rawContent).toString('utf8'));
        } catch (error) {
            vscode.window.showErrorMessage('Could not find a valid "addoncrate.json" in your project root.');
            return;
        }

        const bpPath = config.packs?.behavior;
        const rpPath = config.packs?.resource;

        if (!bpPath && !rpPath) {
            vscode.window.showErrorMessage('Your "addoncrate.json" does not specify any packs to export.');
            return;
        }

        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.joinPath(rootFolder.uri, '..', `${config.name}.mcaddon`),
            filters: { 'Minecraft Addon': ['mcaddon'] }
        });

        // FIX: Added curly braces to satisfy ESLint 'curly' rule
        if (!saveUri) {
            return; // User cancelled
        }

        // FIX: Correctly instantiate JSZip using 'new' with the default import
        const zip = new JSZip();
        const progressOptions: vscode.ProgressOptions = {
            location: vscode.ProgressLocation.Notification,
            title: `Exporting "${config.name}.mcaddon"`,
            cancellable: false
        };

        await vscode.window.withProgress(progressOptions, async (progress) => {
            try {
                if (bpPath) {
                    progress.report({ message: 'Zipping Behavior Pack...' });
                    const bpFolderUri = vscode.Uri.joinPath(rootFolder.uri, bpPath);
                    await addFolderToZip(zip, bpFolderUri, path.basename(bpPath));
                }
                if (rpPath) {
                    progress.report({ message: 'Zipping Resource Pack...' });
                    const rpFolderUri = vscode.Uri.joinPath(rootFolder.uri, rpPath);
                    await addFolderToZip(zip, rpFolderUri, path.basename(rpPath));
                }

                progress.report({ message: 'Compressing file...' });
                const zipContent = await zip.generateAsync({
                    type: 'nodebuffer',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 9 }
                });

                await vscode.workspace.fs.writeFile(saveUri, zipContent);
                vscode.window.showInformationMessage(`Successfully exported project to "${path.basename(saveUri.fsPath)}"`);

            } catch (e: any) {
                vscode.window.showErrorMessage(`Failed to export project: ${e.message}`);
            }
        });
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}