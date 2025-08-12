// src/webview/getWebviewHtml.ts
import * as vscode from 'vscode';
import { getNonce } from '../utils/getNonce';

/**
 * Defines the structure for the options passed to the webview template.
 */
export interface IWebviewOptions {
    title: string;
    body: string;
    script: string;
    styles?: string;
}

/**
 * Creates a complete HTML document for a webview, including security, a shared stylesheet, and custom content.
 * @param webview The VS Code webview instance.
 * @param extensionUri The URI for the extension's root directory.
 * @param options An object containing the title, body HTML, and JavaScript for the specific panel.
 * @returns A string containing the full HTML for the webview.
 */
export function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, options: IWebviewOptions): string {
    const nonce = getNonce();

    // --- FIX #1: Correctly generate resource URIs ---
    // This is the proper way to get URIs that respect the webview's security.
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'main.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

    // --- FIX #2: Create a more robust Content Security Policy ---
    // --- FIX #2: Create a more robust Content Security Policy ---
const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} https: file: data:`,  // ✅ Allow local, remote, and base64 images
    `style-src ${webview.cspSource} 'unsafe-inline'`,   // Allow main.css and codicon.css
    `font-src ${webview.cspSource}`,                    // Required for codicon font to load
    `script-src 'nonce-${nonce}'`,                      // Allow our one inline script block
].join('; ');


    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="${csp}">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <link rel="stylesheet" type="text/css" href="${codiconsUri}">

            <style>
                /* We inject the styles directly here to avoid a second inline style block, simplifying the CSP */
                ${options.styles || ''}
            </style>

            <title>${options.title}</title>
        </head>
        <body>
            ${options.body}

            <!-- All of your other files are correct, the script below will now execute properly -->
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                
                (function() {
                    ${options.script}
                }());
            </script>
        </body>
        </html>
    `;
}