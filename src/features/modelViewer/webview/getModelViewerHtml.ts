// src/features/modelViewer/webview/getModelViewerHtml.ts

import * as vscode from 'vscode';
import { getNonce } from '../../../utils/getNonce';

export function getModelViewerHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const nonce = getNonce();
    
    const cspSource = webview.cspSource;
    const cdnSource = 'https://unpkg.com';

    return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="
                default-src 'none';
                style-src ${cspSource} 'unsafe-inline';
                img-src ${cspSource} data:;
                script-src 'unsafe-inline' ${cdnSource} 'nonce-${nonce}';
                connect-src ${cspSource};
            ">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>3D Model Viewer</title>
			<style>
				body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #282c34; color: #abb2bf; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
				#viewer-container { width: 100%; height: 100%; }
				#controls { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 8px; border-radius: 4px; display: flex; flex-direction: column; gap: 10px; max-width: 350px; }
                .control-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
                #info { font-size: 12px; margin-top: 4px; }
				select, button { background-color: #3c4049; color: #abb2bf; border: 1px solid #555; border-radius: 4px; padding: 4px; }
                button:hover { background-color: #4c515c; }
                select { flex-shrink: 1; min-width: 100px; max-width: 250px; }
                optgroup { font-style: italic; color: #888; }
			</style>
		</head>
		<body>
            <div id="viewer-container"></div>
			<div id="controls">
                <div class="control-row">
                    <label for="texture-select">Texture:</label>
                    <select id="texture-select"><option>Loading...</option></select>
                </div>
                 <div class="control-row">
                    <label for="anim-select">Animation:</label>
                    <select id="anim-select"><option value="">None</option></select>
                    <button id="play-pause-btn">Play</button>
                </div>
                <div id="info"></div>
            </div>

            <script type="importmap" nonce="${nonce}">
            {
                "imports": {
                    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
                }
            }
            </script>

			<script type="module" nonce="${nonce}">
                import * as THREE from 'three';
                import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

                // --- MOCKS & UTILITIES ---
                const vscode = acquireVsCodeApi();
                
                class Molang {
                    constructor() {}
                    executeAndCatch(expr) {
                        const num = parseFloat(expr);
                        return isNaN(num) ? 0 : num;
                    }
                }
                
                // --- CORE LOGIC (from previous steps) ---
                const CubeFaces = [
                    { name: 'west', baseUV: [2, 1], dir: [-1, 0, 0], corners: [{ pos: [-0.5, 1, 0], uv: [0, 1] }, { pos: [-0.5, 0, 0], uv: [0, 0] }, { pos: [-0.5, 1, 1], uv: [1, 1] }, { pos: [-0.5, 0, 1], uv: [1, 0] }] },
                    { name: 'east', baseUV: [0, 1], dir: [1, 0, 0], corners: [{ pos: [0.5, 1, 1], uv: [0, 1] }, { pos: [0.5, 0, 1], uv: [0, 0] }, { pos: [0.5, 1, 0], uv: [1, 1] }, { pos: [0.5, 0, 0], uv: [1, 0] }] },
                    { name: 'down', baseUV: [2, 0], dir: [0, -1, 0], corners: [{ pos: [0.5, 0, 1], uv: [0, 1] }, { pos: [-0.5, 0, 1], uv: [1, 1] }, { pos: [0.5, 0, 0], uv: [0, 0] }, { pos: [-0.5, 0, 0], uv: [1, 0] }] },
                    { name: 'up', baseUV: [1, 0], dir: [0, 1, 0], corners: [{ pos: [-0.5, 1, 1], uv: [1, 1] }, { pos: [0.5, 1, 1], uv: [0, 1] }, { pos: [-0.5, 1, 0], uv: [1, 0] }, { pos: [0.5, 1, 0], uv: [0, 0] }] },
                    { name: 'north', baseUV: [1, 1], dir: [0, 0, -1], corners: [{ pos: [-0.5, 0, 0], uv: [1, 0] }, { pos: [0.5, 0, 0], uv: [0, 0] }, { pos: [-0.5, 1, 0], uv: [1, 1] }, { pos: [0.5, 1, 0], uv: [0, 1] }] },
                    { name: 'south', baseUV: [3, 1], dir: [0, 0, 1], corners: [{ pos: [-0.5, 0, 1], uv: [0, 0] }, { pos: [0.5, 0, 1], uv: [1, 0] }, { pos: [-0.5, 1, 1], uv: [0, 1] }, { pos: [0.5, 1, 1], uv: [1, 1] }] },
                ];
                const ReduceUvConst = 0.001;
                class Cube {
                    positions = []; indices = []; normals = []; uvs = [];
                    geometry = new THREE.BufferGeometry();
                    group = new THREE.Group();
                    constructor(cubeConfig) {
                        const { textureSize: [tW, tH], textureDiscrepancyFactor: [textureDiscrepancyW, textureDiscrepancyH], mirror, width, height, depth } = cubeConfig;
                        const [realTextureW, realTextureH] = [tW * textureDiscrepancyW, tH * textureDiscrepancyH];
                        const startUV = cubeConfig.startUV ?? [0, 0];
                        const usesUVObj = !Array.isArray(startUV);
                        let uvX = 0, uvY = 0;
                        if (!usesUVObj) [uvX, uvY] = startUV;
                        for (let { name, dir, corners, baseUV: [baseUVX, baseUVY], } of CubeFaces) {
                            const ndx = this.positions.length / 3;
                            let uvSizeX, uvSizeY;
                            if (usesUVObj) {
                                if (startUV[name] === undefined) continue;
                                [uvX, uvY] = startUV[name]?.uv || [0,0];
                                [uvSizeX, uvSizeY] = startUV[name]?.uv_size || [0,0];
                                uvSizeX *= textureDiscrepancyW; uvSizeY *= textureDiscrepancyH;
                                uvX *= textureDiscrepancyW; uvY *= textureDiscrepancyH;
                                baseUVX = 0; baseUVY = 0;
                            }
                            for (const { pos: [oX, oY, oZ], uv, } of corners) {
                                this.positions.push((mirror ? -oX : oX) * width, oY * height, oZ * depth);
                                this.normals.push(...dir);
                                this.uvs.push(
                                    (uvX + (Number(baseUVX > 0) + Number(baseUVX > 2)) * Math.floor(uvSizeX ?? depth) + Number(baseUVX > 1) * Math.floor(uvSizeX ?? width) + uv[0] * (name === 'west' || name === 'east' ? Math.floor(uvSizeX ?? depth) : Math.floor(uvSizeX ?? width)) + (uv[0] === 0 ? ReduceUvConst : -ReduceUvConst)) / (realTextureW / (!usesUVObj ? textureDiscrepancyW : 1)),
                                    1 - (uvY + baseUVY * Math.floor(uvSizeY ?? depth) + (name === 'up' || name === 'down' ? Math.floor(uvSizeY ?? depth) : Math.floor(uvSizeY ?? height)) - uv[1] * (name === 'up' || name === 'down' ? Math.floor(uvSizeY ?? depth) : Math.floor(uvSizeY ?? height)) + (uv[1] === 0 ? -ReduceUvConst : ReduceUvConst)) / (realTextureH / (!usesUVObj ? textureDiscrepancyH : 1))
                                );
                            }
                            this.indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
                        }
                        this.createGeometry(); this.createMesh(cubeConfig);
                    }
                    createGeometry() { this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.positions), 3)); this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.normals), 3)); this.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uvs), 2)); this.geometry.setIndex(this.indices); }
                    createMesh({ material, width, height, depth, pivot, rotation, origin, inflate = 0, }) { const calculatedWidth = inflate * 2 + width; const mesh = new THREE.Mesh(this.geometry, material); this.group.rotation.order = 'ZYX'; if (pivot === undefined) pivot = [calculatedWidth / 2, height / 2, depth / 2]; this.group.add(mesh); if (rotation) { this.group.position.set(-pivot[0], pivot[1], pivot[2]); mesh.position.set(-origin[0] - calculatedWidth / 2 + pivot[0] + inflate, origin[1] - pivot[1] - inflate, origin[2] - pivot[2] - inflate); const [rX, rY, rZ] = rotation; this.group.rotation.set(THREE.MathUtils.degToRad(-rX), THREE.MathUtils.degToRad(-rY), THREE.MathUtils.degToRad(rZ)); } else { this.group.position.set(-origin[0] - calculatedWidth / 2 + inflate, origin[1] - inflate, origin[2] - inflate); } if (inflate) this.group.scale.set(width !== 0 ? 1 + inflate / (width / 2) : 1, height !== 0 ? 1 + inflate / (height / 2) : 1, depth !== 0 ? 1 + inflate / (depth / 2) : 1); }
                    getGroup() { return this.group; }
                }
                class Model {
                    model; boneMap = new Map(); animator = new Animator(this);
                    constructor(modelData) { this.modelData = modelData; this.model = new THREE.Group(); this.model.name = modelData?.description?.identifier ?? 'geometry.unknown'; }
                    async create(texture) { const modelData = this.modelData; const textureSize = [modelData?.description?.texture_width ?? texture?.image?.width ?? 32, modelData?.description?.texture_height ?? texture?.image?.height ?? 32]; const textureDiscrepancyFactor = [ (texture?.image?.width ?? 32) / textureSize[0], (texture?.image?.height ?? 32) / textureSize[1] ]; const boneParentMap = new Map(); const modelMaterial = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaTest: 0.2, transparent: true, map: texture }); if (texture) { texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; } modelData?.bones?.forEach((boneData) => { const currBone = new THREE.Group(); currBone.name = boneData.name ?? 'unknown'; boneData.cubes?.forEach((cubeData, i) => { const group = new Cube({ width: cubeData.size?.[0] ?? 0, height: cubeData.size?.[1] ?? 0, depth: cubeData.size?.[2] ?? 0, startUV: cubeData.uv, textureSize, textureDiscrepancyFactor, material: modelMaterial, mirror: cubeData.mirror === undefined && cubeData.rotation === undefined ? boneData.mirror ?? false : cubeData.mirror ?? false, origin: cubeData.origin ?? [0, 0, 0], inflate: cubeData.inflate ?? boneData.inflate, rotation: cubeData.rotation, pivot: cubeData.pivot ?? boneData.pivot, }).getGroup(); group.name = \`#bone.\${boneData.name}#cube.\${i}\`; currBone.add(group); }); const pivotGroup = new THREE.Group(); pivotGroup.rotation.order = 'ZYX'; if (boneData.pivot) { const [pX, pY, pZ] = boneData.pivot; pivotGroup.position.set(-pX, pY, pZ); currBone.position.set(pX, -pY, -pZ); } else { pivotGroup.position.set(0, 0, 0); } pivotGroup.add(currBone); pivotGroup.name = \`#pivot.\${boneData.name}\`; if (boneData.rotation) { const [rX, rY, rZ] = boneData.rotation; pivotGroup.rotation.set(THREE.MathUtils.degToRad(-rX), THREE.MathUtils.degToRad(-rY), THREE.MathUtils.degToRad(rZ)); } if (!boneData.parent) this.model.add(pivotGroup); if (boneData.name) { boneParentMap.set(boneData.name, [boneData.parent, pivotGroup]); this.boneMap.set(boneData.name, pivotGroup); } }); for (let [boneName, [parent, bone]] of boneParentMap) { if (parent) { const parentGroup = boneParentMap.get(parent)?.[1]; if (parentGroup) { if(parentGroup.name.startsWith('#pivot.')) { parentGroup.children[0].add(bone); } else { parentGroup.add(bone); } } } } this.animator.setupDefaultBonePoses(); }
                    getGroup() { return this.model; } getBoneMap() { return this.boneMap; } tick() { this.animator.tick(); } get shouldTick() { return this.animator.shouldTick; }
                }
                class Animator {
                    animations = new Map(); constructor(model) { this.model = model; }
                    setupDefaultBonePoses() { for (let bone of this.model.getBoneMap().values()) { bone.userData.defaultRotation = bone.rotation.clone(); bone.userData.defaultPosition = bone.position.clone(); bone.userData.defaultScale = bone.scale.clone(); } }
                    addAnimation(id, animationData) { this.animations.set(id, new Animation(this, animationData)); }
                    play(id) { this.animations.get(id)?.play(); } pause(id) { this.animations.get(id)?.pause(); } pauseAll() { this.animations.forEach((anim) => anim.pause()); }
                    tick() { for (let bone of this.model.getBoneMap().values()) { bone.rotation.copy(bone.userData.defaultRotation); bone.position.copy(bone.userData.defaultPosition); bone.scale.copy(bone.userData.defaultScale); } this.animations.forEach((animation) => animation.shouldTick && animation.tick()); }
                    get shouldTick() { return [...this.animations.values()].some((animation) => animation.shouldTick); } getModel() { return this.model; }
                }
                class Animation {
                    startTimestamp = 0; lastFrameTimestamp = 0; isRunning = false; molang = new Molang();
                    constructor(animator, animationData) { this.animator = animator; this.animationData = animationData; }
                    parseBoneModifier(transform) { if (typeof transform === 'number') return [transform, transform, transform]; if (typeof transform === 'string') { const res = this.molang.executeAndCatch(transform); return [res, res, res]; } if (Array.isArray(transform)) return transform.map((t) => typeof t === 'string' ? this.molang.executeAndCatch(t) : t); if (transform !== undefined) { const timestamps = Object.entries(transform).map(([time, value]) => [Number(time), value]).sort(([a], [b]) => a - b); let i = timestamps.findIndex(([time]) => time > this.currentTime); if (i === -1) i = timestamps.length; const prevIndex = Math.max(0, i - 1); const nextIndex = Math.min(i, timestamps.length - 1); const [t0, v0_raw] = timestamps[prevIndex]; const v0 = (Array.isArray(v0_raw) ? v0_raw : v0_raw.post).map(v => this.molang.executeAndCatch(v)); if (prevIndex === nextIndex) return v0; const [t1, v1_raw] = timestamps[nextIndex]; const v1 = (Array.isArray(v1_raw) ? v1_raw : v1_raw.post).map(v => this.molang.executeAndCatch(v)); const timeDelta = t1 - t0; if (timeDelta <= 0) return v0; const progress = (this.currentTime - t0) / timeDelta; return v0.map((val, index) => THREE.MathUtils.lerp(val, v1[index], progress)); } return undefined; }
                    tick() { const boneMap = this.animator.getModel().getBoneMap(); for (let boneName in this.animationData.bones) { const bone = boneMap.get(boneName); if (!bone) continue; const { position, rotation, scale } = this.animationData.bones[boneName]; const [positionMod, rotationMod, scaleMod] = [position, rotation, scale].map((mod) => this.parseBoneModifier(mod)); if (positionMod) { bone.position.x += -positionMod[0]; bone.position.y += positionMod[1]; bone.position.z += positionMod[2]; } if (rotationMod) { const additiveRotation = new THREE.Euler( THREE.MathUtils.degToRad(-rotationMod[0]), THREE.MathUtils.degToRad(-rotationMod[1]), THREE.MathUtils.degToRad(rotationMod[2]), 'ZYX' ); const additiveQuat = new THREE.Quaternion().setFromEuler(additiveRotation); bone.quaternion.premultiply(additiveQuat); } if (scaleMod) { bone.scale.x *= scaleMod[0]; bone.scale.y *= scaleMod[1]; bone.scale.z *= scaleMod[2]; } } if (this.animationData.animation_length !== undefined && this.currentTime > this.animationData.animation_length) { if (this.animationData.loop) this.loop(); else this.pause(); } this.lastFrameTimestamp = Date.now(); }
                    play() { this.isRunning = true; this.startTimestamp = Date.now(); this.lastFrameTimestamp = Date.now();}
                    pause() { this.isRunning = false; } loop() { this.startTimestamp = Date.now(); }
                    get currentTime() { return (Date.now() - this.startTimestamp) / 1000; } get shouldTick() { return this.isRunning; }
                }

                // --- MAIN APPLICATION LOGIC ---
                let scene, camera, renderer, controls, model, currentGeo, modelIdentifier;
                let allTextures = [], allAnimationsFromFile = [];
                
                function init() {
                    const container = document.getElementById('viewer-container');
                    scene = new THREE.Scene();
                    scene.background = new THREE.Color(0x282c34);
                    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
                    camera.position.set(16, 16, 32);
                    renderer = new THREE.WebGLRenderer({ antialias: true });
                    renderer.setSize(container.clientWidth, container.clientHeight);
                    renderer.setPixelRatio(window.devicePixelRatio);
                    container.appendChild(renderer.domElement);
                    controls = new OrbitControls(camera, renderer.domElement);
                    controls.target.set(0, 8, 0);
                    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
                    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                    directionalLight.position.set(1, 1, 0.5).normalize();
                    scene.add(directionalLight);
                    scene.add(new THREE.GridHelper(32, 32, 0x444444, 0x444444));
                    window.addEventListener('resize', () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); });
                    animate();
                }

                function animate() {
                    requestAnimationFrame(animate);
                    controls.update();
                    if (model?.shouldTick) model.tick();
                    renderer.render(scene, camera);
                }

                async function buildModel(geo, textureUri) {
                    if (model) scene.remove(model.getGroup());
                    if (!geo || !geo['minecraft:geometry'] || !geo['minecraft:geometry'][0]) { document.getElementById('info').textContent = 'Invalid geometry format.'; return; }
                    const textureLoader = new THREE.TextureLoader();
                    const texture = textureUri ? await textureLoader.load(textureUri) : null;
                    model = new Model(geo['minecraft:geometry'][0]);
                    await model.create(texture);
                    scene.add(model.getGroup());
                    document.getElementById('info').textContent = \`Identifier: \${model.model.name}\`;
                    
                    // Re-apply animations to the new model
                    const animSelect = document.getElementById('anim-select');
                    const selectedAnim = animSelect.value;
                    populateAnimationList(allAnimationsFromFile, modelIdentifier);
                    animSelect.value = selectedAnim; // Restore selection
                    if (selectedAnim) model.animator.play(selectedAnim);
                }

                function populateTextureList(textures, identifier) {
                    const modelId = identifier.replace('geometry.', '');
                    const score = (name, id) => {
                        if (!id) return 0;
                        const lowerName = name.toLowerCase();
                        const lowerId = id.toLowerCase();
                        if (lowerName.includes(lowerId)) {
                            const parts = lowerName.split('/');
                            const fileName = parts[parts.length - 1];
                            if (fileName.startsWith(lowerId)) return 10;
                            return 5;
                        }
                        return 0;
                    };
                    
                    const textureSelect = document.getElementById('texture-select');
                    textureSelect.innerHTML = ''; // Clear

                    const sortedTextures = [...textures].sort((a, b) => score(b.name, modelId) - score(a.name, modelId));
                    const suggested = sortedTextures.filter(t => score(t.name, modelId) > 0);
                    const others = sortedTextures.filter(t => score(t.name, modelId) === 0);

                    textureSelect.appendChild(new Option("None", "")); // Add None option
                    if (suggested.length > 0) {
                        const group = document.createElement('optgroup');
                        group.label = "Suggested Textures";
                        suggested.forEach(tex => group.appendChild(new Option(tex.name, tex.uri)));
                        textureSelect.appendChild(group);
                    }
                    if (others.length > 0) {
                        const group = document.createElement('optgroup');
                        group.label = "Other Textures";
                        others.forEach(tex => group.appendChild(new Option(tex.name, tex.uri)));
                        textureSelect.appendChild(group);
                    }
                }
                
                function populateAnimationList(animations, identifier) {
                    if (!model) return;
                    model.animator.animations.clear(); // Clear old anims from animator

                    const modelId = identifier.replace('geometry.', '');
                    const score = (name, id) => {
                        if (!id) return 0;
                        const lowerName = name.toLowerCase();
                        const lowerId = id.toLowerCase();
                        if (lowerName.includes(lowerId)) return 10;
                        return 0;
                    };

                    const animSelect = document.getElementById('anim-select');
                    animSelect.innerHTML = ''; // Clear UI
                    
                    const allParsedAnims = [];
                    animations.forEach(animFile => {
                        try {
                            const animContent = JSON.parse(animFile.content);
                            if (animContent.animations) {
                                for (const animId in animContent.animations) {
                                    allParsedAnims.push({ id: animId, data: animContent.animations[animId] });
                                }
                            }
                        } catch(e) { console.error('Failed to parse animation file:', animFile.name, e); }
                    });

                    const sortedAnims = allParsedAnims.sort((a, b) => score(b.id, modelId) - score(a.id, modelId));
                    const suggested = sortedAnims.filter(a => score(a.id, modelId) > 0);
                    const others = sortedAnims.filter(a => score(a.id, modelId) === 0);

                    animSelect.appendChild(new Option("None", ""));
                    if (suggested.length > 0) {
                        const group = document.createElement('optgroup');
                        group.label = "Suggested Animations";
                        suggested.forEach(anim => {
                            model.animator.addAnimation(anim.id, anim.data);
                            group.appendChild(new Option(anim.id, anim.id));
                        });
                        animSelect.appendChild(group);
                    }
                     if (others.length > 0) {
                        const group = document.createElement('optgroup');
                        group.label = "Other Animations";
                        others.forEach(anim => {
                            model.animator.addAnimation(anim.id, anim.data);
                            group.appendChild(new Option(anim.id, anim.id));
                        });
                        animSelect.appendChild(group);
                    }
                }

                window.addEventListener('message', event => {
                    const { type, text, textures, animations, modelIdentifier: id } = event.data;
                    switch (type) {
                        case 'init': {
                            try {
                                currentGeo = JSON.parse(text);
                                modelIdentifier = id;
                                allTextures = textures;
                                allAnimationsFromFile = animations;
                                
                                buildModel(currentGeo, null).then(() => {
                                    populateTextureList(allTextures, modelIdentifier);
                                    populateAnimationList(allAnimationsFromFile, modelIdentifier);
                                });
                            } catch (e) {
                                document.getElementById('info').textContent = 'Error parsing JSON: ' + e.message;
                            }
                            break;
                        }
                        case 'update': {
                             try {
                                currentGeo = JSON.parse(text);
                                const textureUri = document.getElementById('texture-select').value;
                                buildModel(currentGeo, textureUri || null);
                             } catch(e) {
                                document.getElementById('info').textContent = 'Error parsing JSON: ' + e.message;
                             }
                            break;
                        }
                    }
                });

                document.getElementById('texture-select').addEventListener('change', (event) => {
                    buildModel(currentGeo, event.target.value || null);
                });

                document.getElementById('play-pause-btn').addEventListener('click', () => {
                    const animName = document.getElementById('anim-select').value;
                    if (!animName || !model) return;
                    const animation = model.animator.animations.get(animName);
                    if (animation) {
                        const btn = document.getElementById('play-pause-btn');
                        if (animation.shouldTick) {
                            animation.pause();
                            btn.textContent = "Play";
                        } else {
                            model.animator.pauseAll();
                            animation.play();
                            btn.textContent = "Pause";
                        }
                    }
                });

                document.getElementById('anim-select').addEventListener('change', (e) => {
                    model.animator.pauseAll();
                    const btn = document.getElementById('play-pause-btn');
                    const animName = e.target.value;
                    if(animName) {
                        model.animator.play(animName);
                        btn.textContent = "Pause";
                    } else {
                         btn.textContent = "Play";
                         // Re-render to reset to bind-pose
                         const textureUri = document.getElementById('texture-select').value;
                         buildModel(currentGeo, textureUri || null);
                    }
                });

                init();
                vscode.postMessage({ type: 'ready' });
			</script>
		</body>
		</html>
    `;
}