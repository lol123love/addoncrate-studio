// src/features/entityCreator/webview/getEntityCreatorHtml.ts

import * as vscode from 'vscode';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

export function getEntityCreatorHtml(webview: vscode.Webview, extensionUri: vscode.Uri, namespace: string): string {
    const body = `
        <h1>Create New Custom Entity</h1>
        <p class="label-description" style="margin-bottom: 1.5rem;">Define the core properties for your new entity.</p>
        
        <form id="entity-form">
            <fieldset class="fieldset">
                <legend class="legend">Core Properties</legend>
                <label class="label" for="identifier">Entity Identifier</label>
                <div class="input-group">
                    <span class="input-group-label">${namespace}:</span>
                    <input class="input" type="text" id="identifier" name="identifier" required placeholder="my_mob" pattern="[a-z0-9_]+">
                </div>
                
                <label class="label" for="displayName">Display Name</label>
                <input class="input" type="text" id="displayName" name="displayName" required placeholder="My Awesome Mob">
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Spawning</legend>
                <div class="grid-container grid-cols-2">
                    <label class="checkbox-group"><input type="checkbox" id="isSpawnable" name="isSpawnable" checked> Has Spawn Egg</label>
                    <label class="checkbox-group"><input type="checkbox" id="isSummonable" name="isSummonable" checked> Is Summonable</label>
                </div>
                <div class="grid-container grid-cols-2">
                    <div>
                        <label class="label" for="baseColor">Egg Base Color</label>
                        <input class="input" type="color" id="baseColor" name="baseColor" value="#ff6a00" style="height: 40px; padding: 4px;">
                    </div>
                    <div>
                        <label class="label" for="overlayColor">Egg Overlay Color</label>
                        <input class="input" type="color" id="overlayColor" name="overlayColor" value="#3d3d3d" style="height: 40px; padding: 4px;">
                    </div>
                </div>
            </fieldset>
            
            <fieldset class="fieldset">
                <legend class="legend">Basic Components</legend>
                <div class="grid-container grid-cols-2">
                    <div>
                       <label class="label" for="health">Health</label>
                       <input class="input" type="number" id="health" name="health" value="20" min="1">
                    </div>
                    <div>
                       <label class="label" for="moveSpeed">Movement Speed</label>
                       <input class="input" type="number" id="moveSpeed" name="moveSpeed" value="0.25" step="0.01" min="0">
                    </div>
                </div>
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Custom Assets (Optional)</legend>
                <p class="label-description">
                    Select existing asset files. Leave blank to generate default placeholders.
                </p>
                 <label class="label" for="texture">Texture File</label>
                 <div class="file-input-group">
                    <input class="input" type="text" id="texture" name="texture" placeholder="Default: my_mob.png">
                    <button type="button" class="btn btn-secondary file-picker-btn" data-type="texture">Browse...</button>
                 </div>
                 <input type="hidden" id="texturePath" name="texturePath">
                
                 <label class="label" for="model">Model File</label>
                 <div class="file-input-group">
                    <input class="input" type="text" id="model" name="model" placeholder="Default: my_mob.geo.json">
                    <button type="button" class="btn btn-secondary file-picker-btn" data-type="model">Browse...</button>
                 </div>
                 
                 <label class="label" for="animation">Animation File</label>
                 <div class="file-input-group">
                    <input class="input" type="text" id="animation" name="animation" placeholder="Default: my_mob.animation.json">
                    <button type="button" class="btn btn-secondary file-picker-btn" data-type="animation">Browse...</button>
                 </div>

                 <label class="label" for="animationController">Animation Controller File</label>
                 <div class="file-input-group">
                    <input class="input" type="text" id="animationController" name="animationController" placeholder="Default: my_mob.controller.json">
                    <button type="button" class="btn btn-secondary file-picker-btn" data-type="animationController">Browse...</button>
                 </div>
            </fieldset>

            <button type="submit" class="btn">Create Entity Files</button>
        </form>
    `;

    const script = `
        const form = document.getElementById('entity-form');

        document.querySelectorAll('.file-picker-btn').forEach(button => {
            button.addEventListener('click', () => {
                vscode.postMessage({ type: 'selectFile', fileType: button.getAttribute('data-type') });
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'fileSelected') {
                const fileType = message.fileType;
                document.getElementById(fileType).value = message.fileName;
                if (fileType === 'texture') {
                    document.getElementById('texturePath').value = message.fsPath;
                }
            }
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            vscode.postMessage({
                type: 'createEntity',
                data: {
                    identifier: form.identifier.value,
                    displayName: form.displayName.value,
                    isSpawnable: form.isSpawnable.checked,
                    isSummonable: form.isSummonable.checked,
                    spawnEgg: { baseColor: form.baseColor.value, overlayColor: form.overlayColor.value },
                    health: parseFloat(form.health.value),
                    moveSpeed: parseFloat(form.moveSpeed.value),
                    texture: form.texture.value || undefined,
                    texturePath: form.texturePath.value || undefined,
                    model: form.model.value || undefined,
                    animation: form.animation.value || undefined,
                    animationController: form.animationController.value || undefined
                }
            });
        });
    `;

    return getWebviewHtml(webview, extensionUri, {
        title: 'New Custom Entity',
        body: body,
        script: script
    });
}