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

    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'main.css'));

    // --- THIS IS THE FIXED LINE ---
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'codicons', 'codicon.css'));

    const csp = [
        `default-src 'none'`,
        `img-src ${webview.cspSource} https: file: data:`,
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        `font-src ${webview.cspSource}`, // This allows the codicon.ttf font file to load
        `script-src 'nonce-${nonce}'`,
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