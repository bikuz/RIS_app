# Coding Conventions

**Analysis Date:** 2026-05-13

## Naming Patterns

**Files:**
- Svelte components: `PascalCase.svelte` (e.g., `MapComponent.svelte`, `Chart.svelte`)
- Data files: `camelCase.ts` (e.g., `climate.ts`, `demography.ts`, `themeData.ts`)
- Routes: `camelCase` directory names with `+page.svelte` entry points
- Route segments: Kebab-case for multi-word segments (e.g., `human-dimensions`, `air-quality`)

**Functions:**
- camelCase for function names (e.g., `initializeMap`, `updateMapView`, `loadHighcharts`, `createChart`)
- Handler functions prefixed with "handle" (e.g., `handleFullScreen`)
- Getter functions follow pattern `getTopicName()`, `getTopicIcon()`, `getTopicColor()`
- Reactive functions use `$` prefix in Svelte 5 (e.g., `$props()`, `$state()`)

**Variables:**
- camelCase for all variable names
- State variables in Svelte 5: `let variableName = $state(initialValue)` (e.g., `let mapContainer: HTMLDivElement`, `let isFullscreen = $state(false)`)
- Reactive declarations use `$:` (e.g., `$: if (map && currentTopic) { updateMapView(); }`)
- Configuration objects follow PascalCase pattern for type names but camelCase for instances
- Constants: UPPER_SNAKE_CASE for true constants (e.g., `HKH_CENTER`, `HKH_ZOOM`)

**Types:**
- PascalCase for all TypeScript types (e.g., `QuestionConfig`, `QuestionControl`, `ChartData`, `Topic`, `AllTopicConfigs`)
- Type files located in `$lib/types/` directory
- Exported using `export type` syntax

## Code Style

**Formatting:**
- Prettier with custom config:
  - Tabs (not spaces)
  - Single quotes enabled
  - Trailing commas: none
  - Print width: 100 characters
  - Plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`
  - Svelte parser configured in overrides

**Linting:**
- ESLint with TypeScript support
- Config: `eslint.config.js` (uses new flat config format)
- Plugins: `@sveltejs/kit`, `typescript-eslint`, `eslint-plugin-svelte`
- `no-undef` rule disabled (TypeScript handles this)
- Integration with Prettier for conflict-free style enforcement

**Key style rules observed:**
- Two blank lines between major sections in large files
- One blank line between logical blocks within functions
- Comments use `//` style (no JSDoc required for simple properties)
- Inline comments for clarification on complex logic
- Variables declared with `let` in Svelte scripts

## Import Organization

**Order:**
1. Svelte framework imports (`svelte`, `svelte/store`)
2. Third-party libraries (OpenLayers, Highcharts, Lucide icons)
3. Local type imports (`import type { ... } from '$lib/types/...'`)
4. Local component imports (`import Component from '...'`)
5. Data imports (`import { ... } from '$lib/data/...'`)
6. Stylesheet imports (`.css` files, `.ol.css` for OpenLayers)

**Path Aliases:**
- `$lib` → `/src/lib` (configured via SvelteKit)
- No other custom aliases observed
- All relative paths use standard relative syntax or `$lib` alias

**Example import pattern:**
```typescript
import { onMount, onDestroy } from 'svelte';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import ImageArcGISRest from 'ol/source/ImageArcGISRest';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultInteractions } from 'ol/interaction';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import 'ol/ol.css';

import type { Topic, DropdownOption } from '$lib/types/question-types';
import Chart from '$lib/components/Chart.svelte';
import { getTopicName, getTopicIcon, getTopicColor } from '$lib/data/themeData.js';
```

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations (loading libraries, API calls)
- Console.error for logging errors to browser console
- No custom error classes observed; using standard JavaScript Error type
- Graceful degradation: operations continue even if errors occur

**Common pattern:**
```typescript
async function loadHighcharts() {
	try {
		const HighchartsModule = await import('highcharts');
		Highcharts = HighchartsModule.default;
		createChart();
	} catch (error) {
		console.error('Failed to load Highcharts:', error);
	}
}
```

**Null checks:**
- Guards before DOM operations (e.g., `if (!mapContainer) return;`)
- Checks for null state before accessing properties (e.g., `if (!map) { map.dispose(); }`)
- Fallback values provided for optional parameters

## Logging

**Framework:** console object (native browser console)

**Patterns:**
- `console.log()` for general information and debug output
- `console.error()` for error reporting
- Conditional logging based on operations (e.g., chart creation, map initialization)
- Logging used in lifecycle hooks: `onMount`, `onDestroy`

**Examples:**
```typescript
console.log('Highcharts and exporting module loaded successfully');
console.log('Chart clicked at:', coordinate);
console.log('Creating chart with data:', chartData);
console.error('Error creating chart:', error);
```

## Comments

**When to Comment:**
- Complex coordinate transformations or map configurations
- Configuration objects with non-obvious keys (e.g., `layerIndex` values)
- Section headers for logical grouping (e.g., `// ========== CLIMATE LAYERS ==========`)
- Disabled code blocks kept for reference
- Explanatory comments before complex map layer definitions

**Comment Style:**
- Single-line comments for brief explanations
- Multi-line comments for longer sections
- Section separators using `//` with equal signs for visibility

**JSDoc/TSDoc:**
- Type annotations preferred over JSDoc comments
- TypeScript interfaces define prop signatures (no JSDoc comments needed)
- Svelte props use `$props()` with type annotations

## Function Design

**Size:** Functions range from 10-50 lines typical; complex map functions up to 100+ lines
- Small utility functions: 5-20 lines
- Handler functions: 20-40 lines
- Complex initialization functions: 50-100+ lines

**Parameters:**
- Named parameters preferred for functions with multiple options
- Destructuring used for object parameters
- Type annotations required for all parameters
- Default values provided via destructuring (e.g., `let { prop = 'default' } = $props()`)

**Return Values:**
- Explicit return types declared in function signatures
- Void functions used for side effects (handlers, lifecycle hooks)
- Functions return typed objects for data operations
- Null returns for missing data (no undefined used)

**Function organization pattern:**
```typescript
// Type definitions at top
export type DropdownOption = { value: string; label: string };

// Constants before functions
const HKH_CENTER = [75.0, 30.0];
const topicMapConfigs = { /* ... */ };

// Function declarations
function initializeMap() { /* ... */ }
function updateMapView() { /* ... */ }

// Lifecycle hooks at end
onMount(() => { /* ... */ });
onDestroy(() => { /* ... */ });
```

## Module Design

**Exports:**
- Named exports preferred for data and types
- Default export used for components only
- One component per file
- Data files export constants as named exports

**Barrel Files:**
- `$lib/index.ts` exists but appears minimal
- No comprehensive barrel file pattern observed
- Individual imports from source files preferred

**Example export pattern:**
```typescript
// Data file exports
export const clim: Topic = { /* config object */ };
export const demography: Topic = { /* config object */ };
export const ecosystem: Topic = { /* config object */ };

// Configuration exports
export const questionConfigs: AllTopicConfigs = { /* ... */ };
export const allMapLayers = { /* ... */ };

// Component exports (default)
export default MapComponent;
```

**File structure conventions:**
- Type definitions in `src/lib/types/`
- Component definitions in `src/lib/components/`
- Data/config files in `src/lib/data/`
- Route pages in `src/routes/*/+page.svelte`
- Route data in `src/routes/*/+page.js`

## Svelte 5 Patterns

**Rune syntax:**
- `$state()` for reactive state: `let isFullscreen = $state(false)`
- `$props()` with type annotations: `let { chartData, title = 'Chart' } = $props<Type>()`
- `$effect()` for reactive side effects: `$effect(() => { /* reaction */ })`
- `$:` for reactive declarations (still valid in Svelte 5): `$: if (condition) { doSomething(); }`

**Reactive updates:**
- Props can be destructured with default values in `$props()`
- State mutations directly trigger reactivity
- Effects track dependencies implicitly through closure variables

## TypeScript Configuration

**strictness:** Full strict mode enabled
- `strict: true` in `tsconfig.json`
- `forceConsistentCasingInFileNames: true`
- `allowJs` and `checkJs` enabled for mixed TS/JS codebases
- `esModuleInterop` enabled for CommonJS compatibility

---

*Convention analysis: 2026-05-13*
