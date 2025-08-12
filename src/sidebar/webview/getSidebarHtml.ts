// src/sidebar/webview/getSidebarHtml.ts

import * as vscode from 'vscode';
import { getNonce } from '../../utils/getNonce';

export function getSidebarHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const nonce = getNonce();

    const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'main.css')
    );

    const logoUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'src', 'assets', 'default_pack_icon.png')
    );

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AddonCrate Panel</title>
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <style>
                body {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                .branding {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    border-bottom: 1px solid var(--vscode-editorWidget-border);
                }
                .branding a {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    color: var(--vscode-foreground);
                    font-weight: 600;
                    font-size: 1.1em;
                }
                .branding img {
                    width: 28px;
                    height: 28px;
                    border-radius: 4px;
                }
                .version-badge {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    padding: 2px 6px;
                    font-size: 0.75em;
                    border-radius: 4px;
                }
                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                }
                .sidebar-footer {
                    border-top: 1px solid var(--vscode-editorWidget-border);
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .footer-button {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    text-decoration: none;
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 0.85em;
                    transition: background-color 0.15s;
                }
                .footer-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .footer-button img {
                    width: 16px;
                    height: 16px;
                }
            </style>
        </head>
        <body>
            <!-- Top Branding -->
             <!-- AddonCrate Branding -->
                <div class="branding">
                    <div class="branding-left">
                        <a href="https://addoncrate.com" target="_blank">
                            <img src="${logoUri}" alt="AddonCrate Logo">
                            <span>AddonCrate</span>
                        </a>
                        <span class="version-badge">Alpha v0.1.0</span>
                    </div>

                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">Project Status</h3>
                    <div class="project-info-card">
                        <p id="project-name" style="font-size: 1.1em; font-weight: 600; margin: 0 0 4px 0;">No Project Open</p>
                        <p id="project-packs" style="font-size: 0.85em; color: var(--vscode-descriptionForeground); margin: 0;">Use a creation tool to get started.</p>
                    </div>
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">Project Management</h3>
                    <div class="action-list">
                        <a href="#" class="action-button" data-command="addoncrate-creator.createProject">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                           <span>Create New Project...</span>
                        </a>
                        <a href="#" class="action-button" data-command="addoncrate-creator.openProject">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17l-1.41-1.41L13 21.17V4h-2v17.17l-5.59-5.59L4 17l8 8 8-8z"/></svg>
                           <span>Open Project...</span>
                        </a>
                        <a href="#" class="action-button" data-command="addoncrate-creator.importProject">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                           <span>Import Packs...</span>
                        </a>
                        <a href="#" class="action-button" data-command="addoncrate-creator.exportProject">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                           <span>Export as .mcaddon</span>
                        </a>
                    </div>
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">Creator Tools</h3>
                    <div class="action-list">
                         <a href="#" class="action-button" data-command="addoncrate-creator.createFile">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                           <span>Create New File...</span>
                        </a>
                        <a href="#" class="action-button" data-command="addoncrate-creator.createItem">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                           <span>Create New Item...</span>
                        </a>
                        <a href="#" class="action-button" data-command="addoncrate-creator.createEntity">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                           <span>Create New Entity...</span>
                        </a>
                        <a href="#" class="action-button" data-command="addoncrate-creator.createBlock">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                           <span>Create New Block...</span>
                        </a>
                        <a href="#" class="action-button" data-command="addoncrate-creator.createLootTable">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                           <span>Create New Loot Table...</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Footer Buttons -->
            <div class="sidebar-footer">
                <a href="https://addoncrate.com/studio/upload" target="_blank" class="footer-button">
                    <img src="${logoUri}" alt="">
                    Post on AddonCrate
                </a>
                <a href="https://addoncrate.com" target="_blank" class="footer-button">
                    <img src="${logoUri}" alt="">
                    Visit AddonCrate
                </a>
            </div>

            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'updateProjectStatus') {
                        document.getElementById('project-name').textContent = message.name;
                        document.getElementById('project-packs').textContent = message.packs.join(' & ');
                    }
                });

                document.querySelectorAll('.action-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const command = button.dataset.command;
                        if (command) {
                            vscode.postMessage({ type: 'command', command: command });
                        }
                    });
                });

                vscode.postMessage({ type: 'webviewReady' });
            </script>
        </body>
        </html>
    `;
}
