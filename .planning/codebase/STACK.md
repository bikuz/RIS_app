# Technology Stack

**Analysis Date:** 2026-05-13

## Languages

**Primary:**
- TypeScript ^5.0.0 - Type-safe application code and configuration
- JavaScript - Legacy component fallback and server setup

**Secondary:**
- Svelte 5.0.0 - Component framework (reactive UI templates)
- HTML/CSS - Standard markup and styling

## Runtime

**Environment:**
- Node.js (version specified by `.nvmrc` if present, otherwise defaults to latest LTS)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core Web Framework:**
- SvelteKit ^2.22.0 - Full-stack JavaScript framework with routing, SSR, and build
  - Adapter: `@sveltejs/adapter-node` ^5.2.12 - Node.js server deployment with IIS compatibility
  - Vite Plugin: `@sveltejs/vite-plugin-svelte` ^6.0.0 - Build integration

**UI/Styling:**
- Tailwind CSS ^4.0.0 - Utility-first CSS framework
  - `@tailwindcss/vite` ^4.0.0 - Vite integration
  - `@tailwindcss/forms` ^0.5.9 - Form component styling
  - `@tailwindcss/typography` ^0.5.15 - Rich text styling
- Lucide Svelte Icons `@lucide/svelte` ^0.514.0 - Icon component library

**Geospatial/Mapping:**
- OpenLayers (ol) ^10.6.1 - Interactive map library
  - Supports WMS, TileLayer, ImageLayer, and various geometry operations
  - Used for map initialization, layer management, and interaction
- ArcGIS API `@arcgis/core` ^4.33.12 - Esri mapping and 3D visualization (partial/legacy)
  - CSS assets: `@arcgis/core/assets/esri/themes/light/main.css`
  - Scene View, 3D visualization, and advanced geospatial features

**Charting:**
- Highcharts ^12.3.0 - Interactive data visualization
  - Dynamic chart creation: line, column, bar, pie, population pyramid
  - Module imports: exporting capabilities (currently commented out)

**Server/Backend:**
- Express ^5.1.0 - Web server for Node.js deployment
  - Used in `server.cjs` for CommonJS compatibility with IIS hosting
  - Serves static files and SvelteKit handler

## Key Dependencies

**Critical:**
- `@arcgis/core` ^4.33.12 - ESRI geospatial services and 3D mapping
- `ol` (OpenLayers) ^10.6.1 - Primary mapping library for WMS/tile layers
- `highcharts` ^12.3.0 - Data visualization for thematic analysis
- `express` ^5.1.0 - Production server for Node.js runtime

**Development Utilities:**
- Vite ^7.0.4 - Build tool and dev server
- SvelteKit tools - Type checking, preprocessing, sync operations
- TypeScript ^5.0.0 - Type checking and compilation
- Prettier ^3.4.2 - Code formatting
  - `prettier-plugin-svelte` ^3.3.3 - Svelte component formatting
  - `prettier-plugin-tailwindcss` ^0.6.11 - Tailwind class sorting
- ESLint ^9.18.0 - Code quality and linting
  - `@eslint/js` ^9.18.0 - JavaScript rules
  - `typescript-eslint` ^8.20.0 - TypeScript support
  - `eslint-plugin-svelte` ^3.0.0 - Svelte/component support
  - `eslint-config-prettier` ^10.0.1 - Prettier integration
- Svelte Check ^4.0.0 - Static analysis for Svelte components

**Cross-Cutting:**
- `cross-env` ^7.0.3 - Cross-platform environment variable handling

## Configuration

**Environment:**
- Environment variables prefixed with `VITE_` are accessible in frontend code
- Production environment detected via `NODE_ENV=production`
- Base path configuration: `/ris` in production, `/` in development (for IIS hosting)
- Relative path mode: enabled for IIS compatibility

**Build:**
- `vite.config.ts` - Vite build configuration
  - Tailwind CSS and SvelteKit plugins enabled
  - Base path set dynamically based on `NODE_ENV`
- `tsconfig.json` - TypeScript compilation
  - Strict mode enabled
  - JSON module resolution enabled
  - Source maps generated
  - Extends `.svelte-kit/tsconfig.json` for SvelteKit types
- `svelte.config.js` - SvelteKit framework configuration
  - Vite preprocessing enabled
  - Output directory: `build/`
  - Static asset compression: disabled
- `tailwind.config.js` - Tailwind CSS configuration
  - Content paths: `./src/**/*.{html,js,svelte,ts}`
  - Primary blue color theme defined

**Formatting & Linting:**
- `.prettierrc` - Prettier configuration
  - Tab indentation (4 spaces recommended in IDE)
  - Single quotes for strings
  - Print width: 100 characters
  - Plugins: svelte, tailwindcss
  - Tailwind stylesheet: `./src/app.css`
- `eslint.config.js` - ESLint configuration
  - Flat config format (ESLint 9+)
  - Includes gitignore file exclusions
  - TypeScript and Svelte support
  - No-undef rule disabled (handled by TypeScript)

## Platform Requirements

**Development:**
- Node.js (version unspecified, verify with team)
- npm for dependency management
- Modern browser with ES2020+ support

**Production:**
- Node.js runtime (same version as development)
- IIS hosting support configured via `svelte.config.js`
  - Server entry: `server.cjs` (CommonJS for compatibility)
  - Base path: `/ris` context
  - Static file serving from `build/client` and `static/` directories

---

*Stack analysis: 2026-05-13*
