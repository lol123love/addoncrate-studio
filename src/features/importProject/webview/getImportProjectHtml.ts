// src/features/importProject/webview/getImportProjectHtml.ts

import * as vscode from 'vscode';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

export function getImportProjectHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const projectsLocation = vscode.workspace.getConfiguration('addoncrate').get<string>('projects.location') || '';

    const body = `
        <h1>Import Existing Packs</h1>
        <p class="label-description" style="margin-bottom: 1.5rem;">Select existing pack folders to create a new AddonCrate project from them.</p>
        
        <form id="import-form">
            <fieldset class="fieldset">
                <legend class="legend">Project Metadata</legend>
                <p class="label-description">This information will be used to create the new 'addoncrate.json' file.</p>
                <label class="label" for="projectName">New Project Name</label>
                <input class="input" type="text" id="projectName" name="projectName" required placeholder="My Imported Project">
                
                <label class="label" for="author">Author Name</label>
                <input class="input" type="text" id="author" name="author" required placeholder="Your Name">

                <label class="label" for="namespace">Project Namespace</label>
                <input class="input" type="text" id="namespace" name="namespace" required placeholder="imported_project" pattern="[a-z0-9_]+">
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Pack Folders (Optional)</legend>
                <p class="label-description">Select the root folder for each pack you want to import. The folders will be copied into the new project.</p>

                <label class="label" for="bpPath">Behavior Pack Folder</label>
                <div class="file-input-group">
                    <input class="input" type="text" id="bpPath" name="bpPath" placeholder="C:/.../my_bp_folder">
                    <button type="button" class="btn btn-secondary folder-picker-btn" data-pack="behavior">Browse...</button>
                </div>

                <label class="label" for="rpPath">Resource Pack Folder</label>
                <div class="file-input-group">
                    <input class="input" type="text" id="rpPath" name="rpPath" placeholder="C:/.../my_rp_folder">
                    <button type="button" class="btn btn-secondary folder-picker-btn" data-pack="resource">Browse...</button>
                </div>
            </fieldset>
            
            <fieldset class="fieldset">
                <legend class="legend">Save Location</legend>
                <p class="label-description">Select the parent directory where the new project folder will be created.</p>
                 <label class="label" for="saveLocation">Save Projects To</label>
                <div class="file-input-group">
                    <input class="input" type="text" id="saveLocation" name="saveLocation" required value="${projectsLocation}" placeholder="C:/Users/You/Documents/AddonCrate Projects">
                    <button type="button" class="btn btn-secondary" id="location-picker-btn">Browse...</button>
                </div>
            </fieldset>

            <button type="submit" class="btn">Import Project</button>
        </form>
    `;

    const script = `
        const form = document.getElementById('import-form');

        document.querySelectorAll('.folder-picker-btn').forEach(button => {
            button.addEventListener('click', () => {
                vscode.postMessage({ type: 'selectFolder', packType: button.dataset.pack });
            });
        });
        
        document.getElementById('location-picker-btn').addEventListener('click', () => {
             vscode.postMessage({ type: 'selectFolder', packType: 'saveLocation' });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'folderSelected') {
                if(message.packType === 'behavior') form.bpPath.value = message.path;
                else if(message.packType === 'resource') form.rpPath.value = message.path;
                else if(message.packType === 'saveLocation') form.saveLocation.value = message.path;
            }
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!form.bpPath.value && !form.rpPath.value) {
                vscode.postMessage({
                    type: 'showError',
                    message: 'You must select at least one pack folder to import.'
                });
                return;
            }
            
            vscode.postMessage({
                type: 'importProject',
                data: {
                    projectName: form.projectName.value,
                    author: form.author.value,
                    namespace: form.namespace.value,
                    bpPath: form.bpPath.value || undefined,
                    rpPath: form.rpPath.value || undefined,
                    saveLocation: form.saveLocation.value
                }
            });
        });
    `;

    return getWebviewHtml(webview, extensionUri, {
        title: 'Import Project',
        body: body,
        script: script
    });
}