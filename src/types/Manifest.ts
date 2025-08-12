// src/types/Manifest.ts

// Based on: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest

// EXPORT these types so they can be imported by other files.
export type SemVer = string;
export type Vector = [number, number, number];

export interface ManifestHeader {
    name: string;
    description: string;
    uuid: string;
    version: Vector | SemVer;
    min_engine_version?: Vector | SemVer;
    lock_template_options?: boolean;
    base_game_version?: Vector | SemVer;
    pack_scope?: 'world' | 'global' | 'any';
}

export interface ManifestModule {
    type: 'resources' | 'data' | 'world_template' | 'script' | 'skin_pack' | 'javascript';
    uuid: string;
    version: Vector | SemVer;
    description?: string;
    language?: 'javascript';
    entry?: string;
}

export interface ManifestDependency {
    uuid?: string;
    module_name?: string; // e.g., @minecraft/server
    version: Vector | SemVer;
}

export interface ManifestMetadata {
    authors?: string[];
    license?: string;
    url?: string;
    generated_with?: { [tool_name: string]: SemVer[] };
}

export interface Manifest {
    format_version: number;
    header: ManifestHeader;
    modules: ManifestModule[];
    dependencies?: ManifestDependency[];
    capabilities?: ('chemistry' | 'editorExtension' | 'experimental_custom_ui' | 'raytraced')[];
    metadata?: ManifestMetadata;
}