// src/features/itemCreator/webview/getItemCreatorHtml.ts

import * as vscode from 'vscode';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

export function getItemCreatorHtml(webview: vscode.Webview, extensionUri: vscode.Uri, namespace: string): string {
    const body = `
        <h1>Create New Custom Item</h1>
        <p class="label-description" style="margin-bottom: 1.5rem;">Define the properties and components for your new item.</p>
        
        <form id="item-form">
            <fieldset class="fieldset">
                <legend class="legend">Core Properties</legend>
                <label class="label" for="itemId">Item Identifier</label>
                <div class="input-group">
                    <span class="input-group-label">${namespace}:</span>
                    <input class="input" type="text" id="itemId" name="itemId" required placeholder="super_sword">
                </div>
                
                <div class="grid-container grid-cols-2">
                    <div>
                        <label class="label" for="displayName">Display Name</label>
                        <input class="input" type="text" id="displayName" name="displayName" required placeholder="Super Sword">
                    </div>
                    <div>
                        <label class="label" for="icon">Icon Texture Name (Optional)</label>
                        <div class="file-input-group">
                            <input class="input" type="text" id="icon" name="icon" placeholder="super_sword (e.g., from Browse)">
                            <button type="button" class="btn btn-secondary file-picker-btn" data-type="icon">Browse...</button>
                        </div>
                    </div>
                </div>
                 <input type="hidden" id="iconPath" name="iconPath">
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Creative Menu</legend>
                <label class="checkbox-group"><input type="checkbox" id="useMenuCategory" name="useMenuCategory" checked> Add to Creative Menu</label>
                <div id="menu-category-options" style="margin-left: 20px; padding-left: 20px; border-left: 2px solid var(--vscode-editorWidget-border);">
                    <div class="grid-container grid-cols-2">
                       <div>
                            <label class="label" for="category">Category</label>
                            <select id="category" name="category" class="input">
                                <option value="equipment">Equipment</option>
                                <option value="construction">Construction</option>
                                <option value="nature">Nature</option>
                                <option value="items">Items</option>
                            </select>
                        </div>
                        <div>
                            <label class="label" for="group">Group</label>
                            <input class="input" type="text" id="group" name="group" value="itemGroup.name.sword" placeholder="itemGroup.name.sword">
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset class="fieldset">
                <legend class="legend">Item Components</legend>
                <label class="label" for="maxStackSize">Max Stack Size</label>
                <input class="input" type="number" id="maxStackSize" name="maxStackSize" value="1" min="1" max="64">

                <label class="checkbox-group"><input type="checkbox" id="handEquipped" name="handEquipped"> Hand Equipped</label>
                <label class="checkbox-group"><input type="checkbox" id="foil" name="foil"> Foil (Enchanted Glow)</label>

                <label class="checkbox-group"><input type="checkbox" id="isTool" name="isTool"> Is a Tool?</label>
                <div id="tool-options" class="hidden" style="margin-left: 20px; padding-left: 20px; border-left: 2px solid var(--vscode-editorWidget-border);">
                    <div class="grid-container grid-cols-2">
                        <div><label class="label" for="durability">Durability</label><input class="input" type="number" id="durability" name="durability" value="250"></div>
                        <div><label class="label" for="damage">Attack Damage</label><input class="input" type="number" id="damage" name="damage" value="5"></div>
                    </div>

                    <label class="checkbox-group"><input type="checkbox" id="isEnchantable" name="isEnchantable"> Is Enchantable?</label>
                    <div id="enchant-options" class="grid-container grid-cols-2 hidden" style="margin-left: 20px;">
                        <div>
                            <label class="label" for="enchantSlot">Enchantment Slot</label>
                            <select id="enchantSlot" name="enchantSlot" class="input">
                                <option value="sword">Sword</option><option value="axe">Axe</option><option value="pickaxe">Pickaxe</option><option value="shovel">Shovel</option><option value="hoe">Hoe</option><option value="bow">Bow</option>
                            </select>
                        </div>
                         <div><label class="label" for="enchantValue">Value</label><input class="input" type="number" id="enchantValue" name="enchantValue" value="14"></div>
                    </div>

                    <label class="label" for="repairItems">Repair Items</label>
                    <p class="label-description">Comma-separated list, e.g., minecraft:diamond, minecraft:stick</p>
                    <input class="input" type="text" id="repairItems" name="repairItems" placeholder="minecraft:diamond">
                </div>
            </fieldset>
            <button type="submit" class="btn">Create Item Files</button>
        </form>
    `;

    const script = `
        function setupToggle(checkboxId, sectionId) {
            const checkbox = document.getElementById(checkboxId);
            const section = document.getElementById(sectionId);
            checkbox.addEventListener('change', () => section.classList.toggle('hidden', !checkbox.checked));
            section.classList.toggle('hidden', !checkbox.checked);
        }
        setupToggle('useMenuCategory', 'menu-category-options');
        setupToggle('isTool', 'tool-options');
        setupToggle('isEnchantable', 'enchant-options');

        document.querySelectorAll('.file-picker-btn').forEach(button => {
            button.addEventListener('click', () => {
                vscode.postMessage({ type: 'selectFile', fileType: button.getAttribute('data-type') });
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'fileSelected' && message.fileType === 'icon') {
                document.getElementById('icon').value = message.fileName;
                document.getElementById('iconPath').value = message.fsPath;
            }
        });

        document.getElementById('item-form').addEventListener('submit', (event) => {
            event.preventDefault();
            const form = event.target;
            const iconName = form.icon.value || form.itemId.value;

            vscode.postMessage({
                type: 'createItem',
                data: {
                    itemId: form.itemId.value,
                    displayName: form.displayName.value,
                    icon: iconName,
                    iconPath: form.iconPath.value || undefined,
                    maxStackSize: parseInt(form.maxStackSize.value),
                    handEquipped: form.handEquipped.checked,
                    foil: form.foil.checked,
                    menuCategory: form.useMenuCategory.checked ? { category: form.category.value, group: form.group.value } : null,
                    isTool: {
                        enabled: form.isTool.checked,
                        durability: parseInt(form.durability.value),
                        damage: parseInt(form.damage.value),
                        enchantable: form.isEnchantable.checked ? { slot: form.enchantSlot.value, value: parseInt(form.enchantValue.value) } : null,
                        repairItems: form.repairItems.value
                    }
                }
            });
        });
    `;

    return getWebviewHtml(webview, extensionUri, {
        title: 'New Custom Item',
        body: body,
        script: script
    });
}