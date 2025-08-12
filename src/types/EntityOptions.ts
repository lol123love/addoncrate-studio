// src/types/EntityOptions.ts

export interface IEntityOptions {
    identifier: string;
    displayName: string;
    spawnEgg: {
        baseColor: string;
        overlayColor: string;
    };
    isSpawnable: boolean;
    isSummonable: boolean;
    health: number;
    moveSpeed: number;
    texture?: string; // The short name for the texture
    texturePath?: string; // The full path to the source texture file
    model?: string;
    animation?: string;
    animationController?: string;
}