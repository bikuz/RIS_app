<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import { fitMapToHkhOutline, HKH_OUTLINE_CENTER } from '$lib/map/hkh-extent';
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
	import ImageLayer from 'ol/layer/Image';
	import ImageWMS from 'ol/source/ImageWMS';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';

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

			// HKH Outline always sits above every physiography data layer (zIndex 10) and the basemap (zIndex 0)
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

	// Sample physiography datasets structure
	const physiographyDataset = [
		{
			id: 'elevation',
			title: 'Elevation',
			description: 'Elevation data for the HKH region',
			control_type: 'simple',
			map_layers: {
				default: [
					{
						id: 'elevation-layer',
						name: 'Elevation(DEM 90m)',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
						layerIndex: '5',
						mapserver: 'arcgis'
					}
				]
			},
			charts: []
		},
		{
			id: 'mountain-region',
			title: 'Mountain Region',
			description: 'Mountain region data for the HKH region',
			control_type: 'simple',
			map_layers: {
				default: [
					{
						id: 'mountain-region-layer',
						name: 'Mountain Region',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
						layerIndex: '4',
						mapserver: 'arcgis'
					}
				]
			},
			charts: [
				{
					title: 'Class-wise Mountain Areas in the HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Sq Km',
					units: 'Sq Km',
					showLegend: false,
					xAxisConfig: {
						labels: {
							rotation: 0,
							autoRotation: false,
							useHTML: true,
							style: {
								fontSize: '10px',
								whiteSpace: 'normal',
								textOverflow: 'allow',
								width: 72,
								textAlign: 'center'
							}
						}
					},
					chart_data: {
						categories: [
							'non-mountain region',
							'elevation > 4500 m',
							'elevation 3500 – 4500 m',
							'elevation 2500 – 3500 m',
							'elevation 1500 – 2500 m and slope >= 20',
							'elevation 1000 – 1500 m and slope >= 50',
							'elevation 300 – 1000 m and local elevation range (7 km radius) > 300 m'
						],
						series: [
							{
								name: 'Area',
								data: [
									{ y: 441681, color: '#A8A800' },
									{ y: 1439526, color: '#D3FFBE' },
									{ y: 734456, color: '#55FF00' },
									{ y: 558920, color: '#4CE600' },
									{ y: 410214, color: '#38A800' },
									{ y: 272447, color: '#267300' },
									{ y: 334595, color: '#4C7300' }
								],
								zIndex: 1
							}
						]
					}
				},
				{
					title: 'Country-wise Mountain Areas in the HKH Region',
					chart_type: 'pie',
					units: 'Sq Km',
					legendConfig: {
						align: 'right',
						verticalAlign: 'middle',
						layout: 'vertical',
						floating: true,
						symbolHeight: 8,
						symbolWidth: 8,
						symbolRadius: 2,
						itemMarginTop: 1,
						itemMarginBottom: 1,
						padding: 0,
						itemStyle: {
							fontSize: '10px',
							fontWeight: '500',
							lineHeight: '12px'
						}
					},
					plotOptions: {
						pie: {
							center: ['38%', '54%'],
							size: '92%',
							dataLabels: {
								enabled: false
							}
						}
					},
					chart_data: {
						series: [
							{
								name: 'Country',
								data: [
									{ name: 'Afghanistan', y: 311604 },
									{ name: 'Bangladesh', y: 1254 },
									{ name: 'Bhutan', y: 39283 },
									{ name: 'China', y: 2381708 },
									{ name: 'India', y: 347768 },
									{ name: 'Myanmar', y: 234838 },
									{ name: 'Nepal', y: 119045 },
									{ name: 'Pakistan', y: 314660, color: '#083316' }
								]
							}
						]
					}
				}
			]
		},
		{
			id: 'slope',
			title: 'Slope',
			description: 'Slope data for the HKH region',
			control_type: 'simple',
			map_layers: {
				default: [
					{
						id: 'slope-layer',
						name: 'Slope',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
						layerIndex: '6',
						mapserver: 'arcgis'
					}
				]
			},
			charts: []
		},
		{
			id: 'aspect',
			title: 'Aspect',
			description: 'Aspect data for the HKH region',
			control_type: 'simple',
			map_layers: {
				default: [
					{
						id: 'aspect-layer',
						name: 'Aspect',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
						layerIndex: '7',
						mapserver: 'arcgis'
					}
				]
			},
			charts: []
		}
	];

	const questions: any[] = [];

	const information_layers: any = [
		{
			id: 'map-indicator-2',
			title: 'Mountain Region',
			dataset_id: 'mountain-region',
			info: 'The map shows different classes of mountains in the HKH region with mountain classes defined by the Kapos et al. (2000). This dataset is prepared based on GTOPO 1km resolution DEM.',
			source: 'ICIMOD'
		},
		{
			id: 'map-indicator-1',
			title: 'Elevation',
			dataset_id: 'elevation',
			info: 'The map represents the elevation variation across the HKH region, highlighting topographical gradients from low-lying valleys to high mountain ranges. This dataset is compiled from global SRTM DEM of 90 m resolution for HKH region and was prepared by ICIMOD.',
			source: 'SRTM 90m DEM'
		},
		{
			id: 'map-indicator-3',
			title: 'Slope',
			dataset_id: 'slope',
			info: 'The map represents the steepness of the terrain, indicating how rapidly elevation changes over space. This dataset is derived from the Digital Elevation Model (DEM).',
			source: 'SRTM 90m DEM'
		},
		{
			id: 'map-indicator-4',
			title: 'Aspect',
			dataset_id: 'aspect',
			info: 'The map represents the direction each slope faces, which influences sunlight exposure, temperature, and vegetation patterns. This dataset is derived from the Digital Elevation Model (DEM).',
			source: 'SRTM 90m DEM'
		}
	];

	// Track selected question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection)
	let selectedInformationLayer = $state<string | null>('Mountain Region');

	// Track expanded layer for accordion - default closed
	let expandedLayer = $state<string | null>(null);

	// Get current dataset based on selected question or information layer
	let currentDataset = $derived.by(() => {
		if (selectedQuestionId) {
			const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
			if (selectedQuestion?.dataset_id) {
				return physiographyDataset.find((item) => item.id === selectedQuestion.dataset_id);
			}
		}

		if (selectedInformationLayer) {
			const selectedLayer = information_layers.find(
				(layer) => layer.title === selectedInformationLayer
			);
			if (selectedLayer?.dataset_id) {
				return physiographyDataset.find((item) => item.id === selectedLayer.dataset_id);
			}
		}

		return null;
	});

	// Extract current data from dataset
	let currentCharts = $derived(currentDataset?.charts || []);

	// Resolve which map-layer configs are active for a dataset (control_type is
	// always 'simple' here, so this is just the default layer list).
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
			information_layers.map(async (infoLayer: any) => {
				const dataset = physiographyDataset.find((d) => d.id === infoLayer.dataset_id);
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

	// Debounce timer for legend fetching
	let legendFetchTimeout: ReturnType<typeof setTimeout> | null = null;

	// Fetch legend data for current layers
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

				setTimeout(() => {
					if (currentDataset) {
						updateMapLayers();
					}
				}, 200);
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

	function selectQuestion(questionId: string) {
		selectedQuestionId = questionId;
		selectedInformationLayer = null;
	}

	function selectInformationLayer(layerId: string) {
		if (selectedInformationLayer === layerId) return;

		selectedInformationLayer = layerId;
		selectedQuestionId = '';
	}

	function toggleLayerExpansion(layerId: string) {
		if (expandedLayer === layerId) {
			expandedLayer = null;
		} else {
			expandedLayer = layerId;
		}
	}

	// Add layer to map based on layer configuration
	function addWMSLayer(layerConfig: any) {
		if (!map || !layerConfig) return;

		let layer;

		if (layerConfig.mapserver === 'arcgis') {
			layer = new ImageLayer({
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
		} else {
			layer = new ImageLayer({
				visible: true,
				zIndex: 10,
				opacity: 0.8,
				source: new ImageWMS({
					url: layerConfig.url,
					crossOrigin: 'anonymous',
					params: {
						LAYERS: layerConfig.layerIndex,
						FORMAT: 'image/png',
						VERSION: '1.1.1',
						TRANSPARENT: true
					},
					serverType: 'geoserver'
				})
			});
		}

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

	function clearPhysiographyLayers() {
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
		clearPhysiographyLayers();

		if (!currentDataset || !currentDataset.map_layers) {
			return;
		}

		if (currentDataset.control_type === 'simple' || currentDataset.control_type === 'none') {
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
	<title>Physiography | ICIMOD RIS</title>
</svelte:head>

<div
	class="theme-heading sticky z-[53] flex items-start justify-between gap-4 bg-[#F1F5F9] pb-2"
	style="top: var(--app-header-height, 6rem)"
>
	<div class="max-w-2xl">
		<h1 class="text-[20px] font-semibold tracking-[-0.045em] text-[#0F3557] sm:text-[22px]">Physiography</h1>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-[#64788B]">
			From Subtropical Plains to the World's Highest Peaks
		</p>
	</div>
	<ThemeInfoButton
		src="https://storymaps.arcgis.com/stories/cfe99f86e3c04499827f3b13db5bee92"
		label="About physiography in the HKH"
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
				? 'sm:grid-cols-[minmax(0,1.85fr)_minmax(0,0.85fr)]'
				: 'sm:grid-cols-2 xl:grid-cols-3'}"
	>
		{#each currentCharts as chart, index}
			<div class="data-card min-w-0">
				<Chart
					chartData={chart.chart_data}
					title={chart.title}
					subtitle=""
					chart_type={chart.chart_type}
					unit={chart.units}
					plotOptions={chart.plotOptions || {}}
					yAxisTitle={'yAxisTitle' in chart ? chart.yAxisTitle : 'Value'}
					showLegend={'showLegend' in chart ? Boolean((chart as { showLegend?: boolean }).showLegend) : true}
					xAxisConfig={'xAxisConfig' in chart ? (chart as { xAxisConfig?: any }).xAxisConfig : null}
					legendConfig={'legendConfig' in chart ? (chart as { legendConfig?: any }).legendConfig : null}
					height={'xAxisConfig' in chart ? 320 : 260}
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
