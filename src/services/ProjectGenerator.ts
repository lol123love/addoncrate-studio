// src/services/ProjectGenerator.ts

import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { IProjectOptions } from '../types/ProjectOptions';
import { Manifest, ManifestDependency, ManifestModule, Vector } from '../types/Manifest';
import { compareVersions } from '../utils/compareVersions';

export class ProjectGenerator {
    private uuids: { [key: string]: string } = {};

    // --- FIX: Accept the extension's root URI in the constructor ---
    constructor(private options: IProjectOptions, private extensionUri: vscode.Uri) {}

    public async generate() {
        let rootPath = vscode.workspace.getConfiguration('addoncrate').get<string>('projects.location');
        if (!rootPath) {
            const selection = await vscode.window.showWarningMessage(
                'No default projects location is set. Please set one first.',
                'Set Location', 'Cancel'
            );
            if (selection === 'Set Location') {
                await vscode.commands.executeCommand('addoncrate-creator.setProjectsLocation');
            }
            return;
        }

        const projectsFolderUri = vscode.Uri.file(rootPath);
        const projectRootUri = vscode.Uri.joinPath(projectsFolderUri, this.options.projectName);
        
        await vscode.workspace.fs.createDirectory(projectRootUri);

        await this._createProjectConfig(projectRootUri);

        this.uuids.behavior = uuidv4();
        this.uuids.resource = uuidv4();

        const iconSourceUri = this.options.packIconPath 
            ? vscode.Uri.file(this.options.packIconPath)
            : undefined;

        if (this.options.packs.behavior) await this._createBehaviorPack(projectRootUri, iconSourceUri);
        if (this.options.packs.resource) await this._createResourcePack(projectRootUri, iconSourceUri);
        
        const selection = await vscode.window.showInformationMessage(`Successfully created project "${this.options.projectName}"!`, 'Open Project');
        
        if (selection === 'Open Project') {
            vscode.commands.executeCommand('vscode.openFolder', projectRootUri, { forceNewWindow: false });
        }
    }

    private async _createProjectConfig(rootUri: vscode.Uri) {
        const config = {
            name: this.options.projectName,
            author: this.options.author,
            namespace: this.options.namespace,
            targetVersion: this.options.targetVersion,
            packs: {
                behavior: this.options.packs.behavior ? `${this.options.projectName}_BP` : undefined,
                resource: this.options.packs.resource ? `${this.options.projectName}_RP` : undefined,
            }
        };
        const configUri = vscode.Uri.joinPath(rootUri, 'addoncrate.json');
        await this._writeFile(configUri, JSON.stringify(config, null, 4));
    }

    private async _createBehaviorPack(rootUri: vscode.Uri, iconSourceUri?: vscode.Uri) {
        const bpUri = vscode.Uri.joinPath(rootUri, `${this.options.projectName}_BP`);
        await this._scaffoldPack(bpUri, 'behavior', ['entities', 'items'], iconSourceUri);
        if (this.options.scripting.useScripts) {
            const scriptsUri = vscode.Uri.joinPath(bpUri, 'scripts');
            await vscode.workspace.fs.createDirectory(scriptsUri);
            await this._writeFile(vscode.Uri.joinPath(scriptsUri, 'main.js'), `// Welcome to scripting!`);
        }
    }
    
    private async _createResourcePack(rootUri: vscode.Uri, iconSourceUri?: vscode.Uri) {
        const rpUri = vscode.Uri.joinPath(rootUri, `${this.options.projectName}_RP`);
        await this._scaffoldPack(rpUri, 'resource', ['textures', 'models', 'ui'], iconSourceUri);
    }

    private async _scaffoldPack(packUri: vscode.Uri, type: 'behavior' | 'resource', subfolders: string[], iconSourceUri?: vscode.Uri) {
        await vscode.workspace.fs.createDirectory(packUri);
        await this._createManifest(packUri, type);

        for (const folder of subfolders) {
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(packUri, folder));
        }

        const textsUri = vscode.Uri.joinPath(packUri, 'texts');
        await vscode.workspace.fs.createDirectory(textsUri);
        
        const langContent = `pack.name=${this.options.projectName} ${type === 'behavior' ? 'BP' : 'RP'}\npack.description=${type === 'behavior' ? 'Behavior' : 'Resource'} pack for ${this.options.projectName}`;
        await this._writeFile(vscode.Uri.joinPath(textsUri, 'en_US.lang'), langContent);

        const iconDestUri = vscode.Uri.joinPath(packUri, 'pack_icon.png');
        // --- THIS IS THE FIX ---
        // If the user provided an icon, copy it.
        // Otherwise, copy the default icon from the extension's assets.
        if (iconSourceUri) {
            await vscode.workspace.fs.copy(iconSourceUri, iconDestUri, { overwrite: true });
        } else {
            const defaultIconUri = vscode.Uri.joinPath(this.extensionUri, 'src', 'assets', 'default_pack_icon.png');
            await vscode.workspace.fs.copy(defaultIconUri, iconDestUri, { overwrite: false });
        }
    }

    private async _createManifest(packUri: vscode.Uri, type: 'behavior' | 'resource') {
        const versionParts = this.options.targetVersion.split('.').map(Number);
        const engineVersion: Vector = [versionParts[0] || 0, versionParts[1] || 0, versionParts[2] || 0];

        const manifest: Partial<Manifest> & { header: any, modules: ManifestModule[], dependencies?: ManifestDependency[] } = {
            format_version: 2,
            header: {
                name: this.options.useLang ? 'pack.name' : this.options.projectName,
                description: this.options.useLang ? 'pack.description' : `Addon by ${this.options.author}`,
                uuid: type === 'behavior' ? this.uuids.behavior : this.uuids.resource,
                version: [1, 0, 0],
                min_engine_version: engineVersion
            },
            modules: [{
                description: `Pack module`,
                type: type === 'behavior' ? 'data' : 'resources',
                uuid: uuidv4(),
                version: [1, 0, 0]
            }],
            metadata: {
                authors: [this.options.author],
                generated_with: { "addoncrate_creator": ["1.0.0"] }
            }
        };

        if (type === 'behavior' && this.options.scripting.useScripts) {
            manifest.modules.push({
                description: 'Scripting module',
                type: compareVersions(this.options.targetVersion, '1.19.0') >= 0 ? 'script' : 'javascript',
                language: 'javascript',
                uuid: uuidv4(),
                version: [1, 0, 0],
                entry: 'scripts/main.js'
            });

            manifest.dependencies = manifest.dependencies ?? [];
            if (compareVersions(this.options.targetVersion, '1.19.40') >= 0) {
                manifest.dependencies.push(
                    { module_name: '@minecraft/server', version: '1.8.0' },
                    { module_name: '@minecraft/server-ui', version: '1.1.0' }
                );
                if (this.options.scripting.isBdsProject) {
                    manifest.dependencies.push(
                        { module_name: '@minecraft/server-admin', version: '1.0.0-beta' },
                        { module_name: '@minecraft/server-net', version: '1.0.0-beta' }
                    );
                }
            } else {
                manifest.dependencies.push({ uuid: 'b26a4d4c-afdf-4690-88f8-931846312678', version: [0, 1, 0] }); // mojang-minecraft
                manifest.dependencies.push({ uuid: '6f4b6893-1bb6-42fd-b458-7fa3d0c89616', version: [0, 1, 0] }); // mojang-gametest
            }
        }

        if (type === 'behavior' && this.options.dependencies.linkBehaviorToResource && this.options.packs.resource) {
            manifest.dependencies = manifest.dependencies ?? [];
            manifest.dependencies.push({ uuid: this.uuids.resource, version: [1, 0, 0] });
        }
        
        const manifestUri = vscode.Uri.joinPath(packUri, 'manifest.json');
        await this._writeFile(manifestUri, JSON.stringify(manifest, null, 4));
    }

    private async _writeFile(uri: vscode.Uri, content: string | Uint8Array) {
        const buffer = (typeof content === 'string') ? Buffer.from(content, 'utf8') : content;
        await vscode.workspace.fs.writeFile(uri, buffer);
    }
}