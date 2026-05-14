# Structure

## Directory Layout

```
RIS_app/
├── src/
│   ├── app.css                        # Global styles (Tailwind base)
│   ├── app.d.ts                       # App-level TypeScript declarations
│   ├── app.html                       # HTML shell template
│   ├── lib/
│   │   ├── index.ts                   # Barrel export for $lib
│   │   ├── assets/                    # Static assets bundled with app
│   │   │   ├── favicon.svg
│   │   │   ├── icons/                 # Topic icon PNGs (agriculture, climate, etc.)
│   │   │   ├── images/
│   │   │   │   ├── basemaps/          # Thumbnail PNGs for basemap selector UI
│   │   │   │   └── *.jpg / *.png      # Topic hero images
│   │   │   └── logo/                  # ICIMOD logos
│   │   ├── components/
│   │   │   ├── Chart.svelte           # Reusable chart component (ApexCharts/similar)
│   │   │   ├── DisplaySection.svelte  # Map/chart display panel with summary text
│   │   │   ├── MapComponent.svelte    # Generic OL map (simple, used in older flows)
│   │   │   ├── QuestionControls.svelte # Renders dropdown/slider controls for questions
│   │   │   ├── VisualizationSection.svelte # Wraps DisplaySection pair (map+chart)
│   │   │   └── main/                  # Homepage-specific components
│   │   │       ├── Banner.svelte      # Top hero banner
│   │   │       ├── Hero.svelte        # (unused/legacy hero)
│   │   │       ├── HomepageMap.svelte # (commented out in homepage)
│   │   │       ├── HKHRegionInfo.svelte
│   │   │       ├── IntroMap.svelte    # HKH intro map on homepage
│   │   │       ├── intro.svelte       # Intro text section
│   │   │       ├── intro_old.svelte   # Legacy, unused
│   │   │       ├── Map.svelte         # (legacy map component)
│   │   │       ├── RISIntroduction.svelte
│   │   │       ├── Short_intro.svelte
│   │   │       ├── StatsOverview.svelte
│   │   │       ├── ThematicGrid.svelte       # (legacy)
│   │   │       ├── ThematicGrid01.svelte     # (legacy)
│   │   │       ├── ThematicGrid1.svelte      # (legacy)
│   │   │       ├── ThematicGrid2.svelte      # (legacy)
│   │   │       ├── ThematicGrid3.svelte      # ACTIVE: topic card grid on homepage
│   │   │       └── ThematicGrid_old.svelte   # (legacy)
│   │   ├── data/
│   │   │   ├── climate.ts             # Climate question configs + answers
│   │   │   ├── demography.ts          # Demography question configs + answers
│   │   │   ├── ecosystem.ts           # Ecosystem question configs + answers
│   │   │   ├── question-configs.ts    # Aggregates all topic configs → questionConfigs
│   │   │   └── themeData.ts           # Topic registry: icons, colors, names, nav helpers
│   │   └── types/
│   │       └── question-types.ts      # All shared TypeScript types
│   └── routes/
│       ├── +layout.svelte             # Root layout: app shell, footer
│       ├── +page.svelte               # Homepage
│       ├── design1/                   # UI design prototype (not linked from nav)
│       │   ├── +layout.svelte
│       │   └── layout0/ layout01/ layout1/ layout2/
│       ├── integrated/                # Multi-layer integrated map view
│       │   ├── mapLayers.js           # Layer definitions for integrated view
│       │   └── +page.svelte
│       ├── integrated1/               # Alternate integrated view (prototype)
│       │   ├── mapLayers.js
│       │   └── +page.svelte
│       ├── layout3/                   # Layout prototype
│       │   └── +page.svelte
│       ├── old/                       # Legacy homepage
│       │   └── +page.svelte
│       └── thematic/
│           ├── +layout.svelte         # Thematic section nav (topic switcher)
│           ├── air-quality/
│           │   ├── +page.svelte       # ACTIVE
│           │   └── page_old.svelte    # Legacy
│           ├── climate/
│           │   ├── +page.js           # Load function (SSR data)
│           │   └── +page.svelte       # ACTIVE
│           ├── cryosphere/
│           │   └── +page.svelte       # ACTIVE
│           ├── disaster/
│           │   └── +page.svelte       # ACTIVE
│           ├── ecosystem/
│           │   └── +page.svelte       # ACTIVE
│           ├── human-dimensions/
│           │   └── +page.svelte       # ACTIVE
│           ├── physiography/
│           │   ├── +page.svelte       # ACTIVE
│           │   └── ifram_physio.svelte # Embedded iframe component
│           └── weather/
│               ├── +page.svelte       # ACTIVE
│               └── page-old.svelte    # Legacy
├── static/                            # Files served as-is (no bundling)
├── support/                           # Support/utility scripts
├── server.cjs                         # Custom server entry point
├── svelte.config.js                   # SvelteKit configuration
├── vite.config.ts                     # Vite build config
├── tailwind.config.js                 # Tailwind configuration
├── tsconfig.json                      # TypeScript config
├── eslint.config.js                   # ESLint config
└── package.json                       # Dependencies and scripts
```

---

## Key Locations

| What | Where |
|------|-------|
| Topic registry (icons, colors, nav) | `src/lib/data/themeData.ts` |
| All TypeScript types | `src/lib/types/question-types.ts` |
| Question configs per topic | `src/lib/data/{topic}.ts` + `question-configs.ts` |
| Root layout / footer | `src/routes/+layout.svelte` |
| Homepage | `src/routes/+page.svelte` |
| Thematic nav bar | `src/routes/thematic/+layout.svelte` |
| Active thematic pages | `src/routes/thematic/[topic]/+page.svelte` |
| Basemap thumbnails | `src/lib/assets/images/basemaps/` |
| ArcGIS layer definitions | Inline in each thematic `+page.svelte` or `mapLayers.js` |
| Global CSS | `src/app.css` |

---

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Route files | SvelteKit convention | `+page.svelte`, `+layout.svelte` |
| Components | PascalCase | `ThematicGrid3.svelte`, `DisplaySection.svelte` |
| Data/config files | camelCase | `themeData.ts`, `question-configs.ts` |
| Topic slugs (URL) | kebab-case | `human-dimensions`, `air-quality` |
| Topic keys (TS) | camelCase or kebab-case | `humanDimensions` / `'human-dimensions'` |
| CSS classes | Tailwind utilities | `bg-gradient-to-r from-blue-800` |
| Assets | kebab-case | `light-map.png`, `icimod_logo.svg` |

---

## Adding a New Thematic Topic

1. Add entry to `topicIcons`, `topicColors`, `topicDetail` in `src/lib/data/themeData.ts`
2. Create `src/routes/thematic/[new-topic]/+page.svelte` — copy an existing page as template
3. Optionally add a data file `src/lib/data/[new-topic].ts` and register it in `question-configs.ts`
4. Add topic icon PNG to `src/lib/assets/icons/`

## Adding a New Shared Component

- Place in `src/lib/components/` (generic) or `src/lib/components/main/` (homepage-only)
- Export from `src/lib/index.ts` if needed app-wide

---

## Special Directories

| Directory | Purpose |
|-----------|---------|
| `src/routes/design1/` | UI layout prototypes — not linked from production nav |
| `src/routes/old/` | Legacy homepage — kept for reference |
| `.svelte-kit/` | SvelteKit build output — do not edit |
| `static/` | Publicly served assets (no processing) |
| `support/` | Utility scripts (non-app) |
| `.planning/` | GSD planning documents — not shipped |
