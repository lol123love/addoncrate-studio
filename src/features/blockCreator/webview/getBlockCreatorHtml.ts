// src/features/blockCreator/webview/getBlockCreatorHtml.ts

import * as vscode from 'vscode';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

export function getBlockCreatorHtml(webview: vscode.Webview, extensionUri: vscode.Uri, namespace: string): string {
    const body = `
        <h1>Create New Custom Block</h1>
        <p class="label-description" style="margin-bottom: 1.5rem;">Define the properties and components for your new block.</p>
        
        <form id="block-form">
            <fieldset class="fieldset">
                <legend class="legend">Core Properties</legend>
                 <div class="grid-container grid-cols-2">
                    <div>
                        <label class="label" for="identifier">Block Identifier</label>
                        <div class="input-group">
                            <span class="input-group-label">${namespace}:</span>
                            <input class="input" type="text" id="identifier" name="identifier" required placeholder="magic_block" pattern="[a-z0-9_]+">
                        </div>
                    </div>
                    <div>
                        <label class="label" for="displayName">Display Name</label>
                        <input class="input" type="text" id="displayName" name="displayName" required placeholder="Magic Block">
                    </div>
                </div>
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Visuals & Texture</legend>
                 <div class="grid-container grid-cols-2">
                    <div>
                        <label class="label" for="texture">Texture Name (Optional)</label>
                        <div class="file-input-group">
                            <input class="input" type="text" id="texture" name="texture" placeholder="magic_block (e.g., from Browse)">
                            <button type="button" class="btn btn-secondary file-picker-btn" data-type="texture">Browse...</button>
                        </div>
                    </div>
                    <div>
                        <label class="label" for="mapColor">Map Color</label>
                        <input class="input" type="color" id="mapColor" name="mapColor" value="#ffffff" style="height: 40px; padding: 4px;">
                    </div>
                </div>
                <input type="hidden" id="texturePath" name="texturePath">
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Behavior Properties</legend>
                <label class="label" for="material">Material Preset</label>
                <select id="material" name="material" class="input">
                    <option value="stone" selected>Stone (Breaks with pickaxe)</option>
                    <option value="wood">Wood (Breaks with axe)</option>
                    <option value="dirt">Dirt (Breaks with shovel)</option>
                    <option value="metal">Metal (Like Iron Block)</option>
                </select>

                <div class="grid-container grid-cols-2">
                     <div>
                       <label class="label" for="destroyTime">Destroy Time (seconds)</label>
                       <input class="input" type="number" id="destroyTime" name="destroyTime" value="4.0" step="0.1" min="0">
                    </div>
                     <div>
                       <label class="label" for="explosionResistance">Explosion Resistance</label>
                       <input class="input" type="number" id="explosionResistance" name="explosionResistance" value="6.0" step="0.1" min="0">
                    </div>
                </div>
                
                <label class="label" for="friction">Friction</label>
                <input class="input" type="number" id="friction" name="friction" value="0.6" step="0.05" min="0" max="0.9">
            </fieldset>
            
            <fieldset class="fieldset">
                <legend class="legend">Lighting Properties</legend>
                <div class="grid-container grid-cols-2">
                     <div>
                       <label class="label" for="lightEmission">Light Emission (0-15)</label>
                       <input class="input" type="number" id="lightEmission" name="lightEmission" value="0" min="0" max="15">
                    </div>
                     <div>
                       <label class="label" for="lightDampening">Light Dampening (0-15)</label>
                       <input class="input" type="number" id="lightDampening" name="lightDampening" value="15" min="0" max="15">
                    </div>
                </div>
            </fieldset>

            <button type="submit" class="btn">Create Block Files</button>
        </form>
    `;

    const script = `
        const form = document.getElementById('block-form');
        const materialSelect = document.getElementById('material');

        const presets = {
            stone: { destroyTime: 4.0, explosionResistance: 6.0, friction: 0.6 },
            wood: { destroyTime: 2.0, explosionResistance: 3.0, friction: 0.6 },
            dirt: { destroyTime: 0.5, explosionResistance: 0.5, friction: 0.6 },
            metal: { destroyTime: 5.0, explosionResistance: 6.0, friction: 0.5 }
        };

        materialSelect.addEventListener('change', (e) => {
            const preset = presets[e.target.value];
            if (preset) {
                form.destroyTime.value = preset.destroyTime;
                form.explosionResistance.value = preset.explosionResistance;
                form.friction.value = preset.friction;
            }
        });

        document.querySelectorAll('.file-picker-btn').forEach(button => {
            button.addEventListener('click', () => {
                vscode.postMessage({ type: 'selectFile', fileType: button.getAttribute('data-type') });
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'fileSelected' && message.fileType === 'texture') {
                document.getElementById('texture').value = message.fileName;
                document.getElementById('texturePath').value = message.fsPath;
            }
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            // If texture is empty, use the identifier
            const textureName = form.texture.value || form.identifier.value;

            vscode.postMessage({
                type: 'createBlock',
                data: {
                    identifier: form.identifier.value,
                    displayName: form.displayName.value,
                    texture: textureName,
                    texturePath: form.texturePath.value || undefined,
                    material: form.material.value,
                    destroyTime: parseFloat(form.destroyTime.value),
                    explosionResistance: parseFloat(form.explosionResistance.value),
                    friction: parseFloat(form.friction.value),
                    lightEmission: parseInt(form.lightEmission.value),
                    lightDampening: parseInt(form.lightDampening.value),
                    mapColor: form.mapColor.value
                }
            });
        });
    `;

    return getWebviewHtml(webview, extensionUri, {
        title: 'New Custom Block',
        body: body,
        script: script
    });
}