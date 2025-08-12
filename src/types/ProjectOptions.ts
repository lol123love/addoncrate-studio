// src/types/ProjectOptions.ts

export interface IProjectOptions {
    projectName: string;
    author: string;
    namespace: string; 
    targetVersion: string;
    packIconPath?: string;
    useLang: boolean;
    packs: {
        behavior: boolean;
        resource: boolean;
    };
    scripting: {
        useScripts: boolean;
        isBdsProject: boolean;
    };
    dependencies: {
        linkBehaviorToResource: boolean;
    };
}