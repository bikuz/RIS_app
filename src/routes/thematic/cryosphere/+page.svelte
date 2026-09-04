<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import ImageLayer from 'ol/layer/Image';
	import XYZ from 'ol/source/XYZ';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import { fitMapToHkhOutline, HKH_OUTLINE_CENTER } from '$lib/map/hkh-extent';
	import 'ol/ol.css';
	import Chart from '$lib/components/Chart.svelte';
	import lightMap from '$lib/assets/images/basemaps/light-map.png';
	import darkMap from '$lib/assets/images/basemaps/dark-map.png';
	import osmMap from '$lib/assets/images/basemaps/osm-map.png';
	import satelliteMap from '$lib/assets/images/basemaps/satellite-map.png';
	import terrainMap from '$lib/assets/images/basemaps/terrain-map.png';
	import { House, CheckCircle, Layers, Info, HelpCircle, MapIcon } from '@lucide/svelte';
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

	// Per-layer image loading indicator
	let isLayerLoading = $state(false);
	let pendingImageLoads = 0;

	// Base layer visibility (Outline overlay, controlled programmatically)
	let activeBaseLayers = $state<Record<string, boolean>>({});

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

	// Define base layers from HKH services (only Outline is auto-shown; Basin is
	// kept for parity with the original service list but has no toggle UI)
	const baseLayers = [
		{
			key: 'outline',
			name: 'Outline',
			arcgisLayerId: 0,
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer'
		},
		{
			key: 'basin',
			name: 'Basin',
			arcgisLayerId: 0,
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Basin/MapServer'
		}
	];

	async function toggleBaseLayer(layerKey: string, checked: boolean) {
		if (!map) return;

		activeBaseLayers = { ...activeBaseLayers, [layerKey]: checked };

		const layerInfo = baseLayers.find((l) => l.key === layerKey);
		if (!layerInfo) return;

		if (checked) {
			// HKH Outline always sits above every cryosphere data layer (zIndex 10) and the basemap (zIndex 0)
			const layer = new ImageLayer({
				source: new ImageArcGISRest({
					url: layerInfo.url,
					params: {
						LAYERS: `show:${layerInfo.arcgisLayerId}`,
						FORMAT: 'PNG32',
						TRANSPARENT: true
					}
				}),
				zIndex: 20,
				opacity: layerKey === 'outline' ? 0.7 : 1
			});
			layer.set('baseLayerKey', layerKey);
			map.addLayer(layer);
		} else {
			const layers = map.getLayers().getArray();
			for (const layer of layers) {
				if (layer.get('baseLayerKey') === layerKey) {
					map.removeLayer(layer);
					break;
				}
			}
		}

		fetchLegendData();
	}

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

	// Updated cryosphere dataset with ArcGIS layers
	const cryoDataset = [
		{
			id: 'glacier',
			charts: [
				{
					title: 'Glaciers in Major Basins of HKH',
					chart_type: 'column',

					chart_data: {
						categories: ['Amu Darya','Indus','Ganges','Brahmaputra','Irrawaddy','Salween','Mekong','Yangtze','Yellow River','Tarim','Eastern Asian','Qinghai- Tibetan'],
						series: [
							{
								name: 'Number of Glaciers',
								data: [3551, 25986, 8029, 12687, 127, 2122, 540, 1854, 283, 920, 2377, 5285],
								color: '#45c8ff'
							},
							{
								name: 'Area of Glaciers (sq. km)',
								data: [2348.34, 24571.19, 7518.52, 9450.32, 32.91, 1091.25, 233.4, 1437.50, 156.26, 1726.40, 1906.34, 5309.59],
								color: '#6d68de'
							}
						]
					}
				}
			],
			control_type: 'none',
			map_layers: {
				default: [
					{
						id: 'glacier-all',
						name: 'Glacier Area Change',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Glacier/MapServer',
						layerIndex: 5,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'glacier_2020',
			charts: [],
			control_type: 'none',
			map_layers: {
				default: [
					{
						id: 'glacier-2020',
						name: 'Glacier 2020',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/HKHGlacier/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'glacial_lake',
			charts: [
				{
					title: 'Glacial Lakes in Major River Basins of HKH',
					chart_type: 'column',
					chart_data: {
						categories: ['Amudarya', 'Brahmaputra', 'Ganga', 'Indus', 'Irrawaddy', 'Mansarovar'],
						series: [
							{
								name: 'Number of Glacial Lakes',
								data: [1474, 13642, 4082, 5689, 525, 202],
								color: '#45c8ff'
							},
							{
								name: 'Area of Glaciers (sq. km)',
								data: [66.1, 883.55, 208.59, 260.54, 16.15, 9.27],
								color: '#6d68de'
							}
						]
					}
				}
			],
			control_type: 'none',
			map_layers: {
				default: [
					{
						id: 'glacial-lake',
						name: 'Glacial Lake',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/GlacialLake/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'glof',
			charts: [
				{
					title: 'Glacial Lake Outburst Floods (GLOFs) Mechanism',
					chart_type: 'pie',
					legendConfig: {
						align: 'right',
						verticalAlign: 'middle',
						layout: 'vertical',
						floating: false,
						symbolHeight: 8,
						symbolWidth: 8,
						symbolRadius: 2,
						itemMarginTop: 0,
						itemMarginBottom: 1,
						padding: 4,
						itemStyle: {
							fontSize: '9px',
							fontWeight: '500',
							lineHeight: '11px',
							width: '108px',
							textOverflow: 'ellipsis'
						}
					},
					plotOptions: {
						pie: {
							center: ['42%', '52%'],
							size: '70%',
							dataLabels: {
								enabled: false
							}
						}
					},
					chart_data: {
						series: [
							{
								colorByPoint: true,
								data: [
									{ name: 'Permafrost thaw, Moraine failure', y: 1 },
									{ name: 'Permafrost thaw, subglacial channel', y: 1 },
									{ name: 'Dam piping', y: 5 },
									{ name: 'Dam seepage', y: 1 },
									{ name: 'Englacial tunnel', y: 2 },
									{ name: 'Ice core thawing', y: 10 },
									{ name: 'Moraine collapse', y: 16 },
									{ name: 'Moraine collapse, permafrost thaw', y: 1 },
									{ name: 'Overflow', y: 1 },
									{ name: 'Overtopping', y: 1 },
									{ name: 'Subglacial tunnel', y: 142 },
									{ name: 'Subglacial tunnel, overtopping', y: 1 },
									{ name: 'Supraglacial lake drainage', y: 5 },
									{ name: 'Unknown', y: 549 }
								]
							}
						]
					}
				},
				{
					title: 'No. of GLOFs by Lake Types',
					chart_type: 'column',
					showLegend: false,
					chart_data: {
						categories: [
							'Moraine dammed',
							'Ice dammed',
							'Supraglacial',
							'Unknown',
							'Water pocket',
							'Bedrock',
							'Landslide dammed'
						],
						series: [
							{
								name: 'Lake Types',
								data: [363, 236, 75, 31, 22, 6, 3]
							}
						]
					}
				}
			],
			control_type: 'none',
			map_layers: {
				default: [
					{
						id: 'glof',
						name: 'GLOFs in High Mountain Asia',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/GLOF/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'pdgl',
			charts: [],
			control_type: 'none',
			map_layers: {
				default: [
					{
						id: 'pdgl',
						name: 'Potentially Dangerous Glacial Lake 2015',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/GlacialLake/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				]
			}
		}
	];

	const questions: any[] = [];

	const information_layers = [
		{
			id: 'info-layer-1',
			title: 'Glacier Area Change',
			dataset_id: 'glacier',
			info: 'The map shows percentage of glacier area change over the period of 1990 – 2020 in each one degree longitudinal and latitudinal grid in the HKH region.',
			source: 'ICIMOD (https://rds.icimod.org/Home/DataDetail?metadataId=1973447)'
		},
		{
			id: 'info-layer-1b',
			title: 'Glacier 2020',
			dataset_id: 'glacier_2020',
			info: 'This dataset shows outline of glaciers across the HKH region in 2020.',
			source: 'ICIMOD (https://rds.icimod.org/metadata/b80287b9-2978-48c2-b386-bd5f1449d84f)'
		},
		{
			id: 'info-layer-2',
			title: 'Glacial Lake',
			dataset_id: 'glacial_lake',
			info: 'This map represents the glacial lakes across the HKH region. The dataset is generated through semi-automated analysis of Landsat 5 TM and Landsat 7 ETM+ satellite images from the 2005 period (±2 years).',
			source: 'ICIMOD (https://rds.icimod.org/Home/DataDetail?metadataId=35856)'
		},
		{
			id: 'info-layer-3',
			title: 'Glacial Lake Outburst Flood (GLOF)',
			dataset_id: 'glof',
			info: 'The map represents the Glacier Lake Outburst Floods (GLOFs) events across High Mountain Asia (HMA). The dataset is sourced from the ICIMODs Regional DataBase System  which have documented 697 individual GLOFs that occurred between 1833 and 2022.',
			source: 'ICIMOD (https://rds.icimod.org/Home/DataDetail?metadataId=1973283)'
		},
		{
			id: 'info-layer-4',
			title: 'Potentially Dangerous Glacial Lake',
			dataset_id: 'pdgl',
			info: 'The map shows potentially dangerous glacial lake in Koshi, Gandaki and Karnali basins classified into ranks I, II and III.',
			source: 'ICIMOD (https://rds.icimod.org/Home/DataDetail?metadataId=1971950)',
			report: 'ICIMOD (https://lib.icimod.org/records/p869r-n4132)'
		}
	];

	// Information layer selection
	let selectedQuestionId = $state('');
	let selectedInformationLayer = $state<string | null>('Glacier Area Change');
	let expandedLayer = $state<string | null>(null);

	// Get current dataset based on selected question or information layer
	let currentDataset = $derived.by(() => {
		if (selectedQuestionId) {
			const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
			if (selectedQuestion?.dataset_id) {
				return cryoDataset.find((item) => item.id === selectedQuestion.dataset_id);
			}
		}

		if (selectedInformationLayer) {
			const selectedLayer = information_layers.find(
				(layer) => layer.title === selectedInformationLayer
			);
			if (selectedLayer?.dataset_id) {
				return cryoDataset.find((item) => item.id === selectedLayer.dataset_id);
			}
		}

		return cryoDataset[0];
	});

	let currentCharts = $derived(currentDataset?.charts || []);

	// Resolve which map-layer configs are active for a dataset. All cryosphere
	// datasets use control_type 'none', so this is just the default layer list.
	function resolveLayersForDataset(dataset: any): any[] {
		if (!dataset || !dataset.map_layers) return [];
		const layers = (dataset.map_layers as any).default;
		if (!layers) return [];
		return Array.isArray(layers) ? layers : [layers];
	}

	// Fetch a single legend entry for one map-layer config
	async function fetchLegendEntryForLayer(
		layer: any
	): Promise<{ key: string; entry: { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> } } | null> {
		if (!layer || layer.mapserver !== 'arcgis') return null;

		const uniqueKey = `${layer.url}_${layer.layerIndex}`;
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
			console.error('Error fetching legend:', error);
		}
		return null;
	}

	// Prefetch the default legend for every information layer on mount, so the
	// sidebar can show a legend instantly instead of waiting on a fetch per click.
	async function prefetchAllLegends() {
		const results = await Promise.all(
			information_layers.map(async (infoLayer) => {
				const dataset = cryoDataset.find((d) => d.id === infoLayer.dataset_id);
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
		if (legendFetchTimeout) clearTimeout(legendFetchTimeout);

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

	// Add a single ArcGIS layer to map
	function addWMSLayer(layer: any) {
		if (!map || !layer) return;
		if (layer.mapserver === 'arcgis') {
			const source = new ImageArcGISRest({
				url: layer.url,
				params: { LAYERS: `show:${layer.layerIndex}`, FORMAT: 'PNG32', TRANSPARENT: true }
			});
			source.on('imageloadstart', () => {
				pendingImageLoads++;
				isLayerLoading = true;
			});
			source.on('imageloadend', () => {
				pendingImageLoads = Math.max(0, pendingImageLoads - 1);
				if (pendingImageLoads === 0) {
					map?.once('rendercomplete', () => {
						isLayerLoading = false;
					});
				}
			});
			source.on('imageloaderror', () => {
				pendingImageLoads = Math.max(0, pendingImageLoads - 1);
				if (pendingImageLoads === 0) isLayerLoading = false;
			});
			const arcgisLayer = new ImageLayer({ source, zIndex: 10, opacity: 0.7 });
			arcgisLayer.set('cryoLayerKey', `${layer.url}_${layer.layerIndex}`);
			map.addLayer(arcgisLayer);
		}
	}

	function addMultipleLayers(layers: any[]) {
		if (!map) return;
		layers.forEach((layer) => addWMSLayer(layer));
	}

	function clearCryoLayers() {
		if (!map) return;
		const toRemove = map.getLayers().getArray().filter((l) => l.get('cryoLayerKey') !== undefined);
		toRemove.forEach((l) => map!.removeLayer(l));
		pendingImageLoads = 0;
		isLayerLoading = false;
	}

	function updateMapLayers() {
		if (!map) return;
		clearCryoLayers();
		if (!currentDataset || !currentDataset.map_layers) return;

		const layers = resolveLayersForDataset(currentDataset);
		if (layers.length > 0) {
			addMultipleLayers(layers);
		}

		fetchLegendData();
	}

	$effect(() => {
		const dataset = currentDataset;
		if (dataset) updateMapLayers();
	});

	function selectQuestion(questionId: string) {
		selectedQuestionId = questionId;
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
				toggleBaseLayer('outline', true);

				setTimeout(() => {
					if (currentDataset) updateMapLayers();
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
</script>

<svelte:head>
	<title>Cryosphere | ICIMOD RIS</title>
</svelte:head>

<div
	class="theme-heading sticky z-[53] flex items-start justify-between gap-4 bg-[#F1F5F9] pb-2"
	style="top: var(--app-header-height, 6rem)"
>
	<div class="max-w-2xl">
		<h1 class="text-[20px] font-semibold tracking-[-0.045em] text-[#0F3557] sm:text-[22px]">Cryosphere</h1>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-[#64788B]">
			The Hindu Kush Himalaya: Earth's largest non-polar cryosphere.
		</p>
	</div>
	<ThemeInfoButton
		src="https://storymaps.arcgis.com/stories/f80953a3aae04b7096b628741b13e6c0"
		label="About the cryosphere in the HKH"
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

				<!-- Layer Loading Overlay -->
				{#if isLayerLoading}
					<div
						class="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-[10px] bg-white/40 backdrop-blur-[2px]"
					>
						<div class="flex items-center space-x-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-[#D8E1EA] border-t-[#2563EB]"></div>
							<span class="text-xs font-medium text-[#46637A]">Loading layer...</span>
						</div>
					</div>
				{/if}

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
				{#if 'report' in activeLayer && activeLayer.report}
					<p class="mt-4 text-sm leading-6 text-[#71869A]">
						<span class="font-semibold text-[#46637A]">Report: </span><DataSourceText source={activeLayer.report} />
					</p>
				{/if}
			{/if}
		{:else}
			<p class="text-sm leading-6 text-[#71869A]">Select a layer to see its description.</p>
		{/if}
	</aside>
</div>

<!-- Chart Section -->
{#if currentCharts && currentCharts.length > 0}
	<div
		class="mt-6 grid gap-4 {currentCharts.length === 1
			? ''
			: currentCharts.length === 2
				? currentCharts[0]?.chart_type === 'pie'
					? 'sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.85fr)]'
					: 'sm:grid-cols-[minmax(0,1.85fr)_minmax(0,0.85fr)]'
				: 'sm:grid-cols-2 xl:grid-cols-3'}"
	>
		{#each currentCharts as chart, index}
			<div class="data-card min-w-0">
				<Chart
					chartData={chart.chart_data}
					title={chart.title}
					subtitle={'subtitle' in chart ? (chart as any).subtitle : ''}
					chart_type={chart.chart_type}
					isPyramid={'isPyramid' in chart ? (chart as any).isPyramid : false}
					isStacked={'isStacked' in chart ? (chart as any).isStacked : false}
					yAxisTitle={'yAxisTitle' in chart ? (chart as any).yAxisTitle : 'Value'}
					showLegend={'showLegend' in chart ? (chart as any).showLegend : true}
					unit={'units' in chart ? (chart as any).units : ''}
					plotOptions={'plotOptions' in chart ? (chart as any).plotOptions : {}}
					legendConfig={'legendConfig' in chart ? (chart as any).legendConfig : null}
					height={chart.chart_type === 'pie' || currentCharts.some((c) => c.chart_type === 'pie')
						? 340
						: 260}
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
