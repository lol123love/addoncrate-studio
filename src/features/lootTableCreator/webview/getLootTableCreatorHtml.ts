// src/features/lootTableCreator/webview/getLootTableCreatorHtml.ts

import * as vscode from 'vscode';
import { getWebviewHtml } from '../../../webview/getWebviewHtml';

export function getLootTableCreatorHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const body = `
        <h1>Create New Loot Table</h1>
        
        <form id="loottable-form">
            <fieldset class="fieldset">
                <legend class="legend">File Name</legend>
                <label class="label" for="fileName">Loot Table Filename (e.g., entities/my_mob.json)</label>
                <input class="input" type="text" id="fileName" name="fileName" required placeholder="entities/my_mob_drops">
            </fieldset>

            <div id="pools-container">
                <!-- Pools will be dynamically added here -->
            </div>
            
            <button type="button" id="add-pool-btn" class="btn btn-secondary" style="width: auto; margin-bottom: 1rem;">Add Pool</button>
            <button type="submit" class="btn">Create Loot Table</button>
        </form>
    `;

    const script = `
        const form = document.getElementById('loottable-form');
        const poolsContainer = document.getElementById('pools-container');
        let poolCount = 0;
        let entryCount = 0;

        function createEntryHtml(poolId) {
            const entryId = entryCount++;
            const html = \`
                <div class="entry" data-entry-id="\${entryId}">
                    <div class="flex-container gap-2">
                        <label class="label" style="min-width: 40px;">Type:</label>
                        <select class="input entry-type" data-pool="\${poolId}" data-entry="\${entryId}">
                            <option value="item" selected>Item</option>
                            <option value="loot_table">Loot Table</option>
                            <option value="empty">Empty</option>
                        </select>
                        <input type="text" class="input entry-name-input" data-pool="\${poolId}" data-entry="\${entryId}" placeholder="minecraft:diamond">
                        <label class="label">Weight:</label>
                        <input type="number" value="1" min="1" style="width: 80px;" class="input entry-weight" data-pool="\${poolId}" data-entry="\${entryId}">
                        <button type="button" class="btn btn-secondary remove-btn remove-entry-btn">X</button>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" class="set-count-toggle" id="set-count-\${entryId}"><label for="set-count-\${entryId}">Set Count</label>
                        <div class="flex-container gap-2 hidden" id="set-count-group-\${entryId}">
                            <label>Min:</label><input type="number" class="input set-count-min" value="1" style="width: 70px;">
                            <label>Max:</label><input type="number" class="input set-count-max" value="1" style="width: 70px;">
                        </div>
                    </div>
                </div>
            \`;
            return html;
        }

        function createPoolHtml() {
            const poolId = poolCount++;
            const html = \`
                <div class="pool" data-pool-id="\${poolId}">
                    <div class="pool-header">
                        <h3 style="margin: 0;">Pool \${poolId + 1}</h3>
                        <div class="flex-container gap-2">
                            <label>Rolls:</label>
                            <input type="number" value="1" min="1" class="input pool-rolls-min" data-pool="\${poolId}" style="width: 80px;">
                            <label>to</label>
                            <input type="number" value="1" min="1" class="input pool-rolls-max" data-pool="\${poolId}" style="width: 80px;">
                            <button type="button" class="btn btn-secondary remove-btn remove-pool-btn">Remove Pool</button>
                        </div>
                    </div>
                    <div class="grid-container" id="entries-container-\${poolId}">
                        \${createEntryHtml(poolId)}
                    </div>
                    <button type="button" class="btn btn-secondary add-entry-btn" data-pool="\${poolId}" style="width: auto; margin-top: 1rem;">Add Entry</button>
                </div>
            \`;
            return html;
        }

        document.getElementById('add-pool-btn').addEventListener('click', () => {
            poolsContainer.insertAdjacentHTML('beforeend', createPoolHtml());
        });

        poolsContainer.addEventListener('click', (e) => {
            if (e.target.matches('.add-entry-btn')) {
                const poolId = e.target.getAttribute('data-pool');
                document.getElementById(\`entries-container-\${poolId}\`).insertAdjacentHTML('beforeend', createEntryHtml(poolId));
            }
            if (e.target.matches('.remove-entry-btn')) e.target.closest('.entry').remove();
            if (e.target.matches('.remove-pool-btn')) e.target.closest('.pool').remove();
        });
        
        poolsContainer.addEventListener('change', (e) => {
            if (e.target.matches('.entry-type')) {
                const entryElement = e.target.closest('.entry');
                entryElement.querySelector('.entry-name-input').style.display = (e.target.value === 'empty') ? 'none' : 'block';
                entryElement.querySelector('.set-count-toggle').parentElement.style.display = (e.target.value === 'empty') ? 'none' : 'flex';
            }
            if (e.target.matches('.set-count-toggle')) {
                const entryId = e.target.id.split('-')[2];
                document.getElementById(\`set-count-group-\${entryId}\`).classList.toggle('hidden', !e.target.checked);
            }
        });

        document.getElementById('add-pool-btn').click(); // Add initial pool

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const data = { fileName: form.fileName.value, pools: [] };
            document.querySelectorAll('.pool').forEach(poolEl => {
                const minRolls = parseInt(poolEl.querySelector('.pool-rolls-min').value);
                const maxRolls = parseInt(poolEl.querySelector('.pool-rolls-max').value);
                const pool = {
                    rolls: minRolls === maxRolls ? minRolls : { min: minRolls, max: maxRolls },
                    entries: []
                };
                poolEl.querySelectorAll('.entry').forEach(entryEl => {
                    const type = entryEl.querySelector('.entry-type').value;
                    const entry = { type: type, weight: parseInt(entryEl.querySelector('.entry-weight').value) };
                    if (type !== 'empty') entry.name = entryEl.querySelector('.entry-name-input').value;
                    if (entryEl.querySelector('.set-count-toggle').checked && type !== 'empty') {
                        const min = parseInt(entryEl.querySelector('.set-count-min').value);
                        const max = parseInt(entryEl.querySelector('.set-count-max').value);
                        entry.functions = [{ function: 'set_count', count: min === max ? min : { min, max } }];
                    }
                    pool.entries.push(entry);
                });
                data.pools.push(pool);
            });
            vscode.postMessage({ type: 'createLootTable', data: data });
        });
    `;

    return getWebviewHtml(webview, extensionUri, {
        title: 'New Loot Table',
        body: body,
        script: script
    });
}