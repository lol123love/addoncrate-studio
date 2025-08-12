// src/types/BlockOptions.ts

/**
 * Defines the structure for the data captured from the block creation form.
 */
export interface IBlockOptions {
    identifier: string;
    displayName: string;
    texture: string; // The short name of the texture
    texturePath?: string; // The full path to the source texture file, if provided by the user
    material: 'stone' | 'wood' | 'dirt' | 'metal';
    destroyTime: number;
    explosionResistance: number;
    friction: number;
    lightEmission: number;
    lightDampening: number;
    mapColor: string;
}