// src/data/minecraftVersions.ts

/**
 * A centralized and categorized list of Minecraft Bedrock versions.
 * This structure allows for easy maintenance and intelligent UI generation.
 */

// These can be updated easily when new versions are released
const LATEST_STABLE = '1.21.0';
const LATEST_PREVIEW = '1.21.110';

// A curated list of important and recent versions for the main dropdown
const RECOMMENDED_VERSIONS = [
    '1.21.0',
    '1.20.80',
    '1.20.60',
    '1.19.80',
];

// Versions where the modern '@minecraft/server' API is standard
const MODERN_SCRIPTING_VERSIONS = [
    '1.21.0', '1.20.81', '1.20.80', '1.20.73', '1.20.72', '1.20.71', '1.20.70', 
    '1.20.62', '1.20.60', '1.20.51', '1.20.50', '1.20.41', '1.20.40',
    '1.19.83', '1.19.81', '1.19.80', '1.19.73', '1.19.72', '1.19.71', '1.19.70', 
    '1.19.63', '1.19.62', '1.19.60', '1.19.51', '1.19.50', '1.19.41', '1.19.40'
];

// Versions that use the legacy 'mojang-' scripting APIs
const LEGACY_SCRIPTING_VERSIONS = [
    '1.19.31', '1.19.30', '1.19.22', '1.19.21', '1.19.20', '1.19.11', '1.19.10', '1.19.2', '1.19.0',
    '1.18.33', '1.18.32', '1.18.31', '1.18.30', '1.18.12', '1.18.11', '1.18.10', '1.18.2', '1.18.1', '1.18.0'
];

// Versions with no scripting API support
const PRE_SCRIPTING_VERSIONS = [
    '1.17.41', '1.17.40', '1.17.34', '1.17.33', '1.17.32', '1.17.30', '1.17.11', '1.17.10', '1.17.2', '1.17.1', '1.17.0',
    '1.16.221', '1.16.220', '1.16.210', '1.16.201', '1.16.200', '1.16.101', '1.16.100',
    '1.14.60',
    '1.13.3', '1.13.0',
    '1.12.1', '1.12.0',
    '1.11.4', '1.11.0',
    '1.10.0',
    '1.9.0',
    '1.8.0',
    '1.7.0',
    '1.6.0',
    '1.5.0',
    '1.4.0',
    '1.2.0'
];


/**
 * The main export containing categorized version data for use in the UI.
 */
export const VersionGroups = {
    latestStable: LATEST_STABLE,
    latestPreview: LATEST_PREVIEW,
    recommended: RECOMMENDED_VERSIONS,
    modernScripting: MODERN_SCRIPTING_VERSIONS,
    legacyScripting: LEGACY_SCRIPTING_VERSIONS,
    preScripting: PRE_SCRIPTING_VERSIONS
};