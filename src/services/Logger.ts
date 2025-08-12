// src/services/Logger.ts

import * as vscode from 'vscode';

export class Logger {
    private static _outputChannel: vscode.OutputChannel;

    public static initialize() {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel("AddonCrate Creator");
        }
    }

    public static log(message: string) {
        if (!this._outputChannel) {
            this.initialize();
        }
        const time = new Date().toLocaleTimeString();
        this._outputChannel.appendLine(`[${time}] ${message}`);
    }

    public static show() {
        this._outputChannel.show();
    }
}