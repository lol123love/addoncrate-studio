# AddonCrate Studio for Minecraft Bedrock

<p align="center">
  <img src="https://raw.githubusercontent.com/lol123love/addoncrate-studio/main/media/logo.png" alt="AddonCrate Studio Logo" width="150">
</p>

<p align="center">
  <strong>The definitive toolset for creating and managing Minecraft Bedrock Edition addons directly within Visual Studio Code.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=lol123love.addoncrate-studio">
    <img src="https://img.shields.io/visual-studio-marketplace/v/lol123love.addoncrate-studio?style=for-the-badge&logo=visualstudiocode&label=Marketplace" alt="Marketplace Version">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=lol123love.addoncrate-studio">
    <img src="https://img.shields.io/visual-studio-marketplace/i/lol123love.addoncrate-studio?style=for-the-badge" alt="Marketplace Installs">
  </a>
  <a href="https://github.com/lol123love/addoncrate-studio/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/lol123love/addoncrate-studio?style=for-the-badge" alt="License">
  </a>
</p>

---

**AddonCrate Studio** revolutionizes Minecraft Bedrock addon development by integrating a powerful, streamlined, and professional-grade toolset into VS Code. From project scaffolding to visual asset editing and intelligent file generation, AddonCrate Studio accelerates your workflow and empowers you to build higher-quality addons with ease.

## Core Philosophy

Our goal is to provide a comprehensive, all-in-one solution that handles the tedious aspects of addon creation, allowing you to focus on what truly matters: your creativity. We achieve this through:

*   **Intelligent Automation:** Generating correct file structures, manifests, and boilerplate code.
*   **Visual Editing:** Replacing raw JSON editing with intuitive graphical interfaces wherever possible.
*   **Project-Aware Context:** Tools that understand your project structure, automatically linking assets and providing relevant suggestions.
*   **Professional Workflow:** Encouraging best practices with a structured project system, from creation to export.

## Key Features

### 1. Centralized Management Hub: The AddonCrate Sidebar

A dedicated sidebar view that acts as your project's command center.

*   **Project Status:** At-a-glance view of your open project's name and detected packs (Behavior/Resource).
*   **Project Management:** Quick access to core lifecycle commands.
*   **Creator Tools:** A launchpad for all specialized UI-driven generators.
*   **Community Links:** Instantly access AddonCrate.com to share or discover addons.

<!-- It's recommended to replace this with an actual screenshot -->

### 2. Full Project Lifecycle Management

Manage your projects from start to finish without leaving VS Code.

*   **Project Creator:**
    *   A guided UI to scaffold new addon projects.
    *   Configure project name, author, and a unique namespace.
    *   Select a target Minecraft version from a comprehensive, categorized list (Latest, Recommended, Scripting-era, etc.).
    *   Choose to include Behavior Packs, Resource Packs, or both.
    *   Optionally include a scripting module with support for the latest `@minecraft/server` APIs or legacy `mojang-` APIs, based on the selected version.
    *   Automatically generate all necessary `manifest.json` files with correct UUIDs and dependencies.
    *   Select a custom `pack_icon.png` or use the provided default.
*   **Project Opener:**
    *   A visual interface to browse and open any existing AddonCrate project from your configured projects directory.
    *   Displays each project's name and pack icon for easy identification.
*   **Project Importer:**
    *   Create a new, fully-configured AddonCrate project from existing, standalone Behavior and/or Resource pack folders.
*   **Project Exporter:**
    *   Package your entire project into a distributable `.mcaddon` file with a single command.

### 3. Advanced Visual Editors

Go beyond raw text and edit your assets with powerful, intuitive custom editors.

*   **3D Model Viewer:**
    *   Opens `.geo.json` files in an interactive 3D viewport.
    *   **Intelligent Texture-Matching:** Automatically scans your project's resource pack and suggests the most relevant textures for the model.
    *   **Animation Previewing:** Discovers all `.animation.json` files in your project, allowing you to select and play animations directly on the model.
    *   Standard viewer controls (orbit, pan, zoom) and a grid for easy visualization.
*   **Recipe Editor:**
    *   A rich, visual, drag-and-drop editor for all major recipe types.
    *   **Supported Types:** Shaped, Shapeless, Furnace/Smelting, Smithing Transform, Smithing Trim, and Brewing.
    *   **Intelligent Item Registry:** Automatically fetches and caches vanilla Minecraft item data.
    *   **Custom Item Discovery:** Scans your project for custom items and adds them to the searchable item list.
    *   Easily create and modify recipes without writing a single line of JSON.

<!-- It's recommended to replace this with an actual screenshot -->

### 4. Guided UI-Driven Asset Creation

Generate complex addon files through simple, user-friendly forms.

*   **Item Creator:**
    *   Define core properties: Identifier, display name, stack size.
    *   Visually select an icon texture or use a placeholder.
    *   Configure creative menu category and group.
    *   Enable tool functionality with settings for durability, damage, enchantability, and repair items.
*   **Entity Creator:**
    *   Define core properties: Identifier, display name, health, and movement speed.
    *   Configure spawn egg colors and spawning behavior.
    *   Link to existing model, texture, and animation files, or let the tool generate complete placeholder files for you.
*   **Block Creator:**
    *   Define core properties: Identifier, display name, and map color.
    *   Select a texture or generate a placeholder.
    *   Choose from material presets (Stone, Wood, Dirt, Metal) to auto-fill common properties.
    *   Fine-tune behavior: Destroy time, explosion resistance, friction, and lighting.
*   **Loot Table Creator:**
    *   Dynamically add and configure loot pools with roll counts.
    *   Add weighted entries for items, other loot tables, or empty results.
    *   Attach functions, such as `set_count`, to entries.
*   **Universal File Creator:**
    *   A single, powerful interface to create any of the dozens of file types supported by the Bedrock engine.
    *   Files are organized into logical categories (Recipes, Entities, World Gen, Visuals, etc.).
    *   Each file type includes a minimal, valid boilerplate structure, getting you started instantly.

## Installation

1.  Open **Visual Studio Code**.
2.  Go to the **Extensions** view (`Ctrl+Shift+X`).
3.  Search for `AddonCrate Studio`.
4.  Click **Install**.
5.  Restart VS Code if prompted.

## Getting Started

1.  **Set Your Projects Folder:** Run the command `AddonCrate: Set Default Projects Location` from the Command Palette (`Ctrl+Shift+P`) and select a folder where all your new projects will be stored.
2.  **Create a New Project:** Run the command `AddonCrate: Create New Addon Project...` or use the button in the sidebar. Fill out the details in the webview and click "Create Project".
3.  **Open the Project:** The extension will prompt you to open the newly created project folder.
4.  **Start Creating!** Use the "Creator Tools" in the sidebar to add your first custom item, block, or entity. Files will be generated in the correct locations with all necessary boilerplate.

## Commands List

| Command                                            | Description                                                   |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `addoncrate-creator.createProject`                 | Opens the UI to create a new addon project.                   |
| `addoncrate-creator.openProject`                   | Opens a panel to browse and open existing projects.           |
| `addoncrate-creator.importProject`                 | Opens the UI to import packs into a new project structure.    |
| `addoncrate-creator.exportProject`                 | Exports the current project as a `.mcaddon` file.             |
| `addoncrate-creator.setProjectsLocation`           | Sets the global default directory for storing projects.       |
| `addoncrate-creator.createFile`                    | Opens the UI to create any generic addon file.                |
| `addoncrate-creator.createItem`                    | Opens the UI to create a new custom item.                     |
| `addoncrate-creator.createEntity`                  | Opens the UI to create a new custom entity.                   |
| `addoncrate-creator.createBlock`                   | Opens the UI to create a new custom block.                    |
| `addoncrate-creator.createLootTable`               | Opens the UI to create a new loot table.                      |
| `addoncrate.clearVanillaCache`                     | Clears the cached vanilla Minecraft item data.                |

## Configuration

*   `addoncrate.projects.location`: The default directory where your new addon projects will be created and where the "Open Project" command will look for them.

## Contributing & Feedback

This project is open-source and we welcome contributions! If you have ideas for new features, bug reports, or any other feedback, please visit our repository or support page.

*   **GitHub Repository:** [https://github.com/lol123love/addoncrate-studio](https://github.com/lol123love/addoncrate-studio)
*   **Report an Issue / Get Support:** [https://addoncrate.com/support](https://addoncrate.com/support)

---

Developed with ❤️ by the AddonCrate Team.