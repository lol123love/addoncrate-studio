// src/services/EntityGenerator.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { IEntityOptions } from '../types/EntityOptions';

/**
 * Handles the generation of all files required for a new custom entity.
 */
export class EntityGenerator {
    constructor(private options: IEntityOptions, private extensionUri: vscode.Uri) {}

    public async generate() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage('You must have a project open to create an entity.');
            return;
        }
        
        const rootFolder = folders[0];
        const configFileUri = vscode.Uri.joinPath(rootFolder.uri, 'addoncrate.json');
        let config;

        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            config = JSON.parse(Buffer.from(rawContent).toString('utf8'));
        } catch (error) {
            vscode.window.showErrorMessage('Could not find a valid "addoncrate.json" in the root of your project.');
            return;
        }

        if (!config.namespace || !config.packs?.behavior || !config.packs?.resource) {
            vscode.window.showErrorMessage('Your "addoncrate.json" must define a "namespace", a "behavior" pack, and a "resource" pack.');
            return;
        }
        
        const bpFolderUri = vscode.Uri.joinPath(rootFolder.uri, config.packs.behavior);
        const rpFolderUri = vscode.Uri.joinPath(rootFolder.uri, config.packs.resource);
        const fullIdentifier = `${config.namespace}:${this.options.identifier}`;

        await this._generateBehaviorPackFiles(bpFolderUri, config.namespace, fullIdentifier);
        await this._generateResourcePackFiles(rpFolderUri, config.namespace, fullIdentifier);

        vscode.window.showInformationMessage(`Successfully created entity "${fullIdentifier}"!`);
    }

    private async _generateBehaviorPackFiles(bpFolderUri: vscode.Uri, namespace: string, fullIdentifier: string) {
        await this._createDirectory(bpFolderUri, 'entities');
        const entityFileUri = vscode.Uri.joinPath(bpFolderUri, 'entities', `${this.options.identifier}.json`);
        const entityJson = {
            "format_version": "1.21.0",
            "minecraft:entity": {
                "description": {
                    "identifier": fullIdentifier,
                    "is_spawnable": this.options.isSpawnable,
                    "is_summonable": this.options.isSummonable,
                    "is_experimental": false
                },
                "components": {
                    "minecraft:health": { "value": this.options.health, "max": this.options.health },
                    "minecraft:movement": { "value": this.options.moveSpeed },
                    "minecraft:navigation.walk": { "can_path_over_water": true },
                    "minecraft:movement.basic": {},
                    "minecraft:jump.static": {}
                }
            }
        };
        await this._writeFile(entityFileUri, JSON.stringify(entityJson, null, 4));

        if (this.options.isSpawnable) {
            await this._createDirectory(bpFolderUri, 'spawn_rules');
            const spawnRuleFileUri = vscode.Uri.joinPath(bpFolderUri, 'spawn_rules', `${this.options.identifier}.json`);
            const spawnRuleJson = {
                "format_version": "1.8.0",
                "minecraft:spawn_rules": {
                    "description": { "identifier": fullIdentifier, "population_control": "animal" },
                    "conditions": [ {
                        "minecraft:spawns_on_surface": {},
                        "minecraft:brightness_filter": { "min": 7, "max": 15, "adjust_for_weather": false },
                        "minecraft:weight": { "default": 10 },
                        "minecraft:herd": { "min_size": 2, "max_size": 4 },
                        "minecraft:biome_filter": { "test": "has_biome_tag", "operator": "==", "value": "animal" }
                    } ]
                }
            };
            await this._writeFile(spawnRuleFileUri, JSON.stringify(spawnRuleJson, null, 4));
        }
    }

    private async _generateResourcePackFiles(rpFolderUri: vscode.Uri, namespace: string, fullIdentifier: string) {
        await this._createDirectory(rpFolderUri, 'entity');

        const getShortName = (fileName: string | undefined, defaultName: string, extensions: string[]) => {
            if (!fileName) return defaultName;
            for (const ext of extensions) {
                if (fileName.endsWith(ext)) {
                    return fileName.slice(0, -ext.length);
                }
            }
            return fileName;
        };

        const textureFileName = this.options.texture || `${this.options.identifier}.png`;
        const textureShortName = getShortName(this.options.texture, this.options.identifier, ['.png']);
        
        const modelFileName = this.options.model || `${this.options.identifier}.geo.json`;
        const modelShortName = getShortName(this.options.model, this.options.identifier, ['.geo.json']);
        
        const animFileName = this.options.animation || `${this.options.identifier}.animation.json`;
        const animShortName = getShortName(this.options.animation, this.options.identifier, ['.animation.json']);
        
        const controllerFileName = this.options.animationController || `${this.options.identifier}.controller.json`;
        const controllerShortName = getShortName(this.options.animationController, this.options.identifier, ['.controller.json']);

        const clientEntityFileUri = vscode.Uri.joinPath(rpFolderUri, 'entity', `${this.options.identifier}.json`);
        const clientEntityJson = {
            "format_version": "1.10.0",
            "minecraft:client_entity": {
                "description": {
                    "identifier": fullIdentifier,
                    "materials": { "default": "entity_alphatest" },
                    "textures": { "default": `textures/entity/${textureShortName}` },
                    "geometry": { "default": `geometry.${modelShortName}` },
                    "animations": {
                        "walk": `animation.${animShortName}.walk`,
                        "look_at_target": "animation.common.look_at_target"
                    },
                    "animation_controllers": [ { "move": `controller.animation.${controllerShortName}.move` } ],
                    "render_controllers": [ "controller.render.default" ],
                    "spawn_egg": {
                        "base_color": this.options.spawnEgg.baseColor,
                        "overlay_color": this.options.spawnEgg.overlayColor
                    }
                }
            }
        };
        await this._writeFile(clientEntityFileUri, JSON.stringify(clientEntityJson, null, 4));

        await this._createPlaceholder(rpFolderUri, `models/entity/${modelFileName}`, () => JSON.stringify({ "format_version": "1.12.0", "minecraft:geometry": [ { "description": { "identifier": `geometry.${modelShortName}`, "texture_width": 64, "texture_height": 64, "visible_bounds_width": 2, "visible_bounds_height": 2, "visible_bounds_offset": [0, 0.5, 0] }, "bones": [ { "name": "body", "pivot": [0, 0, 0], "cubes": [{"origin": [-4, 0, -4], "size": [8, 8, 8], "uv": [0, 0]}] } ] } ] }, null, 4));
        await this._createPlaceholder(rpFolderUri, `animations/${animFileName}`, () => JSON.stringify({ "format_version": "1.8.0", "animations": { [`animation.${animShortName}.walk`]: { "loop": true, "anim_time_update": "query.modified_distance_moved" } } }, null, 4));
        await this._createPlaceholder(rpFolderUri, `animation_controllers/${controllerFileName}`, () => JSON.stringify({ "format_version": "1.10.0", "animation_controllers": { [`controller.animation.${controllerShortName}.move`]: { "states": { "default": { "animations": [ "look_at_target", { "walk": "query.modified_move_speed > 0.1" } ] } } } } }, null, 4));
        
        // Handle texture file
        const textureDestUri = vscode.Uri.joinPath(rpFolderUri, `textures/entity/${textureFileName}`);
        await this._createDirectory(rpFolderUri, 'textures/entity');
        try {
             await vscode.workspace.fs.stat(textureDestUri);
        } catch {
             if (this.options.texturePath) {
                const sourceUri = vscode.Uri.file(this.options.texturePath);
                await vscode.workspace.fs.copy(sourceUri, textureDestUri, { overwrite: true });
            } else {
                const defaultTextureUri = vscode.Uri.joinPath(this.extensionUri, 'src', 'assets', 'default_pack_icon.png');
                await vscode.workspace.fs.copy(defaultTextureUri, textureDestUri);
            }
        }
    }

    private async _createPlaceholder(rootUri: vscode.Uri, filePath: string, getContent: () => string | Uint8Array) {
        const fileUri = vscode.Uri.joinPath(rootUri, filePath);
        try {
            await vscode.workspace.fs.stat(fileUri);
        } catch {
            await this._createDirectory(rootUri, path.dirname(filePath));
            await this._writeFile(fileUri, getContent());
        }
    }

    private async _createDirectory(root: vscode.Uri, dirPath: string) {
        if (dirPath === '.') return;
        const parts = dirPath.split('/');
        let current = root;
        for (const part of parts) {
            current = vscode.Uri.joinPath(current, part);
            try {
                await vscode.workspace.fs.createDirectory(current);
            } catch (e) {
                // Directory likely already exists, which is fine
            }
        }
    }

    private async _writeFile(uri: vscode.Uri, content: string | Uint8Array) {
        const buffer: Uint8Array = typeof content === 'string'
            ? new TextEncoder().encode(content)
            : content;

        try {
            await vscode.workspace.fs.writeFile(uri, buffer);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to write file: ${uri.fsPath}. ${e.message}`);
        }
    }
}