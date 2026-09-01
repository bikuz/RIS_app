<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import { fitMapToHkhOutline, HKH_OUTLINE_CENTER } from '$lib/map/hkh-extent';
	import ImageLayer from 'ol/layer/Image';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import 'ol/ol.css';
	import Chart from '$lib/components/Chart.svelte';
	import lightMap from '$lib/assets/images/basemaps/light-map.png';
	import darkMap from '$lib/assets/images/basemaps/dark-map.png';
	import osmMap from '$lib/assets/images/basemaps/osm-map.png';
	import satelliteMap from '$lib/assets/images/basemaps/satellite-map.png';
	import terrainMap from '$lib/assets/images/basemaps/terrain-map.png';
	import { CheckCircle, Layers, Info, HelpCircle, House, MapIcon } from '@lucide/svelte';
	import AccordionLayer from '$lib/components/AccordionLayer.svelte';
	import ThemeInfoButton from '$lib/components/ThemeInfoButton.svelte';
	import DataSourceText from '$lib/components/DataSourceText.svelte';
	import FullScreen from 'ol/control/FullScreen';
	import { defaults as defaultControls } from 'ol/control/defaults.js';

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

	// Track questions panel state
	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Base layer visibility (Outline overlay, controlled programmatically)
	let activeBaseLayers = $state<Record<number, boolean>>({});

	// Basemap switcher state
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('light');
	let baseMapLayer: TileLayer<any> | null = null;

	const basemaps = [
		{
			id: 'light',
			name: 'Light',
			url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?key=cb1_2a03_1_fbf9a31c72de9a2979799ebc',
			attribution: '© OpenStreetMap contributors, © CARTO',
			image: lightMap
		},
		{
			id: 'dark-gray',
			name: 'Dark',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
			attribution: '© OpenStreetMap contributors, © CARTO',
			image: darkMap
		},
		{
			id: 'osm',
			name: 'OSM',
			url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			attribution: '© OpenStreetMap contributors',
			image: osmMap
		},
		{
			id: 'satellite',
			name: 'Satellite',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			attribution: 'Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
			image: satelliteMap
		},
		{
			id: 'topographic',
			name: 'Topographic',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
			attribution:
				'Esri, TomTom, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, CNES/Airbus DS, InterMap, NASA/METI, NASA/NGS and the GIS User Community',
			image: terrainMap
		}
	];

	function switchBasemap(basemapId: string) {
		if (!map) return;

		selectedBasemap = basemapId;
		const basemapConfig = basemaps.find((b) => b.id === basemapId);
		if (!basemapConfig) return;

		const newBaseMapLayer = new TileLayer({
			source: new XYZ({
				url: basemapConfig.url,
				attributions: basemapConfig.attribution
			}),
			zIndex: 0
		});

		if (baseMapLayer) {
			map.removeLayer(baseMapLayer);
		}

		const layers = map.getLayers();
		layers.insertAt(0, newBaseMapLayer);
		baseMapLayer = newBaseMapLayer;
	}

	const baseLayers = [
		{
			id: 0,
			name: 'Outline',
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer'
		}
	];

	async function toggleBaseLayer(layerId: number, checked: boolean) {
		if (!map) return;
		activeBaseLayers = { ...activeBaseLayers, [layerId]: checked };

		if (checked) {
			const layerInfo = baseLayers.find((l) => l.id === layerId);
			if (!layerInfo) return;

			// HKH Outline always sits above every disaster data layer (zIndex 10) and the basemap (zIndex 0)
			const layer = new ImageLayer({
				source: new ImageArcGISRest({
					url: layerInfo.url,
					params: {
						LAYERS: `show:${layerId}`,
						FORMAT: 'PNG32',
						TRANSPARENT: true
					}
				}),
				zIndex: 20,
				opacity: 0.7
			});
			layer.set('baseLayerId', layerId);
			map.addLayer(layer);
		} else {
			const layers = map.getLayers().getArray();
			for (const layer of layers) {
				if (layer.get('baseLayerId') === layerId) {
					map.removeLayer(layer);
					break;
				}
			}
		}

		fetchLegendData();
	}

	// Legend state
	let legendData = $state<
		Record<string, { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }>
	>({});

	// Legend for every information layer's default state, prefetched on mount so
	// the sidebar doesn't have to wait on a network round-trip when a layer is clicked.
	let layerLegends = $state<
		Record<
			string,
			Record<string, { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }>
		>
	>({});

	// Resolve which map-layer configs are active for a dataset. All disaster
	// datasets use control_type 'none', so this is just the default layer list.
	function resolveLayersForDataset(dataset: any): any[] {
		if (!dataset || !dataset.map_layers) return [];
		const layers = dataset.map_layers.default;
		if (!layers) return [];
		return Array.isArray(layers) ? layers : [layers];
	}

	// Fetch a single legend entry for one map-layer config (ArcGIS or WMS/GeoServer)
	async function fetchLegendEntryForLayer(
		layer: any
	): Promise<{ key: string; entry: { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> } } | null> {
		if (!layer) return null;

		const uniqueKey = `${layer.url}_${layer.layerIndex}`;

		if (layer.mapserver === 'arcgis') {
			try {
				const legendUrl = `${layer.url}/legend?f=json`;
				const response = await fetch(legendUrl);
				const data = await response.json();
				const targetLayerId = parseInt(layer.layerIndex);
				const layerLegend = data.layers?.find((l: any) => l.layerId === targetLayerId);
				if (layerLegend) {
					return {
						key: uniqueKey,
						entry: {
							name: layer.name,
							items: layerLegend.legend.map((item: any) => ({
								label: item.label,
								imageData: `data:image/png;base64,${item.imageData}`
							}))
						}
					};
				}
			} catch (error) {
				console.error('Error fetching ArcGIS legend:', error);
			}
			return null;
		}

		// WMS/GeoServer layers
		const legendUrl = `${layer.url}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${layer.layerIndex}`;
		return {
			key: uniqueKey,
			entry: { name: layer.name, items: [{ label: layer.name, imageUrl: legendUrl }] }
		};
	}

	// Prefetch the default legend for every information layer on mount, so the
	// sidebar can show a legend instantly instead of waiting on a fetch per click.
	async function prefetchAllLegends() {
		const results = await Promise.all(
			information_layers.map(async (infoLayer) => {
				const dataset = disasterDataset.find((d) => d.id === infoLayer.dataset_id);
				if (!dataset) return null;

				const layers = resolveLayersForDataset(dataset);
				const entries = await Promise.all(layers.map((layer) => fetchLegendEntryForLayer(layer)));

				const legendMap: Record<string, { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }> = {};
				for (const result of entries) {
					if (result) legendMap[result.key] = result.entry;
				}
				return { title: infoLayer.title, legendMap };
			})
		);

		const combined: typeof layerLegends = {};
		for (const result of results) {
			if (result) combined[result.title] = result.legendMap;
		}
		layerLegends = combined;
	}

	let legendFetchTimeout: ReturnType<typeof setTimeout> | null = null;

	async function fetchLegendData() {
		if (legendFetchTimeout) {
			clearTimeout(legendFetchTimeout);
		}

		// Clear immediately (not inside the debounce) so a stale legend from the
		// previously selected layer never flashes under the newly selected one —
		// the sidebar falls back to that layer's prefetched legend instead.
		legendData = {};

		legendFetchTimeout = setTimeout(async () => {
			if (currentDataset) {
				const layersToFetch = resolveLayersForDataset(currentDataset);
				const results = await Promise.all(layersToFetch.map((layer) => fetchLegendEntryForLayer(layer)));
				for (const result of results) {
					if (result) legendData[result.key] = result.entry;
				}
			}
		}, 300);
	}

	// Information layer selection
	let selectedInformationLayer = $state('');
	let expandedLayer = $state<string | null>(null);
	let selectedQuestionId = $state('');
	let currentDataset = $state<any>(null);
	let currentCharts = $state<any[]>([]);

	function toggleLayerExpansion(layerId: string) {
		if (expandedLayer === layerId) {
			expandedLayer = null;
		} else {
			expandedLayer = layerId;
		}
	}

	function selectInformationLayer(layerTitle: string) {
		if (selectedInformationLayer === layerTitle) return;
		selectedInformationLayer = layerTitle;
		selectedQuestionId = '';
		const layer = information_layers.find((l: any) => l.title === layerTitle);
		if (layer) {
			const dataset = disasterDataset.find((d: any) => d.id === layer.dataset_id);
			currentDataset = dataset || null;
			currentCharts = dataset?.charts || [];
		}
	}

	function selectQuestion(questionId: string) {
		selectedQuestionId = questionId;
	}

	function initializeMap() {
		if (!mapContainer) return;

		setTimeout(() => {
			const fullScreenControl = new FullScreen({
				source: mapContainer.parentElement || mapContainer
			});

			const initialBasemap = basemaps.find((b) => b.id === selectedBasemap);
			if (!initialBasemap) return;

			baseMapLayer = new TileLayer({
				source: new XYZ({
					url: initialBasemap.url,
					attributions: initialBasemap.attribution
				}),
				zIndex: 0
			});

			map = new Map({
				target: mapContainer,
				controls: defaultControls().extend([fullScreenControl]),
				layers: [baseMapLayer],
				view: new View({
					center: HKH_OUTLINE_CENTER
				})
			});

			const handleFullscreenChange = () => {
				const isCurrentlyFullscreen = document.fullscreenElement !== null;
				isFullscreen = isCurrentlyFullscreen;
				setTimeout(() => {
					if (map) {
						map.updateSize();
						map.render();
					}
				}, 100);
			};

			fullscreenHandler = handleFullscreenChange;
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.addEventListener('mozfullscreenchange', handleFullscreenChange);
			document.addEventListener('MSFullscreenChange', handleFullscreenChange);

			if (map) {
				map.updateSize();
				fitMapToHkhOutline(map);
				// Always show the HKH Outline, layered above everything else
				toggleBaseLayer(0, true);

				// Default: select Earthquake layer
				selectInformationLayer('Earthquake');
			}
		}, 100);
	}

	onMount(() => {
		initializeMap();

		// Warm the sidebar's legend cache for every layer right away, instead of
		// waiting on a fetch each time a layer is clicked.
		prefetchAllLegends();

		if (typeof ResizeObserver !== 'undefined' && mapContainer) {
			const resizeObserver = new ResizeObserver(() => {
				if (map) {
					setTimeout(() => {
						if (map) {
							map.updateSize();
						}
					}, 100);
				}
			});
			resizeObserver.observe(mapContainer);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	onDestroy(() => {
		if (legendFetchTimeout) {
			clearTimeout(legendFetchTimeout);
		}

		if (fullscreenHandler) {
			document.removeEventListener('fullscreenchange', fullscreenHandler);
			document.removeEventListener('webkitfullscreenchange', fullscreenHandler);
			document.removeEventListener('mozfullscreenchange', fullscreenHandler);
			document.removeEventListener('MSFullscreenChange', fullscreenHandler);
			fullscreenHandler = null;
		}

		if (map) {
			map.dispose();
		}
	});

	const disasterDataset = [
		{
			id: 'earthquake',
			control_type: 'none',
			charts: [
				{
					title: 'Annual Earthquake Frequency in HKH (1971–2025)',
					chart_type: 'column',
					yAxisTitle: 'Number of Earthquakes',
					units: 'events',
					chart_data: {
						categories: [
							'1971', '1972', '1973', '1974', '1975', '1976', '1977', '1978', '1979', '1980',
							'1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990',
							'1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
							'2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010',
							'2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020',
							'2021', '2022', '2023', '2024', '2025'
						],
						series: [
							{
								name: 'Earthquake Count',
								data: [
									11, 12, 134, 103, 185, 205, 159, 160, 134, 168,
									132, 131, 145, 199, 274, 236, 166, 228, 249, 303,
									256, 271, 219, 169, 327, 433, 502, 442, 279, 363,
									415, 515, 314, 440, 1053, 589, 530, 1280, 203, 250,
									249, 299, 448, 340, 675, 391, 330, 308, 323, 417,
									434, 419, 386, 381, 458
								],
								color: 'rgb(106,64,66)'
							}
						]
					}
				},
				{
					title: 'Yearly Earthquake Count (Magnitude ≥ 5) in HKH (1971–2025)',
					chart_type: 'column',
					yAxisTitle: 'Number of Earthquakes (M ≥ 5)',
					units: 'events',
					chart_data: {
						categories: [
							'1971', '1972', '1973', '1974', '1975', '1976', '1977', '1978', '1979', '1980',
							'1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990',
							'1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
							'2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010',
							'2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020',
							'2021', '2022', '2023', '2024', '2025'
						],
						series: [
							{
								name: 'Earthquake Count (M ≥ 5)',
								data: [
									11, 12, 50, 30, 47, 43, 33, 20, 18, 32,
									23, 21, 22, 49, 40, 42, 19, 24, 31, 53,
									30, 33, 33, 32, 18, 30, 35, 30, 28, 31,
									40, 32, 24, 45, 69, 22, 32, 84, 45, 46,
									28, 26, 46, 28, 55, 31, 25, 23, 28, 28,
									49, 42, 36, 20, 48
								],
								color: 'rgb(180,80,60)'
							}
						]
					}
				}
			],
			map_layers: {
				default: [
					{
						id: 'earthquake-layer',
						name: 'Earthquake',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Earthquake/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'landslide-susceptibility',
			control_type: 'none',
			charts: [],
			map_layers: {
				default: [
					{
						id: 'landslide-susceptibility-layer',
						name: 'Landslide Susceptibility (Rainfall Triggered)',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Ecosystem/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'forest-fire',
			control_type: 'none',
			charts: [
				{
					title: 'Annual Forest Fire Count in HKH (2001–2025)',
					chart_type: 'column',
					yAxisTitle: 'Number of Fires',
					units: 'fires',
					chart_data: {
						categories: [
							'2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010',
							'2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020',
							'2021', '2022', '2023', '2024', '2025'
						],
						series: [
							{
								name: 'Fire Count',
								data: [
									12801, 7619, 45459, 60914, 46337, 56587, 68015, 44795, 72689, 69956,
									39470, 62377, 50598, 51269, 38713, 39534, 30770, 33089, 40555, 42450,
									50510, 26657, 43951, 37713, 35188
								],
								color: 'rgb(106,64,66)'
							}
						]
					}
				}
			],
			map_layers: {
				default: [
					{
						id: 'forest-fire-layer',
						name: 'Forest Fire',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/ForestFire/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				]
			}
		}
	];

	const questions: any[] = [];

	const information_layers = [
		{
			id: 'info-earthquake',
			title: 'Earthquake',
			dataset_id: 'earthquake',
			info: 'The map shows earthquake incidents occurring in the HKH region from 1971 to 2025 ',
			source: 'USGS Earthquake (https://www.usgs.gov/programs/earthquake-hazards)'
		},
		{
			id: 'info-landslide-susceptibility',
			title: 'Landslide Susceptibility (Rainfall Triggered)',
			dataset_id: 'landslide-susceptibility',
			info: 'The map represents the rainfall-triggered landslide susceptibility of areas in the HKH region, classified into five susceptibility levels: very low, low, moderate, high, and very high. The landslide susceptibility is based on the model developed by NGI.  The precipitation-induced landslides susceptibility map classifies the terrain into five susceptibility classes by combining slope, vegetation, lithology, and antecedent rainfall information.',
			source: 'https://giri.unepgrid.ch/'
		},
		{
			id: 'info-forest-fire',
			title: 'Forest Fire',
			dataset_id: 'forest-fire',
			info: 'The map represents total number of forest fire incidents occurring within 5x5 km grids over 25 years (2001-2025) period in the HKH region. MODIS active fire data (with confidence greater than 50%) is overlaid with ICIMOD’s regional land cover data of HKH region for 2022 to identify the forest fire incidents.',
			source: 'MODIS active fire (https://firms.modaps.eosdis.nasa.gov)'
		}
	];

	function addWMSLayer(layerConfig: any) {
		if (!map || !layerConfig) return;

		const layer = new ImageLayer({
			visible: true,
			zIndex: 10,
			opacity: 0.7,
			source: new ImageArcGISRest({
				url: layerConfig.url,
				crossOrigin: 'anonymous',
				params: {
					LAYERS: `show:${layerConfig.layerIndex}`,
					FORMAT: 'PNG32',
					TRANSPARENT: true
				}
			})
		});

		layer.set('id', layerConfig.id);
		layer.set('layerName', layerConfig.name);

		if (map) {
			map.addLayer(layer);
		}
	}

	function addMultipleLayers(layerConfigs: any[]) {
		if (!layerConfigs || !Array.isArray(layerConfigs)) return;
		layerConfigs.forEach((layerConfig) => addWMSLayer(layerConfig));
	}

	function clearDisasterLayers() {
		if (!map) return;
		const layers = map.getLayers().getArray().slice();
		layers.forEach((layer) => {
			const layerId = layer.get('id');
			if (layerId && map) {
				map.removeLayer(layer);
			}
		});
	}

	function updateMapLayers() {
		if (!map) return;
		clearDisasterLayers();
		if (!currentDataset || !currentDataset.map_layers) return;

		if (currentDataset.control_type === 'none') {
			const layers = currentDataset.map_layers.default;
			if (layers) {
				if (Array.isArray(layers)) {
					addMultipleLayers(layers);
				} else {
					addWMSLayer(layers);
				}
			}
		}

		fetchLegendData();
	}

	$effect(() => {
		const dataset = currentDataset;
		if (dataset) {
			updateMapLayers();
		}
	});
</script>

<svelte:head>
	<title>Disaster | ICIMOD RIS</title>
</svelte:head>

<div
	class="theme-heading sticky z-[53] flex items-start justify-between gap-4 bg-[#F1F5F9] pb-2"
	style="top: var(--app-header-height, 6rem)"
>
	<div class="max-w-2xl">
		<h1 class="text-[20px] font-semibold tracking-[-0.045em] text-[#0F3557] sm:text-[22px]">Disaster</h1>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-[#64788B]">
			Rising Hazards and Human Impacts Across the HKH Region
		</p>
	</div>
	<ThemeInfoButton
		src="https://storymaps.arcgis.com/stories/74d6389cbd8247e1ac38fbfc19130faa"
		label="About disaster in the HKH"
	/>
</div>

<div class="mt-6 grid gap-4 lg:grid-cols-[0.7fr_1.7fr_0.7fr] lg:items-stretch">
	<!-- Left: Information layers -->
	<aside class="context-panel p-5" style="background-color: #EEF6FB">
		<div class="border-b border-[#E0E7EE] pb-4">
			<p class="chart-kicker">Layers</p>
			<h2 class="mt-1 text-base font-semibold text-[#17324D]">Information layer</h2>
		</div>
		<div class="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
			{#if information_layers && information_layers.length > 0}
				{#each information_layers as layer, index}
					<AccordionLayer
						title={layer.title}
						active={selectedInformationLayer === layer.title}
						open={expandedLayer === layer.title}
						onclick={() => {
							selectInformationLayer(layer.title);
							toggleLayerExpansion(layer.title);
						}}
					>
						{@const activeLegend =
							selectedInformationLayer === layer.title && Object.keys(legendData).length > 0
								? legendData
								: layerLegends[layer.title]}
						{#if activeLegend && Object.keys(activeLegend).length > 0}
							<div class="space-y-2">
								{#each Object.keys(activeLegend) as uniqueKey}
									<div class="space-y-1.5">
										{#if Object.keys(activeLegend).length > 1}
											<p class="text-[10px] font-bold uppercase tracking-wide text-[#8A9BAD]">
												{activeLegend[uniqueKey].name}
											</p>
										{/if}
										{#each activeLegend[uniqueKey].items as item}
											<div class="flex items-center gap-2 text-[11px] text-[#46637A]">
												{#if item.imageData}
													<img src={item.imageData} alt={item.label} class="h-3.5 w-4 shrink-0" />
												{:else if item.imageUrl}
													<img src={item.imageUrl} alt={item.label} class="h-3.5 w-4 shrink-0" />
												{/if}
												<span>{item.label}</span>
											</div>
										{/each}
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-[11px] text-[#8A9BAD]">Loading legend…</p>
						{/if}
					</AccordionLayer>
				{/each}
			{:else}
				<div class="flex h-40 flex-col items-center justify-center text-center text-[#8A9BAD]">
					<Layers class="mx-auto mb-2 size-6" />
					<p class="text-sm">No indicators available</p>
				</div>
			{/if}
		</div>
	</aside>

	<!-- Middle: Map -->
	<div class="relative h-[60vh] min-h-[450px] lg:h-[68vh] lg:max-h-[850px] lg:min-h-[550px]">
		<div class="map-frame h-full">
			<div class="map-container relative flex h-full flex-col">
				<div bind:this={mapContainer} class="map-element h-full w-full overflow-hidden rounded-[10px]"></div>

				<!-- Home Reset Button -->
				<button
					class="map-btn absolute top-3 left-[52px] z-20"
					onclick={() => fitMapToHkhOutline(map, 300)}
					title="Reset to Home View"
				>
					<House class="size-4" />
				</button>

				<!-- Basemap Switcher Button -->
				<button
					class="map-btn absolute top-3 right-[52px] z-20"
					onclick={() => (basemapPanelOpen = !basemapPanelOpen)}
					title="Change Basemap"
					aria-label="Change Basemap"
				>
					<MapIcon class="size-4" />
				</button>

				<!-- Basemap Switcher Panel -->
				<div
					class="absolute top-14 right-[52px] z-20 w-48 overflow-hidden rounded-xl border border-[#D8E1EA] bg-white shadow-lg transition-all duration-300 ease-in-out {basemapPanelOpen
						? 'max-h-96 opacity-100'
						: 'max-h-0 opacity-0'}"
				>
					<div class="p-3">
						<h3 class="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#46637A]">Basemap</h3>
						<div class="space-y-1">
							{#each basemaps as basemap}
								<button
									class="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors {selectedBasemap ===
									basemap.id
										? 'bg-[#DBEAFE] font-semibold text-[#2563EB]'
										: 'text-[#46637A] hover:bg-[#F3F7FA]'}"
									onclick={() => {
										switchBasemap(basemap.id);
										basemapPanelOpen = false;
									}}
								>
									<span class="flex-1">{basemap.name}</span>
									<img
										src={basemap.image}
										alt={basemap.name}
										class="h-8 w-12 rounded border border-[#D8E1EA] object-cover"
									/>
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Right: Description panel -->
	<aside class="context-panel">
		{#if selectedInformationLayer}
			{@const activeLayer = information_layers.find((l) => l.title === selectedInformationLayer)}
			{#if activeLayer}
				<h2 class="text-xl font-semibold tracking-[-0.03em] text-[#17324D]">{activeLayer.title}</h2>
				<p class="mt-4 text-sm leading-6 text-[#71869A]">{activeLayer.info}</p>
				<p class="mt-4 text-sm leading-6 text-[#71869A]">
					<span class="font-semibold text-[#46637A]">Data Source: </span><DataSourceText source={activeLayer.source} />
				</p>
			{/if}
		{:else}
			<p class="text-sm leading-6 text-[#71869A]">Select a layer to see its description.</p>
		{/if}
	</aside>
</div>

<!-- Chart Section -->
{#if currentDataset && currentCharts && currentCharts.length > 0}
	<div
		class="mt-6 grid gap-4 {currentCharts.length === 1
			? ''
			: currentCharts.length === 2
				? 'sm:grid-cols-2'
				: 'sm:grid-cols-2 xl:grid-cols-3'}"
	>
		{#each currentCharts as chart, index}
			<div class="data-card">
				<Chart
					chartData={chart.chart_data}
					title={chart.title}
					subtitle={(chart as any).subtitle}
					chart_type={chart.chart_type}
					yAxisTitle={(chart as any).yAxisTitle || 'Value'}
					plotOptions={(chart.chart_data as any).plotOptions || {}}
					showLegend={false}
					height={260}
					unit={chart.units}
				/>
			</div>
		{/each}
	</div>
{/if}

<!-- Fixed Floating Questions Button and Panel -->
<div class="fixed right-8 bottom-6 z-50 flex flex-col items-end">
	{#if isQuestionsPanelOpen}
		<div
			class="mb-4 flex h-80 w-80 origin-bottom-right flex-col rounded-2xl border border-[#D8E1EA] bg-white/95 px-4 py-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
		>
			<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
				<div class="rounded-lg bg-[#2563EB] p-2">
					<Info class="h-3.5 w-3.5 text-white" />
				</div>
				<h3 class="text-base font-bold text-[#17324D]">Explore Questions</h3>
			</div>

			<div class="max-h-60 flex-1 space-y-3 overflow-y-auto">
				{#each questions as questionItem, index}
					<button
						class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
						questionItem.id
							? 'border-[#2563EB] bg-[#DBEAFE] shadow-md'
							: 'border-[#D8E1EA] bg-white/50 hover:border-[#93C5FD] hover:bg-[#EEF6FB] hover:shadow-sm'}"
						onclick={() => selectQuestion(questionItem.id)}
					>
						<div class="flex items-start space-x-2">
							<div class="mt-1 flex-shrink-0">
								{#if selectedQuestionId === questionItem.id}
									<CheckCircle class="h-3.5 w-3.5 text-[#2563EB]" />
								{:else}
									<div class="h-3.5 w-3.5 rounded-full border-2 border-[#D8E1EA] group-hover:border-[#93C5FD]"></div>
								{/if}
							</div>
							<p
								class="text-xs leading-relaxed {selectedQuestionId === questionItem.id
									? 'font-medium text-[#174D7C]'
									: 'text-[#64788B] group-hover:text-[#31506A]'}"
							>
								{questionItem.question}
							</p>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<button
		onclick={toggleQuestionsPanel}
		class="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F3557] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#174D7C] hover:shadow-2xl"
		aria-label="Toggle questions panel"
	>
		<HelpCircle class="h-6 w-6" />
	</button>
</div>

<style>
	.map-container {
		width: 100%;
		max-width: 100%;
		min-width: 0;
		overflow: hidden;
	}

	.map-element {
		width: 100% !important;
		max-width: 100% !important;
		min-width: 0 !important;
		transition: all 0.3s ease;
		overflow: hidden;
	}

	:global(.ol-viewport) {
		width: 100% !important;
		max-width: 100% !important;
		min-width: 0 !important;
		overflow: hidden !important;
	}

	:global(.ol-overlaycontainer-stopevent) {
		width: 100% !important;
		max-width: 100% !important;
		min-width: 0 !important;
	}

	:global(.flex > *) {
		min-width: 0;
	}

	:global(.ol-attribution) {
		right: auto !important;
		left: 0.5em !important;
		text-align: left !important;
		flex-flow: row !important;
	}

	:global(:fullscreen .map-container),
	:global(:-webkit-full-screen .map-container),
	:global(:-moz-full-screen .map-container),
	:global(:-ms-fullscreen .map-container) {
		position: relative !important;
		width: 100vw !important;
		height: 100vh !important;
		z-index: 9998 !important;
	}

	:global(:fullscreen .absolute),
	:global(:-webkit-full-screen .absolute),
	:global(:-moz-full-screen .absolute),
	:global(:-ms-fullscreen .absolute) {
		position: fixed !important;
		z-index: 9999 !important;
	}
</style>
