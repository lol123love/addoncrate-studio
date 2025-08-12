// src/features/fileCreator/webview/getFileCreatorHtml.ts

import * as vscode from 'vscode';
import { fileTypeCategories } from '../../../data/fileTypes';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

export function getFileCreatorHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // The HTML generation part is correct and doesn't need to change.
    // ... (keep all the HTML generation logic as is) ...
    let categoriesHtml = '';
    for (const category of fileTypeCategories) {
        let filesHtml = '';
        for (const file of category.files) {
            filesHtml += `
                <button 
                    type="button"
                    class="file-type-button" 
                    data-file-type="${file.key}"
                    data-path-desc="${file.pack} | ${file.path}/"
                >
                    <div class="file-type-label">${file.label}</div>
                    <div class="file-type-description">${file.description}</div>
                </button>
            `;
        }

        categoriesHtml += `
            <div class="category-card">
                <h2 class="category-header">
                    <i class="codicon codicon-${category.icon}"></i>
                    ${category.name}
                </h2>
                <div class="file-type-grid">
                    ${filesHtml}
                </div>
            </div>
        `;
    }

    const body = `
        <h1>Create New Add-on File</h1>
        <p class="label-description" style="margin-bottom: 1.5rem;">Select a file type, provide a name, then click 'Create File'.</p>
        
        <form id="file-creator-form">
            <div id="file-type-container">${categoriesHtml}</div>

            <input type="hidden" id="fileTypeInput" required>
            
            <p id="file-path-desc" class="label-description">Please select a file type above.</p>

            <label class="label" for="fileNameInput">File Name</label>
            <input type="text" id="fileNameInput" required placeholder="my_new_asset" class="input">
            
            <button type="submit" class="btn">Create File</button>
        </form>
    `;

    // --- SCRIPT REWRITE ---
    // This new script is more robust and correctly handles events.
    const script = `
        const form = document.getElementById('file-creator-form');
        const fileTypeContainer = document.getElementById('file-type-container');
        const hiddenFileTypeInput = document.getElementById('fileTypeInput');
        const fileNameInput = document.getElementById('fileNameInput');
        const filePathDesc = document.getElementById('file-path-desc');

        // Use Event Delegation for click handling. This is more efficient.
        fileTypeContainer.addEventListener('click', (event) => {
            // Find the button that was actually clicked, even if a child element was the target.
            const clickedButton = event.target.closest('.file-type-button');
            
            // If the click wasn't on a button, do nothing.
            if (!clickedButton) {
                return;
            }

            // Clear selection from all other buttons
            const allButtons = fileTypeContainer.querySelectorAll('.file-type-button');
            allButtons.forEach(btn => btn.classList.remove('selected'));

            // Mark the clicked button as selected
            clickedButton.classList.add('selected');

            // Get data from the button and update the form/UI
            const fileType = clickedButton.dataset.fileType;
            const pathDesc = clickedButton.dataset.pathDesc;

            hiddenFileTypeInput.value = fileType;
            filePathDesc.textContent = "Creates in: " + pathDesc;
        });

        // Handle the final form submission
        form.addEventListener('submit', (event) => {
            event.preventDefault(); // This is critical to prevent the page from going blank.
            
            const selectedFileType = hiddenFileTypeInput.value;
            const fileName = fileNameInput.value;

            // Validate that a file type has been selected
            if (!selectedFileType) {
                vscode.postMessage({ type: 'showError', message: 'Please select a file type before creating.' });
                return;
            }

            // Validate that a file name has been entered
            if (!fileName) {
                vscode.postMessage({ type: 'showError', message: 'Please enter a file name.' });
                return;
            }

            vscode.postMessage({
                type: 'createFile',
                data: {
                    fileType: selectedFileType,
                    fileName: fileName,
                }
            });
        });
    `;

    // The styles are correct and do not need to change.
    const styles = `
        .category-card { background-color: var(--vscode-sideBar-background); border-radius: 5px; margin-bottom: 1rem; border: 1px solid var(--vscode-sideBar-border); }
        .category-header { font-size: 1.1em; padding: 0.5rem 1rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; background-color: var(--vscode-sideBar-sectionHeaderBackground); border-bottom: 1px solid var(--vscode-sideBar-border); }
        .file-type-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; padding: 1rem; }
        .file-type-button { background-color: var(--vscode-button-secondaryBackground); border: 1px solid var(--vscode-button-border, transparent); color: var(--vscode-button-secondaryForeground); padding: 0.75rem; border-radius: 3px; text-align: left; cursor: pointer; display: flex; flex-direction: column; transition: all 0.1s ease-in-out; }
        .file-type-button:hover { background-color: var(--vscode-button-secondaryHoverBackground); }
        .file-type-button.selected { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border-color: var(--vscode-focusBorder); }
        .file-type-label { font-weight: bold; font-size: 1em; margin-bottom: 0.25rem; }
        .file-type-description { font-size: 0.9em; opacity: 0.8; }
    `;

    return getWebviewHtml(webview, extensionUri, {
        title: 'Create New File',
        body: body,
        script: script,
        styles: styles
    });
}