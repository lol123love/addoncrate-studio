// src/types/ItemOptions.ts

export interface IItemOptions {
    itemId: string; // e.g., super_sword
    displayName: string;
    icon: string;
    iconPath?: string; // The full path to the source icon file, if provided
    maxStackSize: number;
    handEquipped: boolean;
    foil: boolean;
    
    menuCategory: {
        category: 'construction' | 'equipment' | 'items' | 'nature';
        group: string; // e.g., "itemGroup.name.sword"
    } | null;

    isTool: {
        enabled: boolean;
        durability: number;
        damage: number;
        enchantable: {
            slot: 'sword' | 'axe' | 'pickaxe' | 'shovel' | 'hoe' | 'bow';
            value: number;
        } | null;
        repairItems: string; // Comma-separated list of item identifiers
    };
}