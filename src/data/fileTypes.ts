// src/data/fileTypes.ts

// PHILOSOPHY: Each boilerplate should be the most minimal, valid file structure.
// This gives the developer a clean slate to work from, rather than forcing
// them to delete non-relevant "example" components.

export interface FileTypeDefinition {
    label: string;
    pack: 'BP' | 'RP';
    path: string;
    extension: string;
    description: string;
    getBoilerplate: (id: string, namespace:string) => string;
}

// We add a 'key' to the definition to use as a unique identifier
export interface FileTypeDefinitionWithKey extends FileTypeDefinition {
    key: string;
}

export interface FileTypeCategory {
    name: string;
    icon: string; // Codicon icon name
    files: FileTypeDefinitionWithKey[];
}

// The new categorized structure that will power our UI
export const fileTypeCategories: FileTypeCategory[] = [
    {
        name: 'Recipes',
        icon: 'beaker',
        files: [
            { key: 'recipe_shaped', label: 'Shaped Recipe', pack: 'BP', path: 'recipes', extension: '.json', description: 'A crafting recipe that requires a specific ingredient pattern.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.12","minecraft:recipe_shaped":{"description":{"identifier":`${ns}:${id}`},"tags":["crafting_table"],"pattern":[" # "," # "," # "],"key":{"#":{"item":"minecraft:stick"}},"result":{"item":`${ns}:item_name`}}}, null, 4) },
            { key: 'recipe_shapeless', label: 'Shapeless Recipe', pack: 'BP', path: 'recipes', extension: '.json', description: 'A crafting recipe where ingredient arrangement does not matter.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.12","minecraft:recipe_shapeless":{"description":{"identifier":`${ns}:${id}`},"tags":["crafting_table"],"ingredients":[],"result":{"item":`${ns}:item_name`,"count":1}}}, null, 4) },
            { key: 'recipe_furnace', label: 'Furnace Recipe', pack: 'BP', path: 'recipes', extension: '.json', description: 'A smelting/cooking recipe for a furnace, smoker, or blast furnace.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.12","minecraft:recipe_furnace":{"description":{"identifier":`${ns}:${id}`},"tags":["furnace"],"input":"minecraft:iron_ore","output":"minecraft:iron_ingot"}}, null, 4) },
            { key: 'recipe_brewing', label: 'Brewing Recipe', pack: 'BP', path: 'recipes', extension: '.json', description: 'A brewing recipe for the Brewing Stand.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.12","minecraft:recipe_brewing_mix":{"description":{"identifier":`${ns}:${id}`},"tags":["brewing_stand"],"input":"minecraft:potion_type:awkward","reagent":"minecraft:magma_cream","output":"minecraft:potion_type:fire_resistance"}}, null, 4) },
            { key: 'recipe_smithing_transform', label: 'Smithing Transform Recipe', pack: 'BP', path: 'recipes', extension: '.json', description: 'A recipe to transform items at a Smithing Table (e.g., Netherite upgrade).', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.20.10","minecraft:recipe_smithing_transform":{"description":{"identifier":`${ns}:${id}`},"tags":["smithing_table"],"template":"minecraft:netherite_upgrade_smithing_template","base":"minecraft:diamond_sword","addition":"minecraft:netherite_ingot","result":{"item":"minecraft:netherite_sword"}}}, null, 4) },
            { key: 'recipe_smithing_trim', label: 'Smithing Trim Recipe', pack: 'BP', path: 'recipes', extension: '.json', description: 'A recipe for applying cosmetic armor trims.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.20.10","minecraft:recipe_smithing_trim":{"description":{"identifier":`${ns}:${id}`},"tags":["smithing_table"],"template":"minecraft:sentry_armor_trim_smithing_template","base":"minecraft:iron_chestplate","addition":"minecraft:amethyst_shard"}}, null, 4) }
        ]
    },
    {
        name: 'Entities & Items',
        icon: 'package',
        files: [
            { key: 'entity', label: 'Entity', pack: 'BP', path: 'entities', extension: '.json', description: 'Defines the behavior of a custom entity.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.21.0","minecraft:entity":{"description":{"identifier":`${ns}:${id}`,"is_spawnable":true,"is_summonable":true},"components":{}}}, null, 4) },
            { key: 'client_entity', label: 'Client Entity', pack: 'RP', path: 'entity', extension: '.json', description: 'Defines the visual appearance of an entity.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.10.0","minecraft:client_entity":{"description":{"identifier":`${ns}:${id}`,"materials":{},"textures":{},"geometry":{},"render_controllers":[]}}}, null, 4) },
            { key: 'item', label: 'Item', pack: 'BP', path: 'items', extension: '.json', description: 'Defines the behavior of a custom item.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.21.0","minecraft:item":{"description":{"identifier":`${ns}:${id}`},"components":{}}}, null, 4) },
            { key: 'client_item', label: 'Client Item (Legacy)', pack: 'RP', path: 'items', extension: '.json', description: 'Defines the visual appearance of a custom item (legacy method).', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.10.0","minecraft:item":{"description":{"identifier":`${ns}:${id}`},"components":{"minecraft:icon":id}}}, null, 4) },
            { key: 'attachable', label: 'Attachable', pack: 'RP', path: 'attachables', extension: '.json', description: 'Defines items that can be attached to entities.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.10.0","minecraft:attachable":{"description":{"identifier":`${ns}:${id}`,"materials":{"default":"entity_alphatest"},"textures":{"default":`textures/entity/${id}`},"geometry":{"default":`geometry.${id}`},"render_controllers":["controller.render.armor"]}}}, null, 4) },
        ]
    },
    {
        name: 'Spawning & Loot',
        icon: 'gift',
        files: [
            { key: 'spawn_rule', label: 'Spawn Rule', pack: 'BP', path: 'spawn_rules', extension: '.json', description: 'Defines conditions under which a mob can naturally spawn.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.8.0","minecraft:spawn_rules":{"description":{"identifier":`${ns}:${id}`},"conditions":[]}}, null, 4) },
            { key: 'loot_table', label: 'Loot Table', pack: 'BP', path: 'loot_tables', extension: '.json', description: 'Defines random item drops.', getBoilerplate: (id, ns) => JSON.stringify({"pools":[]}, null, 4) },
            { key: 'trade_table', label: 'Trade Table', pack: 'BP', path: 'trading', extension: '.json', description: 'Defines the trades for a custom villager.', getBoilerplate: (id, ns) => JSON.stringify({"tiers":[]}, null, 4) },
        ]
    },
    {
        name: 'World Generation',
        icon: 'globe',
        files: [
            { key: 'biome', label: 'Biome', pack: 'BP', path: 'biomes', extension: '.json', description: 'Defines a custom biome.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.13.0","minecraft:biome":{"description":{"identifier":`${ns}:${id}`},"components":{}}}, null, 4) },
            { key: 'feature_rule', label: 'Feature Rule', pack: 'BP', path: 'feature_rules', extension: '.json', description: 'Defines the rules for where and how a feature can be placed.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.13.0","minecraft:feature_rules":{"description":{"identifier":`${ns}:${id}`,"places_feature":`${ns}:my_feature`},"conditions":{"placement_pass":"surface_pass","minecraft:biome_filter":[]}}}, null, 4) },
            { key: 'volume', label: 'Volume', pack: 'BP', path: 'volumes', extension: '.json', description: 'Defines a 3D area in the world.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.17.10","minecraft:volume":{"description":{"identifier":`${ns}:${id}`},"components":{}}}, null, 4) },
        ]
    },
    {
        name: 'World Generation Features',
        icon: 'map',
        files: [
            { key: 'feature_single_block', label: 'Single Block Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Places a single block, like a flower or pumpkin.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.13.0","minecraft:single_block_feature":{"description":{"identifier":`${ns}:${id}`},"places_block":"minecraft:stone","enforce_placement_rules":true,"may_replace":["minecraft:air"]}}, null, 4) },
            { key: 'feature_ore', label: 'Ore Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Places a vein of blocks, like coal or iron ore.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.18.0","minecraft:ore_feature":{"description":{"identifier":`${ns}:${id}`},"count":9,"replace_rules":[{"places_block":"minecraft:iron_ore","may_replace":["minecraft:stone"]}]}}, null, 4) },
            { key: 'feature_scatter', label: 'Scatter Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Scatters a feature multiple times in an area.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.13.0","minecraft:scatter_feature":{"description":{"identifier":`${ns}:${id}`},"iterations":10,"places_feature":`${ns}:my_other_feature`,"x":{"distribution":"uniform","extent":[0,15]},"z":{"distribution":"uniform","extent":[0,15]},"y":0}}, null, 4) },
            { key: 'feature_tree', label: 'Tree Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Places a complex tree with trunk, canopy, and decorations.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.13.0","minecraft:tree_feature":{"description":{"identifier":`${ns}:${id}`},"trunk":{"trunk_height":{"base":4,"variance":2},"trunk_block":"minecraft:log"},"canopy":{"canopy":{"min_width":3,"leaf_block":"minecraft:leaves"}}}}, null, 4) },
            { key: 'feature_structure', label: 'Structure Template Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Places a .mcstructure file into the world.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.13.0","minecraft:structure_template_feature":{"description":{"identifier":`${ns}:${id}`},"structure_name":`mystructure:${id}`,"adjustment_radius":8,"facing_direction":"random","constraints":{"grounded":{}}}}, null, 4) },
            { key: 'feature_aggregate', label: 'Aggregate Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Places a collection of features at the same position.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.16.0","minecraft:aggregate_feature":{"description":{"identifier":`${ns}:${id}`},"features":[]}}, null, 4) },
            { key: 'feature_sequence', label: 'Sequence Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Places features sequentially, where one starts at the end of the previous.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.16.0","minecraft:sequence_feature":{"description":{"identifier":`${ns}:${id}`},"features":[]}}, null, 4) },
            { key: 'feature_weighted_random', label: 'Weighted Random Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Randomly selects and places one feature from a weighted list.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.16.0","minecraft:weighted_random_feature":{"description":{"identifier":`${ns}:${id}`},"features":[[`${ns}:feature_a`,10],[`${ns}:feature_b`,1]]}}, null, 4) },
            { key: 'feature_search', label: 'Search Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Searches a volume for a valid position to place a feature.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.16.0","minecraft:search_feature":{"description":{"identifier":`${ns}:${id}`},"places_feature":`${ns}:my_other_feature`,"search_volume":{"min":[-8,-8,-8],"max":[8,8,8]},"search_axis":"+y","required_successes":1}}, null, 4) },
            { key: 'feature_cave_carver', label: 'Cave Carver Feature', pack: 'BP', path: 'features', extension: '.json', description: 'Carves a cave through the world (used in the pregeneration pass).', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.18.0","minecraft:cave_carver_feature":{"description":{"identifier":`${ns}:${id}`},"fill_with":{"name":"minecraft:air"},"width_modifier":0,"skip_carve_chance":0.75,"height_limit":255,"y_scale":1,"horizontal_radius_multiplier":1,"vertical_radius_multiplier":1,"floor_level":0.5}}, null, 4) },
        ]
    },
    {
        name: 'Advanced World Generation',
        icon: 'versions',
        files: [
            { key: 'dimension', label: 'Dimension', pack: 'BP', path: 'dimensions', extension: '.json', description: 'Defines a custom dimension with unique generation rules.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.19.0","minecraft:dimension":{"description":{"identifier":`${ns}:${id}`},"components":{"minecraft:dimension_bounds":{"min":0,"max":256},"minecraft:generation":{"generator_type":"void"}}}}, null, 4) },
            { key: 'jigsaw_structure', label: 'Jigsaw Structure', pack: 'BP', path: 'structures', extension: '.json', description: 'Defines a procedural structure using jigsaw blocks and template pools.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.21.20","minecraft:jigsaw":{"description":{"identifier":`${ns}:${id}`},"start_pool":`${ns}:my_pool`,"max_depth":7,"terrain_adaptation":"beard_thin"}}, null, 4) },
        ]
    },
    {
        name: 'Visuals & Rendering',
        icon: 'device-camera-video',
        files: [
            { key: 'client_animation', label: 'Client Animation', pack: 'RP', path: 'animations', extension: '.animation.json', description: 'Defines keyframe animations for entities or models.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.8.0","animations":{[`animation.${ns}.${id}`]:{}}}, null, 4) },
            { key: 'client_anim_controller', label: 'Client Animation Controller', pack: 'RP', path: 'animation_controllers', extension: '.controller.json', description: 'Manages which animations to play and when.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.10.0","animation_controllers":{[`controller.animation.${ns}.${id}`]:{"states":{"default":{"transitions":[{"main":"true"}]}}}}}, null, 4) },
            { key: 'fog', label: 'Fog Settings', pack: 'RP', path: 'fogs', extension: '.json', description: 'Defines custom fog settings.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.16.100","minecraft:fog_settings":{"description":{"identifier":`${ns}:${id}`},"distance":{},"volumetric":{}}}, null, 4) },
            { key: 'material', label: 'Material', pack: 'RP', path: 'materials', extension: '.material', description: 'Defines custom materials for rendering.', getBoilerplate: (id, ns) => JSON.stringify({"materials":{"version":"1.0.0",[`${id}_material`]:{"+states":["Blending"]}}}, null, 4) },
            { key: 'particle', label: 'Particle Effect', pack: 'RP', path: 'particles', extension: '.json', description: 'Defines a custom particle effect.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.10.0","particle_effect":{"description":{"identifier":`${ns}:${id}`,"basic_render_parameters":{"material":"particles_alpha","texture":"textures/particle/particles"}},"components":{}}}, null, 4) },
            { key: 'render_controller', label: 'Render Controller', pack: 'RP', path: 'render_controllers', extension: '.json', description: 'Advanced logic for how an entity should render.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.10.0","render_controllers":{[`controller.render.${ns}.${id}`]:{"geometry":"Geometry.default","materials":[{"*":"Material.default"}],"textures":["Texture.default"]}}}, null, 4) },
            { key: 'texture_set', label: 'Texture Set', pack: 'RP', path: 'textures/texture_sets', extension: '.json', description: 'Defines a set of textures for a block.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.16.100","minecraft:texture_set":{"color":id}}, null, 4) },
        ]
    },
    {
        name: 'Cameras, Lighting & UI',
        icon: 'lightbulb',
        files: [
            { key: 'camera_preset', label: 'Camera Preset', pack: 'RP', path: 'cameras', extension: '.json', description: 'Defines custom camera perspectives and behaviors.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.21.0","minecraft:camera_preset":{"identifier":`${ns}:${id}`}}, null, 4) },
            { key: 'lighting_settings', label: 'Lighting Settings', pack: 'RP', path: 'lighting', extension: '.json', description: 'Defines custom lighting for a dimension.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.21.40","minecraft:lighting_settings":{"description":{"identifier":`${ns}:${id}`},"directional_lights":{"orbit":{"sun":{"illuminance":100000},"moon":{"illuminance":200}}},"ambient":{"illuminance":0.5}}}, null, 4) },
            { key: 'block_culling', label: 'Block Culling Rules', pack: 'RP', path: 'culling', extension: '.json', description: 'Defines rules for culling block faces to improve performance.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.20.60","minecraft:block_culling_rules":{"description":{"identifier":`${ns}:${id}`},"rules":[]}}, null, 4) },
            { key: 'ui', label: 'UI', pack: 'RP', path: 'ui', extension: '.json', description: 'Defines a custom user interface screen.', getBoilerplate: (id, ns) => JSON.stringify({[`${ns}_${id}_namespace`]:{"type":"screen"}}, null, 4) },
        ]
    },
    {
        name: 'Technical',
        icon: 'code',
        files: [
            { key: 'function', label: 'Function', pack: 'BP', path: 'functions', extension: '.mcfunction', description: 'A list of slash commands to be executed in sequence.', getBoilerplate: (id, ns) => `# This is the function file for ${ns}:${id}` },
            { key: 'script', label: 'Script', pack: 'BP', path: 'scripts', extension: '.js', description: 'A JavaScript file for use with the Scripting API.', getBoilerplate: (id, ns) => `// Script file for project: ${ns}\nconsole.log("Script loaded: ${id}");\n` },
            { key: 'dialogue', label: 'NPC Dialogue', pack: 'BP', path: 'dialogue', extension: '.json', description: 'Defines dialogue scenes and interactions for NPCs.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.17.0","minecraft:npc_dialogue":{"scenes":[{"scene_tag":`${ns}_scene_1`,"npc_name":{"rawtext":[{"text":"NPC Name"}]},"text":{"rawtext":[{"text":"Hello!"}]},"buttons":[{"name":"Button 1","commands":["/say Hello World"]}]}]}}, null, 4) },
            { key: 'aim_assist_categories', label: 'Aim Assist Categories', pack: 'BP', path: 'aim_assist', extension: '.json', description: 'Defines categories for aim assist targeting.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.21.50","minecraft:aim_assist_categories":{"identifier":`${ns}:${id}`,"categories":[{"name":"default"}]}}, null, 4) },
            { key: 'aim_assist_preset', label: 'Aim Assist Preset', pack: 'BP', path: 'aim_assist', extension: '.json', description: 'Configures aim assist behavior using defined categories.', getBoilerplate: (id, ns) => JSON.stringify({"format_version":"1.21.50","minecraft:aim_assist_preset":{"identifier":`${ns}:${id}`,"categories":`${ns}:${ns}_categories`,"default_item_settings":"default"}}, null, 4) },
        ]
    }
];

// We still create the flat map for any other part of the code that might need it.
export const fileTypeMap = new Map<string, FileTypeDefinition>();
fileTypeCategories.forEach(category => {
    category.files.forEach(file => {
        const { key, ...definition } = file;
        fileTypeMap.set(key, definition);
    });
});