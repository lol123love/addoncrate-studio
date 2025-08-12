// src/services/FileGenerator.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { IFileOptions } from '../types/FileOptions';
import { fileTypeMap } from '../data/fileTypes';

export class FileGenerator {
    constructor(private options: IFileOptions) {}

    public async generate() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage('You must have a project open to create a file.');
            return;
        }

        const fileTypeInfo = fileTypeMap.get(this.options.fileType);
        if (!fileTypeInfo) {
            vscode.window.showErrorMessage(`Unknown file type selected: ${this.options.fileType}`);
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

        const packFolder = fileTypeInfo.pack === 'BP' ? config.packs?.behavior : config.packs?.resource;
        if (!packFolder) {
            vscode.window.showErrorMessage(`Your "addoncrate.json" does not specify a ${fileTypeInfo.pack} location.`);
            return;
        }

        const targetFolderUri = vscode.Uri.joinPath(rootFolder.uri, packFolder, fileTypeInfo.path);
        const fileName = this.options.fileName.endsWith(fileTypeInfo.extension) 
            ? this.options.fileName 
            : `${this.options.fileName}${fileTypeInfo.extension}`;
        
        const finalFileUri = vscode.Uri.joinPath(targetFolderUri, fileName);

        try {
            await vscode.workspace.fs.stat(finalFileUri);
            vscode.window.showErrorMessage(`File already exists: ${fileName}`);
            return;
        } catch {
            // File doesn't exist, proceed.
        }

        const boilerplate = fileTypeInfo.getBoilerplate(this.options.fileName, config.namespace);
        
        try {
            await vscode.workspace.fs.createDirectory(targetFolderUri);
            await this._writeFile(finalFileUri, boilerplate);
            vscode.window.showInformationMessage(`Successfully created file: ${fileName}`);
            // Open the newly created file
            const document = await vscode.workspace.openTextDocument(finalFileUri);
            await vscode.window.showTextDocument(document);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to create file: ${e.message}`);
        }
    }

    private async _writeFile(uri: vscode.Uri, content: string | Uint8Array) {
        const buffer: Uint8Array = typeof content === 'string'
            ? new TextEncoder().encode(content)
            : content;
        
        await vscode.workspace.fs.writeFile(uri, buffer);
    }
}