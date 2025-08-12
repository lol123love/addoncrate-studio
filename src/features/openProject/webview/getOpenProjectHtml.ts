// src/features/openProject/webview/getOpenProjectHtml.ts

import * as vscode from 'vscode';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

interface IProject {
    name: string;
    folderPath: string;
    iconUri?: vscode.Uri;
}

export function getOpenProjectHtml(webview: vscode.Webview, extensionUri: vscode.Uri, projects: IProject[]): string {
    const defaultIconSvg = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'assets', 'default_pack_icon.png'));

    const projectListHtml = projects.map(p => `
        <button class="project-item" data-path="${p.folderPath}">
            <div class="project-icon">
                <img src="${p.iconUri || defaultIconSvg}" alt="${p.name} icon">
            </div>
            <div class="project-details">
                <div class="project-name">${p.name}</div>
                <div class="project-path">${p.folderPath}</div>
            </div>
        </button>
    `).join('');

    const body = `
        <h1>Open Project</h1>
        <p class="label-description" style="margin-bottom: 1.5rem;">
            Select a project from your default projects directory to open it.
        </p>
        <div class="project-list-container">
            ${projects.length > 0 ? projectListHtml : '<p>No projects found in the configured location.</p>'}
        </div>
    `;

    const script = `
        document.querySelectorAll('.project-item').forEach(card => {
            card.addEventListener('click', () => {
                vscode.postMessage({
                    type: 'openProject',
                    path: card.dataset.path
                });
            });
        });
    `;

    // The inline <style> block has been removed from here.
    // The styles are now loaded from the main.css file via getWebviewHtml.
    return getWebviewHtml(webview, extensionUri, {
        title: 'Open Project',
        body: body,
        script: script
    });
}