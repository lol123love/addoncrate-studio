// src/features/projectCreator/webview/getProjectCreatorHtml.ts

import * as vscode from 'vscode';
import { VersionGroups } from '../../../data/minecraftVersions';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

export function getProjectCreatorHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const projectsLocation = vscode.workspace.getConfiguration('addoncrate').get<string>('projects.location') || 'Not Set - Click Change to set a folder';

    function createOptionGroup(label: string, versions: string[], recommendedVersion?: string): string {
        const uniqueVersions = [...new Set(versions)].filter(Boolean);
        if (uniqueVersions.length === 0) return '';
        
        return `<optgroup label="${label}">${uniqueVersions.map(v => `<option value="${v}" ${v === recommendedVersion ? 'selected' : ''}>${v}</option>`).join('')}</optgroup>`;
    }
    
    const versionDropdownHtml = `
        ${createOptionGroup('Latest Releases', [VersionGroups.latestStable, VersionGroups.latestPreview], VersionGroups.latestStable)}
        ${createOptionGroup('Recommended', VersionGroups.recommended.filter(v => ![VersionGroups.latestStable, VersionGroups.latestPreview].includes(v)))}
        ${createOptionGroup('Modern Scripting API (@minecraft/server)', VersionGroups.modernScripting)}
        ${createOptionGroup('Legacy Scripting API (mojang-)', VersionGroups.legacyScripting)}
        ${createOptionGroup('Pre-Scripting Era', VersionGroups.preScripting)}
    `;

    const body = `
        <h1>Create New Addon Project</h1>
        <p class="label-description" style="margin-bottom: 1.5rem;">Configure the packs and features for your new project.</p>
        
        <form id="project-form">
            <fieldset class="fieldset">
                <legend class="legend">Project Details & Location</legend>
                
                <label class="label" for="projectName">Project Name</label>
                <input class="input" type="text" id="projectName" name="projectName" required placeholder="My Awesome Addon">
                
                <label class="label" for="author">Author Name</label>
                <input class="input" type="text" id="author" name="author" required placeholder="Your Name">

                <label class="label" for="namespace">Project Namespace</label>
                <p class="label-description">A short, unique, lowercase ID for your project (e.g., 'magic', 'cyber'). Avoid spaces or special characters.</p>
                <input class="input" type="text" id="namespace" name="namespace" required placeholder="awesomeaddon" pattern="[a-z0-9_]+">
                
                <label class="label" for="location">Projects Location</label>
                <div class="file-input-group">
                    <input class="input" type="text" id="location" name="location" value="${projectsLocation}" title="${projectsLocation}" disabled>
                    <button type="button" id="set-location-btn" class="btn btn-secondary">Change...</button>
                </div>
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Technical Configuration</legend>
                <label class="label" for="targetVersion">Target Minecraft Version</label>
                <select class="input" id="targetVersion" name="targetVersion">${versionDropdownHtml}</select>
                <label class="checkbox-group"><input type="checkbox" id="useLang" name="useLang" checked> Use .lang file for pack name/description</label>
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Pack Icon (Optional)</legend>
                <p class="label-description">Select a .png file to use as the project icon. If not provided, a default icon will be generated.</p>
                <div class="file-input-group">
                    <input class="input" type="text" id="packIconDisplay" name="packIconDisplay" placeholder="No icon selected" disabled>
                    <button type="button" id="select-icon-btn" class="btn btn-secondary">Browse...</button>
                </div>
                <div id="icon-preview-container" class="hidden" style="margin-top: 1rem; text-align: center;">
                    <img id="icon-preview" src="" alt="Icon Preview" style="max-width: 64px; max-height: 64px; border-radius: 4px; background-color: var(--vscode-editorWidget-background);">
                </div>
                <input type="hidden" id="packIconPath" name="packIconPath">
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Pack Configuration</legend>
                <label class="checkbox-group"><input type="checkbox" id="packBehavior" name="packBehavior" checked> Behavior Pack</label>
                <label class="checkbox-group"><input type="checkbox" id="packResource" name="packResource" checked> Resource Pack</label>
            </fieldset>

            <fieldset id="bp-options" class="fieldset">
                <legend class="legend">Behavior Pack Options</legend>
                <label class="checkbox-group"><input type="checkbox" id="useScripts" name="useScripts" checked> Include Scripting Module</label>
                <div id="script-options" style="margin-left: 20px;">
                    <label class="checkbox-group"><input type="checkbox" id="isBdsProject" name="isBdsProject"> Include Bedrock Server Modules (Admin, Net)</label>
                </div>
                <label id="link-bp-rp-label" class="checkbox-group"><input type="checkbox" id="linkBehaviorToResource" name="linkBehaviorToResource" checked> Link to Resource Pack</label>
            </fieldset>

            <button type="submit" class="btn">Create Project</button>
        </form>
    `;

    const script = `
        const bpCheckbox = document.getElementById('packBehavior');
        const rpCheckbox = document.getElementById('packResource');
        const useScriptsCheckbox = document.getElementById('useScripts');
        const bpOptions = document.getElementById('bp-options');
        const scriptOptions = document.getElementById('script-options');
        const linkLabel = document.getElementById('link-bp-rp-label');
        const form = document.getElementById('project-form');
        const selectIconButton = document.getElementById('select-icon-btn');

        function updateFormVisibility() {
            const bpIsChecked = bpCheckbox.checked;
            const rpIsChecked = rpCheckbox.checked;
            const scriptsAreUsed = useScriptsCheckbox.checked;

            bpOptions.classList.toggle('hidden', !bpIsChecked);
            scriptOptions.classList.toggle('hidden', !bpIsChecked || !scriptsAreUsed);
            linkLabel.classList.toggle('hidden', !bpIsChecked || !rpIsChecked);
        }

        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', updateFormVisibility));
        
        document.getElementById('set-location-btn').addEventListener('click', () => {
            vscode.postMessage({ type: 'command', command: 'addoncrate-creator.setProjectsLocation' });
        });

        selectIconButton.addEventListener('click', () => {
            vscode.postMessage({ type: 'selectPackIcon' });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'packIconSelected') {
                document.getElementById('packIconDisplay').value = message.fsPath;
                document.getElementById('packIconPath').value = message.fsPath;
                const preview = document.getElementById('icon-preview');
                const previewContainer = document.getElementById('icon-preview-container');
                preview.src = message.dataUri;
                previewContainer.classList.remove('hidden');
            }
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            
            vscode.postMessage({
                type: 'createProject',
                data: {
                    projectName: form.projectName.value,
                    author: form.author.value,
                    namespace: form.namespace.value,
                    targetVersion: form.targetVersion.value,
                    packIconPath: form.packIconPath.value || undefined,
                    useLang: form.useLang.checked,
                    packs: {
                        behavior: form.packBehavior.checked,
                        resource: form.packResource.checked,
                    },
                    scripting: {
                        useScripts: form.useScripts.checked,
                        isBdsProject: form.isBdsProject.checked,
                    },
                    dependencies: {
                        linkBehaviorToResource: form.linkBehaviorToResource.checked
                    }
                }
            });
        });

        updateFormVisibility();
    `;

    return getWebviewHtml(webview, extensionUri, {
        title: 'New Addon Project',
        body: body,
        script: script
    });
}