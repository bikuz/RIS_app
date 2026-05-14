# Architecture

## Pattern

**SvelteKit MPA (Multi-Page Application)** with file-based routing. Each thematic topic is a separate route/page with its own self-contained OpenLayers map instance and data logic. No global state management library — Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`) handle all reactivity at the component level.

The app is a geospatial information portal for the Hindu Kush Himalaya (HKH) region, branded **Hi-RIS** (HKH Regional Information System). Built and maintained by ICIMOD.

---

## Layers

```
1. Presentation Layer  — Svelte components + routes
2. Data Layer          — TypeScript data files in src/lib/data/
3. Types Layer         — Shared TypeScript types in src/lib/types/
4. Integration Layer   — OpenLayers map init, ArcGIS REST URLs
5. Assets Layer        — Icons, logos, basemap thumbnails in src/lib/assets/
```

---

## Entry Points

| Path | Purpose |
|------|---------|
| `src/routes/+layout.svelte` | Root layout — app shell, footer, global CSS import |
| `src/routes/+page.svelte` | Homepage — Banner + ThematicGrid + IntroMap |
| `src/routes/thematic/+layout.svelte` | Thematic section shell — top nav bar with topic buttons |
| `src/routes/thematic/[topic]/+page.svelte` | Individual thematic pages (one per topic) |
| `src/routes/integrated/+page.svelte` | Multi-layer integrated map view |
| `src/lib/data/themeData.ts` | Central topic registry (icons, colors, names, navigation) |
| `src/lib/data/question-configs.ts` | Question/answer config registry per topic |

---

## Data Flow

### Homepage
```
+page.svelte
  → Banner (hero image + branding)
  → ThematicGrid3 (renders topic cards from themeData.topicIcons)
  → IntroMap (standalone OpenLayers map showing HKH region)
```

### Thematic Page (e.g. cryosphere)
```
thematic/+layout.svelte
  → reads $page.route.id to derive currentTopic
  → renders topic nav buttons from topicIcons (themeData.ts)

thematic/[topic]/+page.svelte
  → self-contained: imports OpenLayers directly (Map, TileLayer, etc.)
  → defines map layers inline (basemap + ArcGIS ImageLayer/TileLayer)
  → basemap selector state: $state([]) for layer list
  → Chart component for statistical visualization
  → layer visibility toggles via $state booleans
```

### Integrated Map
```
integrated/+page.svelte
  → imports layer definitions from mapLayers.js (sibling file)
  → composes multiple ArcGIS services into one map
```

---

## Key Abstractions

### Topic Registry (`src/lib/data/themeData.ts`)
Single source of truth for all topics. Defines:
- `topicIcons` — maps topic slug → Lucide icon component (drives nav)
- `topicColors` — maps topic slug → Tailwind gradient classes
- `topicDetail` — one-line description per topic
- `selectTopic(topic)` — navigation helper using `goto()`
- `getTopicName/Icon/Color()` — display helpers

### Question-Answer Model (`src/lib/types/question-types.ts`)
Typed data model for the question-driven UI:
```typescript
QuestionControl  // dropdown or slider control
QuestionConfig   // question + hint + controls + vis flags
QuestionAnswer   // mapSummary + chartSummary + mapData + chartData
Topic            // { [questionId]: { config, answers } }
AllTopicConfigs  // { [topicName]: Topic }
```

### Map Layer Pattern (per thematic page)
Each thematic page constructs its own OpenLayers map with:
- Basemap layer (OSM / XYZ tile services)
- Data layers (ImageArcGISRest or XYZ from `geoapps.icimod.org`)
- HKH center coordinates: `[82.94924, 27.6382055]`, zoom ~4.8
- Basemap thumbnails from `src/lib/assets/images/basemaps/`

---

## State Management

No global store. State is local to each component/page:
- `$state` for mutable values (selected basemap, layer visibility, UI toggles)
- `$derived` for computed values (current topic from URL, active config)
- `$props` for component inputs
- `$effect` for side effects (map init in `onMount`, event listeners)

---

## Cross-Cutting Concerns

| Concern | Approach |
|---------|----------|
| Styling | Tailwind CSS utility classes throughout |
| Icons | `@lucide/svelte` icon components |
| Navigation | `goto()` from `$app/navigation`, `base` from `$app/paths` |
| Map rendering | OpenLayers (`ol`) — initialized in `onMount`, cleaned up in `onDestroy` |
| ArcGIS data | REST services at `https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/` |
| Base path | `$app/paths` `base` prefix used for all internal links |
| Error handling | Console logging only — no user-facing error boundaries |

---

## Notable Design Decisions

- **No shared map component** — each thematic page manages its own OpenLayers instance inline. This allows per-topic customization but creates code duplication.
- **Commented-out sections** are prevalent (legacy layouts, unused nav links, old components). Many features are in-progress or experimental.
- **Design prototypes** live under `src/routes/design1/` and `src/routes/layout3/` — not linked from main nav.
- **Old/backup files** (`page_old.svelte`, `intro_old.svelte`, `page-old.svelte`) exist alongside active files.
- The `questionConfigs` registry only covers 3 topics (climate, demography, ecosystem) despite 8 topics existing.
