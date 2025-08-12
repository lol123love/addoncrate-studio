// src/types/LootTableOptions.ts

export interface ILootTableOptions {
    fileName: string;
    pools: ILootPool[];
}

export interface ILootPool {
    rolls: {
        min: number;
        max: number;
    } | number;
    entries: ILootEntry[];
}

export interface ILootEntry {
    type: 'item' | 'loot_table' | 'empty';
    name?: string; // Identifier for 'item' or path for 'loot_table'
    weight: number;
    functions?: ILootFunction[];
}

export interface ILootFunction {
    function: 'set_count';
    count?: {
        min: number;
        max: number;
    } | number;
}