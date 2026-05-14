# External Integrations

**Analysis Date:** 2026-05-13

## APIs & External Services

**ICIMOD Geospatial Services:**
- ICIMOD ArcGIS MapServer - Hosts thematic geospatial layers
  - Base URL: `https://geoapps.icimod.org/icimodarcgis/rest/services/`
  - Services accessed:
    - `RIS/HKH_Temperature_Trend_30Years/MapServer` - Temperature data
    - `RIS/HKH_Temperature_Anomaly/MapServer` - Temperature anomalies
    - `HKH/Physiography/MapServer` - Terrain and physiography
    - `HKH/Glacier/MapServer` - Glacier distribution
    - `HKH/GlacialLake/MapServer` - Glacial lake data
    - `HKH/GLOF/MapServer` - Glacial Lake Outburst Flood hazards
  - SDK/Client: `@arcgis/core` ^4.33.12
  - Authentication: None detected (public endpoints)
  - Access pattern: Direct HTTP requests via ImageArcGISRest source (`ol/source/ImageArcGISRest`)

**Esri ArcGIS Online:**
- Public base map tiles and services
  - Tiles: `https://server.arcgisonline.com/ArcGIS/rest/services/`
  - Services:
    - `Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}` - Dark basemap
    - `World_Imagery/MapServer/tile/{z}/{y}/{x}` - Satellite imagery
    - `World_Topo_Map/MapServer/tile/{z}/{y}/{x}` - Topographic map
  - Access pattern: XYZ tile layer via `ol/source/XYZ`
  - Authentication: None (public)

**ICIMOD GeoServer (Legacy):**
- GeoServer WMS endpoint
  - URL: `https://tethys.icimod.org:8443/geoserver/` (documented in old components)
  - Protocol: WMS (Web Map Service)
  - Status: Referenced in deprecated components (`page_old.svelte`), not actively used
  - Access pattern: `TileWMS` source from OpenLayers

**OpenStreetMap:**
- OSM base tiles used as fallback/secondary basemap
  - SDK/Client: `ol/source/OSM` from OpenLayers
  - Attribution: Automatic via OpenLayers
  - Authentication: None

## Data Storage

**Databases:**
- Not detected in this codebase
- Data appears to be served via geospatial APIs (ArcGIS, GeoServer) only
- No ORM or direct database client imports found

**File Storage:**
- Static assets: Local filesystem only
  - Images: `src/lib/assets/images/basemaps/` - Basemap thumbnails
  - Icons: `src/lib/assets/icons/` - Icon assets
  - Logo: `src/lib/assets/logo/` - Branding assets
- Static directory: `static/` - Served directly by Express server
- Build output: `build/client/` - Generated on build, served by production server

**Caching:**
- None detected
- Browser caching handled by HTTP headers (standard browser behavior)

## Authentication & Identity

**Auth Provider:**
- None implemented
- All endpoints are public (ICIMOD geospatial services are open access)

**Implementation:**
- No authentication system found in codebase
- No user management or session handling

## Monitoring & Observability

**Error Tracking:**
- None detected
- Console logging present (development only, see `src/lib/components/Chart.svelte` lines 87-88, 96-100)

**Logs:**
- Console output for development debugging
  - Chart creation status: `Console.log('Highcharts and exporting module loaded successfully')`
  - Chart data logging: `Console.log('Creating chart with data:', chartData)`
  - Map interactions: `console.log('Map clicked at:', coordinate)` in `src/lib/components/MapComponent.svelte`
- Production: Express server logs to stdout (standard Node.js behavior)

## CI/CD & Deployment

**Hosting:**
- IIS (Internet Information Services) on Windows Server
- Configured via `svelte.config.js` and `server.cjs`
- Static file serving: `express.static()` from `build/client` and `static/`

**CI Pipeline:**
- Not detected
- No GitHub Actions, Jenkins, GitLab CI, or other CI config files found

## Environment Configuration

**Required env vars:**
- `NODE_ENV` - Set to `production` in production deployment
- `PORT` - Server port (defaults to 3000 in `server.cjs`)
- `HOST` - Server bind address (defaults to 0.0.0.0 in `server.cjs`)
- `VITE_*` - Frontend environment variables (prefix for accessibility in browser)

**Optional env vars:**
- None explicitly required for external integrations

**Secrets location:**
- No `.env` file found
- No secrets management detected
- All geospatial services are public APIs

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected
- Application is read-only for geospatial data (no updates sent to external services)

## Data Flow

**Map Layer Loading:**
1. User selects thematic topic (climate, cryosphere, ecosystem, etc.)
2. App fetches layer configuration from `src/routes/*/mapLayers.js` or embedded config
3. Layer URL resolved to ICIMOD ArcGIS MapServer endpoint
4. OpenLayers `ImageArcGISRest` or `XYZ` source fetches tiles/images
5. Legend fetched via `fetch()` API to Legend URL endpoint
6. Map renders with selected layers

**Chart Data:**
1. Chart data defined in component props (e.g., from `src/lib/data/*.ts`)
2. Highcharts library dynamically imported on mount
3. Chart rendered to container with data passed as configuration
4. No external data fetching for charts (all data is embedded)

## Layer Configuration Reference

**Temperature Layers:**
- Service: `RIS/HKH_Temperature_Trend_30Years/MapServer`
- Scenarios: 0.5, 1.0, 1.5, 2.0, 2.5°C
- Layer indices: 1-5
- Type: ArcGIS REST MapServer

**Glacier Layers:**
- Service: `HKH/Glacier/MapServer`
- Layer index: 0
- Type: ArcGIS REST MapServer

**Glacial Lake Layers:**
- Service: `HKH/GlacialLake/MapServer`
- Layer index: 0
- Type: ArcGIS REST MapServer

**GLOF Hazard:**
- Service: `HKH/GLOF/MapServer`
- Layer index: 0
- Type: ArcGIS REST MapServer

**Physiography:**
- Service: `HKH/Physiography/MapServer`
- Layer index: Variable (4 for mountain regions, others for sub-layers)
- Type: ArcGIS REST MapServer

---

*Integration audit: 2026-05-13*
