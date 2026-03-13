# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start esbuild in watch mode (dev build with inline sourcemaps)
npm run build        # Type-check + production build (minified, no sourcemaps)
npm run lint         # Run ESLint
npm version patch    # Bump patch version (updates manifest.json, versions.json, package.json)
```

There is no automated test suite — testing is manual: copy `main.js`, `manifest.json`, and `styles.css` to the vault's plugin folder and reload Obsidian.

## Architecture

This is an **Obsidian community plugin** written in TypeScript, bundled by esbuild into a single `main.js` file loaded directly by Obsidian.

**Entry point**: `src/main.ts` — exports the default plugin class extending `Plugin`. Keep this file focused on lifecycle (`onload`, `onunload`) and command/setting registration only. Delegate all feature logic to modules under `src/`.

**Current source layout**:
- `src/main.ts` — Plugin class, `onload`/`onunload`, command registration, ribbon/status bar, DOM/interval listener registration
- `src/settings.ts` — `MyPluginSettings` interface, `DEFAULT_SETTINGS`, `SampleSettingTab` class

**Build output**: `main.js` at the repo root (not tracked in git). The bundler marks `obsidian`, `electron`, and all `@codemirror/*` / `@lezer/*` packages as external — Obsidian provides these at runtime.

**Settings persistence**: use `this.loadData()` / `this.saveData()` on the plugin instance. The pattern is established in `loadSettings()` / `saveSettings()` in `main.ts`.

**Listener registration**: always use `this.registerEvent(...)`, `this.registerDomEvent(...)`, and `this.registerInterval(...)` so Obsidian cleans up automatically on plugin disable.

## Key conventions (from AGENTS.md)

- TypeScript strict mode is enabled (`noImplicitAny`, `strictNullChecks`, etc.).
- Keep `main.ts` minimal — split any file that grows beyond ~200–300 lines into focused modules.
- Command IDs must be stable after release; never rename them.
- No network requests without explicit user opt-in and documentation.
- `isDesktopOnly` is currently `false` — avoid Node/Electron-only APIs unless you change this.

## Releasing

1. Update `minAppVersion` in `manifest.json` if new APIs are used.
2. Run `npm version patch|minor|major` — automatically bumps `manifest.json`, `package.json`, and `versions.json`.
3. Create a GitHub release tagged with the exact version string (no `v` prefix).
4. Attach `main.js`, `manifest.json`, and `styles.css` as release assets.
