import * as vscode from 'vscode';
import { getNonce } from '../../../utils/getNonce';

export function getRecipeEditorHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
	const nonce = getNonce();
    const recipeEditorStylesUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'recipe-editor.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${recipeEditorStylesUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet" />
		<title>Recipe Editor</title>
	</head>
	<body>
        <div id="drag-ghost" class="drag-ghost"></div>
		<div class="editor-container">
			<div class="recipe-panel">
                <div id="recipe-meta" class="hidden">
                    <label for="recipe-identifier">Identifier:</label>
                    <input type="text" id="recipe-identifier" class="input">
                </div>

				<div id="shaped-editor" class="recipe-area hidden">
					<div class="recipe-title">Shaped Crafting</div>
					<div class="io-grid">
                        <div class="crafting-grid" id="shaped-grid"></div>
                        <div class="arrow"></div>
                        <div class="result-container">
                            <div class="item-slot result-slot" id="shaped-result"></div>
                            <input type="number" class="result-count-input" id="shaped-result-count" placeholder="1" min="1">
                        </div>
                    </div>
				</div>

				<div id="shapeless-editor" class="recipe-area hidden">
					<div class="recipe-title">Shapeless Crafting</div>
					<div class="io-grid">
                        <div class="shapeless-grid" id="shapeless-grid-inputs"></div>
                        <div class="arrow"></div>
                        <div class="result-container">
                            <div class="item-slot result-slot" id="shapeless-result"></div>
                            <input type="number" class="result-count-input" id="shapeless-result-count" placeholder="1" min="1">
                        </div>
                    </div>
				</div>

				<div id="furnace-editor" class="recipe-area hidden">
					<div class="recipe-title">Smelting</div>
					<div class="io-grid">
                        <div class="item-slot" id="furnace-input"></div>
                        <div class="arrow"></div>
                        <div class="result-container">
                            <div class="item-slot result-slot" id="furnace-output"></div>
                            <input type="number" class="result-count-input" id="furnace-output-count" placeholder="1" min="1">
                        </div>
                    </div>
				</div>

                <div id="smithing-transform-editor" class="recipe-area hidden">
                    <div class="recipe-title">Smithing Transform</div>
                    <div class="io-grid">
                        <div class="item-slot" id="smithing-transform-template"><span class="slot-label">Template</span></div>
                        <span class="plus-symbol">+</span>
                        <div class="item-slot" id="smithing-transform-base"><span class="slot-label">Base</span></div>
                        <span class="plus-symbol">+</span>
                        <div class="item-slot" id="smithing-transform-addition"><span class="slot-label">Addition</span></div>
                        <div class="arrow"></div>
                        <div class="result-container">
                            <div class="item-slot result-slot" id="smithing-transform-result"></div>
                            <input type="number" class="result-count-input" id="smithing-transform-result-count" placeholder="1" min="1">
                        </div>
                    </div>
                </div>

                <div id="smithing-trim-editor" class="recipe-area hidden">
                    <div class="recipe-title">Smithing Trim</div>
                     <div class="io-grid">
                        <div class="item-slot" id="smithing-trim-template"><span class="slot-label">Template</span></div>
                        <span class="plus-symbol">+</span>
                        <div class="item-slot" id="smithing-trim-base"><span class="slot-label">Armor</span></div>
                        <span class="plus-symbol">+</span>
                        <div class="item-slot" id="smithing-trim-addition"><span class="slot-label">Mineral</span></div>
                     </div>
                     <p class="editor-info-text">Armor trims do not produce a new item, they apply a cosmetic effect.</p>
                </div>

                <div id="brewing-editor" class="recipe-area hidden">
                    <div class="recipe-title">Potion Brewing</div>
                     <div class="io-grid">
                        <div class="item-slot" id="brewing-input"><span class="slot-label">Input</span></div>
                        <span class="plus-symbol">+</span>
                        <div class="item-slot" id="brewing-reagent"><span class="slot-label">Reagent</span></div>
                        <div class="arrow"></div>
                        <div class="result-container">
                             <div class="item-slot result-slot" id="brewing-output"><span class="slot-label">Output</span></div>
                             <input type="number" class="result-count-input" id="brewing-output-count" placeholder="1" min="1">
                        </div>
                    </div>
                </div>

                <div id="unknown-editor" class="recipe-area hidden"> <div class="recipe-title">Unsupported Recipe</div> <p>This recipe type cannot be edited visually.</p> </div>
                <div class="controls"> <button id="save-button" class="btn">Save Recipe</button> </div>
			</div>
			<div class="item-list-panel">
                <div class="search-bar"> <input type="text" id="item-search" class="input" placeholder="Search items..."> </div>
				<div class="item-list" id="item-list"></div>
                <div class="custom-item-adder">
                    <label>Add Custom Item</label>
                    <div class="input-group">
                        <input type="text" id="custom-item-id" class="input" placeholder="namespace:item_name">
                        <button id="add-custom-item-btn" class="btn">Add</button>
                    </div>
                </div>
			</div>
		</div>

		<script nonce="${nonce}">
			(function() {
				const vscode = acquireVsCodeApi();
                let itemRegistry = { vanilla: [], project: [] };
                let currentRecipeJson = {};
                let activeEditorKey = 'unknown';

                const DOM = {
                    editors: {
                        shaped: document.getElementById('shaped-editor'),
                        shapeless: document.getElementById('shapeless-editor'),
                        furnace: document.getElementById('furnace-editor'),
                        smithing_transform: document.getElementById('smithing-transform-editor'),
                        smithing_trim: document.getElementById('smithing-trim-editor'),
                        brewing: document.getElementById('brewing-editor'),
                        unknown: document.getElementById('unknown-editor'),
                    },
                    grids: {
                        shaped: document.getElementById('shaped-grid'),
                        shapelessInputs: document.getElementById('shapeless-grid-inputs'),
                    },
                    slots: {
                        shapedResult: document.getElementById('shaped-result'),
                        shapelessResult: document.getElementById('shapeless-result'),
                        furnaceInput: document.getElementById('furnace-input'),
                        furnaceOutput: document.getElementById('furnace-output'),
                        smithingTransform: {
                            template: document.getElementById('smithing-transform-template'),
                            base: document.getElementById('smithing-transform-base'),
                            addition: document.getElementById('smithing-transform-addition'),
                            result: document.getElementById('smithing-transform-result'),
                        },
                        smithingTrim: {
                            template: document.getElementById('smithing-trim-template'),
                            base: document.getElementById('smithing-trim-base'),
                            addition: document.getElementById('smithing-trim-addition'),
                        },
                        brewing: {
                           input: document.getElementById('brewing-input'),
                           reagent: document.getElementById('brewing-reagent'),
                           output: document.getElementById('brewing-output'),
                        }
                    },
                    counts: {
                        shapedResult: document.getElementById('shaped-result-count'),
                        shapelessResult: document.getElementById('shapeless-result-count'),
                        furnaceOutput: document.getElementById('furnace-output-count'),
                        smithingTransform: document.getElementById('smithing-transform-result-count'),
                        brewingOutput: document.getElementById('brewing-output-count')
                    },
                    itemList: document.getElementById('item-list'),
                    searchInput: document.getElementById('item-search'),
                    saveButton: document.getElementById('save-button'),
                    recipeIdentifierInput: document.getElementById('recipe-identifier'),
                    dragGhost: document.getElementById('drag-ghost'),
                    customItemIdInput: document.getElementById('custom-item-id'),
                    addCustomItemBtn: document.getElementById('add-custom-item-btn'),
                };

                const findItem = (id) => [...itemRegistry.vanilla, ...itemRegistry.project].find(i => i.id === id);

                // --- RENDERING LOGIC ---

                function renderItem(item) {
                    if (item) {
                        return \`<span>\${item.name}</span>\`;
                    }
                    return '';
                }

                function updateSlot(slotElement, itemId) {
                    if (!slotElement) return;
                    const item = findItem(itemId);
                    slotElement.dataset.itemId = itemId || '';
                    const label = slotElement.querySelector('.slot-label');
                    let content = renderItem(item);
                    slotElement.innerHTML = (label ? label.outerHTML : '') + content;
                }

                function updateResultSlot(slotElement, countInputElement, resultData) {
                    const itemData = resultData || {};
                    const itemId = typeof itemData === 'string' ? itemData : itemData.item;
                    const count = itemData.count || '';
                    updateSlot(slotElement, itemId);
                    if (countInputElement) {
                        countInputElement.value = count;
                    }
                }

                function populateItemList(itemsToRender) {
                    const allItems = itemsToRender || [...itemRegistry.vanilla, ...itemRegistry.project].sort((a, b) => a.name.localeCompare(b.name));
                    DOM.itemList.innerHTML = allItems.map(item => {
                        return \`<div class="item-list-entry" draggable="true" data-item-id="\${item.id}">
                                    \${renderItem(item)}
                                </div>\`;
                    }).join('');
                }

                // --- DATA LOADING & SAVING ---

				window.addEventListener('message', event => {
					const { type, recipe, itemRegistry: registry } = event.data;
					if (type === 'init') {
                        itemRegistry = registry;
                        try {
                            currentRecipeJson = JSON.parse(recipe);
                            loadRecipe(currentRecipeJson);
                        } catch(e) { vscode.postMessage({ type: 'error', message: 'Could not parse recipe JSON: ' + e.message }); showEditor('unknown'); }
                        finally {
                            populateItemList();
                        }
					}
				});

                // --- EVENT HANDLERS ---
                DOM.searchInput.addEventListener('input', e => {
                    const query = e.target.value.toLowerCase();
                    if (!query) {
                        populateItemList();
                        return;
                    }
                    const allItems = [...itemRegistry.vanilla, ...itemRegistry.project];
                    const filteredItems = allItems.filter(item =>
                        item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query)
                    );
                    populateItemList(filteredItems);
                });

                function loadRecipe(recipe) {
                    const recipeKey = Object.keys(recipe).find(k => k.startsWith('minecraft:recipe'));
                    if (!recipeKey) { showEditor('unknown'); return; }
                    const data = recipe[recipeKey];
                    document.getElementById('recipe-meta').classList.remove('hidden');
                    DOM.recipeIdentifierInput.value = data.description.identifier;
                    const itemIdsInRecipe = new Set();
                    if(data.key) Object.values(data.key).forEach(val => itemIdsInRecipe.add(typeof val === 'string' ? val : val.item));
                    if(data.ingredients) data.ingredients.forEach(ing => itemIdsInRecipe.add(typeof ing === 'string' ? ing : ing.item));
                    if(data.result) itemIdsInRecipe.add(typeof data.result === 'string' ? data.result : data.result.item);
                    ['input', 'output', 'reagent', 'base', 'addition', 'template'].forEach(prop => { if(data[prop]) itemIdsInRecipe.add(typeof data[prop] === 'string' ? data[prop] : data[prop].item || data[prop])});
                    itemIdsInRecipe.forEach(id => { if (id && !findItem(id)) addCustomItem(id, true); });
                    if (recipeKey.includes('shaped')) { showEditor('shaped'); loadShapedRecipe(data); }
                    else if (recipeKey.includes('shapeless')) { showEditor('shapeless'); loadShapelessRecipe(data); }
                    else if (recipeKey.includes('furnace')) { showEditor('furnace'); loadFurnaceRecipe(data); }
                    else if (recipeKey.includes('smithing_transform')) { showEditor('smithing_transform'); loadSmithingTransformRecipe(data); }
                    else if (recipeKey.includes('smithing_trim')) { showEditor('smithing_trim'); loadSmithingTrimRecipe(data); }
                    else if (recipeKey.includes('brewing')) { showEditor('brewing'); loadBrewingRecipe(data); }
                    else { showEditor('unknown'); }
                }
                function showEditor(type) {
                    activeEditorKey = type;
                    Object.values(DOM.editors).forEach(editor => editor.classList.add('hidden'));
                    (DOM.editors[type] || DOM.editors.unknown).classList.remove('hidden');
                }
                function loadShapedRecipe(data) {
                    DOM.grids.shaped.innerHTML = Array(9).fill(0).map((_, i) => \`<div class="item-slot" data-grid-index="\${i}"></div>\`).join('');
                    const keyMap = data.key || {};
                    const pattern = data.pattern || [];
                    for (let r = 0; r < pattern.length; r++) {
                        const rowStr = pattern[r];
                        for (let c = 0; c < rowStr.length; c++) {
                            const gridIndex = r * 3 + c;
                            const char = rowStr[c];
                            if (char !== ' ' && DOM.grids.shaped.children[gridIndex]) {
                                const itemData = keyMap[char];
                                if (itemData) updateSlot(DOM.grids.shaped.children[gridIndex], itemData.item);
                            }
                        }
                    }
                    updateResultSlot(DOM.slots.shapedResult, DOM.counts.shapedResult, data.result);
                }
                function loadShapelessRecipe(data) {
                    DOM.grids.shapelessInputs.innerHTML = (data.ingredients || []).map(ing => {
                        const slot = document.createElement('div'); slot.className = 'item-slot';
                        const itemId = typeof ing === 'string' ? ing : ing.item;
                        updateSlot(slot, itemId); return slot.outerHTML;
                    }).join('');
                    updateResultSlot(DOM.slots.shapelessResult, DOM.counts.shapelessResult, data.result);
                }
                function loadFurnaceRecipe(data) {
                    updateSlot(DOM.slots.furnaceInput, data.input?.item || data.input);
                    updateResultSlot(DOM.slots.furnaceOutput, DOM.counts.furnaceOutput, data.output);
                }
                function loadSmithingTransformRecipe(data) {
                    updateSlot(DOM.slots.smithingTransform.template, data.template);
                    updateSlot(DOM.slots.smithingTransform.base, data.base);
                    updateSlot(DOM.slots.smithingTransform.addition, data.addition);
                    updateResultSlot(DOM.slots.smithingTransform.result, DOM.counts.smithingTransform, data.result);
                }
                function loadSmithingTrimRecipe(data) {
                    updateSlot(DOM.slots.smithingTrim.template, data.template);
                    updateSlot(DOM.slots.smithingTrim.base, data.base);
                    updateSlot(DOM.slots.smithingTrim.addition, data.addition);
                }
                function loadBrewingRecipe(data) {
                    updateSlot(DOM.slots.brewing.input, data.input);
                    updateSlot(DOM.slots.brewing.reagent, data.reagent);
                    updateResultSlot(DOM.slots.brewing.output, DOM.counts.brewingOutput, data.output);
                }
                function buildResultObject(resultSlot, countInput) {
                    const itemId = resultSlot.dataset.itemId;
                    if (!itemId) return null;
                    
                    const count = parseInt(countInput.value, 10);
                    if (!isNaN(count) && count > 1) {
                        return { item: itemId, count: count };
                    }
                    // For single items, return the object format by default. Special cases like brewing_mix will handle converting this to a string.
                    return { item: itemId };
                }

                // --- SAVE LOGIC ---
                DOM.saveButton.addEventListener('click', () => {
                    try {
                        let builder = {
                            shaped: buildShapedRecipe,
                            shapeless: buildShapelessRecipe,
                            furnace: buildFurnaceRecipe,
                            smithing_transform: buildSmithingTransformRecipe,
                            smithing_trim: buildSmithingTrimRecipe,
                            brewing: buildBrewingRecipe,
                        }[activeEditorKey];

                        if (!builder) {
                            vscode.postMessage({ type: 'error', message: "Cannot save: this editor is read-only or not supported." });
                            return;
                        }

                        const result = builder();
                        if(result && result.data) {
                            const finalRecipe = {
                                format_version: currentRecipeJson.format_version || '1.12',
                                [result.key]: result.data
                            };
                            vscode.postMessage({ type: 'save', data: finalRecipe });
                        }
                    } catch(e) { vscode.postMessage({ type: 'error', message: "Failed to build recipe: " + e.message }); }
                });

                function getRecipeKey() {
                    return Object.keys(currentRecipeJson).find(k => k.startsWith('minecraft:recipe')) || \`minecraft:recipe_\${activeEditorKey}\`;
                }

                function buildBaseRecipe() {
                    const recipeKey = getRecipeKey();
                    const base = JSON.parse(JSON.stringify(currentRecipeJson[recipeKey] || {}));
                    base.description = { identifier: DOM.recipeIdentifierInput.value || 'example:recipe' };
                    return base;
                }

                function buildShapedRecipe() {
                    let builtRecipe = buildBaseRecipe();
                    builtRecipe.tags = builtRecipe.tags || ["crafting_table"];
                    const gridItems = Array.from(DOM.grids.shaped.children).map(slot => slot.dataset.itemId || null);
                    let minRow = 2, maxRow = 0, minCol = 2, maxCol = 0, hasItems = false;
                    gridItems.forEach((itemId, i) => { if (itemId) { hasItems = true; const row = Math.floor(i / 3); const col = i % 3; minRow = Math.min(minRow, row); maxRow = Math.max(maxRow, row); minCol = Math.min(minCol, col); maxCol = Math.max(maxCol, col); } });
                    
                    const newKey = {};
                    const itemToChar = new Map();
                    const charPool = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                    let charIndex = 0;
                    const newPattern = [];
                    
                    if (hasItems) {
                        for (let r = minRow; r <= maxRow; r++) {
                            let patternRow = "";
                            for (let c = minCol; c <= maxCol; c++) {
                                const index = r * 3 + c;
                                const itemId = gridItems[index];
                                let char = ' ';
                                if (itemId) {
                                    if (!itemToChar.has(itemId)) {
                                        if (charIndex >= charPool.length) throw new Error("Too many unique items for recipe key.");
                                        char = charPool[charIndex++];
                                        itemToChar.set(itemId, char);
                                        newKey[char] = { item: itemId };
                                    }
                                    char = itemToChar.get(itemId);
                                 }
                                patternRow += char;
                            }
                            newPattern.push(patternRow);
                        }
                    }
                    
                    builtRecipe.pattern = newPattern;
                    builtRecipe.key = newKey;
                    builtRecipe.result = buildResultObject(DOM.slots.shapedResult, DOM.counts.shapedResult);
                    if (!builtRecipe.result) throw new Error("Shaped recipe must have a result.");

                    return { key: getRecipeKey(), data: builtRecipe };
                }

                function buildShapelessRecipe() {
                    let builtRecipe = buildBaseRecipe();
                    builtRecipe.tags = builtRecipe.tags || ["crafting_table"];
                    builtRecipe.ingredients = Array.from(DOM.grids.shapelessInputs.children)
                        .map(slot => ({ item: slot.dataset.itemId }))
                        .filter(ing => ing.item && ing.item);
                    builtRecipe.result = buildResultObject(DOM.slots.shapelessResult, DOM.counts.shapelessResult);
                    if (!builtRecipe.result) throw new Error("Shapeless recipe must have a result.");

                    return { key: getRecipeKey(), data: builtRecipe };
                }

                function buildFurnaceRecipe() {
                    let builtRecipe = buildBaseRecipe();
                    builtRecipe.tags = builtRecipe.tags || ["furnace"];
                    builtRecipe.input = DOM.slots.furnaceInput.dataset.itemId;
                    // Furnace output is always an object, even with a count of 1.
                    const outputResult = buildResultObject(DOM.slots.furnaceOutput, DOM.counts.furnaceOutput);
                    builtRecipe.output = outputResult.item; // The format requires a string here.
                    if (!builtRecipe.input || !builtRecipe.output) throw new Error("Furnace recipe must have an input and output.");

                    return { key: getRecipeKey(), data: builtRecipe };
                }

                function buildSmithingTransformRecipe() {
                    let builtRecipe = buildBaseRecipe();
                    builtRecipe.tags = builtRecipe.tags || ["smithing_table"];
                    builtRecipe.template = DOM.slots.smithingTransform.template.dataset.itemId;
                    builtRecipe.base = DOM.slots.smithingTransform.base.dataset.itemId;
                    builtRecipe.addition = DOM.slots.smithingTransform.addition.dataset.itemId;
                    builtRecipe.result = buildResultObject(DOM.slots.smithingTransform.result, DOM.counts.smithingTransform);
                    if (!builtRecipe.template || !builtRecipe.base || !builtRecipe.addition || !builtRecipe.result) throw new Error("Smithing transform recipe must have a template, base, addition, and result.");

                    return { key: getRecipeKey(), data: builtRecipe };
                }

                function buildSmithingTrimRecipe() {
                    let builtRecipe = buildBaseRecipe();
                    builtRecipe.tags = builtRecipe.tags || ["smithing_table"];
                    builtRecipe.template = DOM.slots.smithingTrim.template.dataset.itemId;
                    builtRecipe.base = DOM.slots.smithingTrim.base.dataset.itemId;
                    builtRecipe.addition = DOM.slots.smithingTrim.addition.dataset.itemId;
                    if (!builtRecipe.template || !builtRecipe.base || !builtRecipe.addition) throw new Error("Smithing trim recipe must have a template, base, and addition.");

                    return { key: getRecipeKey(), data: builtRecipe };
                }
                
                function buildBrewingRecipe() {
                    let builtRecipe = buildBaseRecipe();
                    builtRecipe.tags = builtRecipe.tags || ["brewing_stand"];
                    
                    const inputId = DOM.slots.brewing.input.dataset.itemId;
                    const reagentId = DOM.slots.brewing.reagent.dataset.itemId;
                    const outputResult = buildResultObject(DOM.slots.brewing.output, DOM.counts.brewingOutput);

                    if (!inputId || !reagentId || !outputResult) {
                        throw new Error("Brewing recipe must have an input, reagent, and output.");
                    }

                    builtRecipe.input = inputId;
                    builtRecipe.reagent = reagentId;

                    const inputIsPotion = findItem(inputId)?.id.includes('potion');
                    const hasCount = !!outputResult.count;

                    const isMixRecipe = inputIsPotion && !hasCount;
                    const newKey = isMixRecipe ? 'minecraft:recipe_brewing_mix' : 'minecraft:recipe_brewing_container';

                    if (isMixRecipe) {
                        // 'mix' recipes require a simple string for the output.
                        builtRecipe.output = outputResult.item;
                    } else {
                        // 'container' recipes use an object for the output.
                        builtRecipe.output = outputResult;
                    }

                    return { key: newKey, data: builtRecipe };
                }
                
                let draggedItem = null;
                document.body.addEventListener('dragstart', e => {
                    const entry = e.target.closest('.item-list-entry');
                    if (entry) {
                        const itemId = entry.dataset.itemId;
                        draggedItem = findItem(itemId);
                        e.dataTransfer.setData('text/plain', itemId);
                        e.dataTransfer.effectAllowed = 'copy';
                        DOM.dragGhost.innerHTML = renderItem(draggedItem);
                        DOM.dragGhost.style.display = 'flex';
                    }
                });
                document.addEventListener('dragend', () => { draggedItem = null; DOM.dragGhost.style.display = 'none'; });
                document.addEventListener('dragover', e => {
                    if (draggedItem) {
                        DOM.dragGhost.style.left = (e.clientX + 15) + 'px';
                        DOM.dragGhost.style.top = (e.clientY + 15) + 'px';
                    }
                    if (e.target.matches('.item-slot')) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        e.target.classList.add('droppable-hover');
                    }
                });
                document.body.addEventListener('dragleave', e => { if (e.target.matches('.item-slot')) e.target.classList.remove('droppable-hover'); });
                document.body.addEventListener('drop', e => { const slot = e.target.closest('.item-slot'); if (slot) { e.preventDefault(); slot.classList.remove('droppable-hover'); const itemId = e.dataTransfer.getData('text/plain'); if (itemId) updateSlot(slot, itemId); } });
                document.body.addEventListener('contextmenu', e => {
                    const slot = e.target.closest('.item-slot');
                    if (slot) {
                        e.preventDefault();
                        updateSlot(slot, null);
                        const countInput = slot.closest('.result-container')?.querySelector('.result-count-input');
                        if (countInput) countInput.value = '';
                    }
                });
                function addCustomItem(itemId, silent = false) {
                    if (!itemId || findItem(itemId)) return;
                    const newItem = { id: itemId, name: itemId.replace(/^(minecraft|project):/, ''), icon: '' };
                    itemRegistry.project.unshift(newItem);
                    if (!DOM.searchInput.value) {
                        populateItemList();
                    }
                    if (!silent) DOM.customItemIdInput.value = '';
                }
                DOM.addCustomItemBtn.addEventListener('click', () => addCustomItem(DOM.customItemIdInput.value));
                DOM.customItemIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem(DOM.customItemIdInput.value); } });
                vscode.postMessage({ type: 'ready' });
			}());
		</script>
	</body>
	</html>`;
}