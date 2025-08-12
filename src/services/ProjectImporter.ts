// src/services/ProjectImporter.ts

import * as vscode from 'vscode';
import { IImportOptions } from '../types/ImportOptions';

export class ProjectImporter {
    constructor(private options: IImportOptions) {}

    public async import() {
        if (!this.options.saveLocation) {
            vscode.window.showErrorMessage('A save location must be provided.');
            return;
        }

        const saveUri = vscode.Uri.file(this.options.saveLocation);
        const projectRootUri = vscode.Uri.joinPath(saveUri, this.options.projectName);

        try {
            await vscode.workspace.fs.stat(projectRootUri);
            vscode.window.showErrorMessage(`A project folder named "${this.options.projectName}" already exists at this location.`);
            return;
        } catch {
            // Folder doesn't exist, which is good.
        }

        await vscode.workspace.fs.createDirectory(projectRootUri);

        const bpFolderName = this.options.bpPath ? `${this.options.projectName}_BP` : undefined;
        const rpFolderName = this.options.rpPath ? `${this.options.projectName}_RP` : undefined;

        try {
            // Copy packs
            if (this.options.bpPath && bpFolderName) {
                const source = vscode.Uri.file(this.options.bpPath);
                const dest = vscode.Uri.joinPath(projectRootUri, bpFolderName);
                await vscode.workspace.fs.copy(source, dest, { overwrite: false });
            }
            if (this.options.rpPath && rpFolderName) {
                const source = vscode.Uri.file(this.options.rpPath);
                const dest = vscode.Uri.joinPath(projectRootUri, rpFolderName);
                await vscode.workspace.fs.copy(source, dest, { overwrite: false });
            }
        
            // Create config file
            await this._createProjectConfig(projectRootUri, bpFolderName, rpFolderName);

            const selection = await vscode.window.showInformationMessage(`Successfully imported project "${this.options.projectName}"!`, 'Open Project');
            if (selection === 'Open Project') {
                await vscode.commands.executeCommand('vscode.openFolder', projectRootUri, { forceNewWindow: false });
            }
        } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to import project: ${e.message}`);
        }
    }

    private async _createProjectConfig(rootUri: vscode.Uri, bpFolder?: string, rpFolder?: string) {
        const config = {
            name: this.options.projectName,
            author: this.options.author,
            namespace: this.options.namespace,
            targetVersion: "1.21.0", 
            packs: {
                behavior: bpFolder,
                resource: rpFolder,
            }
        };

        const configUri = vscode.Uri.joinPath(rootUri, 'addoncrate.json');
        const content = Buffer.from(JSON.stringify(config, null, 4), 'utf8');
        await vscode.workspace.fs.writeFile(configUri, content);
    }
}