<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import XYZ from 'ol/source/XYZ';
	import { fromLonLat } from 'ol/proj';
	import { defaults as defaultInteractions } from 'ol/interaction';
	import 'ol/ol.css';
	import Chart from '$lib/components/Chart.svelte';
	import lightMap from '$lib/assets/images/basemaps/light-map.png';
	import darkMap from '$lib/assets/images/basemaps/dark-map.png';
	import osmMap from '$lib/assets/images/basemaps/osm-map.png';
	import satelliteMap from '$lib/assets/images/basemaps/satellite-map.png';
	import terrainMap from '$lib/assets/images/basemaps/terrain-map.png';
	import {
		CheckCircle,
		Layers,
		Info,
		Eye,
		EyeOff,
		ChevronUp,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		ChevronsLeft,
		ChevronsRight,
		HelpCircle,
		List,
		MapIcon,
		House
	} from '@lucide/svelte';
	import FullScreen from 'ol/control/FullScreen';
	import ScaleLine from 'ol/control/ScaleLine';
	import { defaults as defaultControls } from 'ol/control/defaults.js';
	import ImageLayer from 'ol/layer/Image';
	import ImageWMS from 'ol/source/ImageWMS';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates
	const HKH_CENTER = [82.94924, 27.6382055];
	const HKH_ZOOM = 4.8;

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

	// Layout states: 'default' | 'hide-left' | 'left-full'
	let layoutState = $state('default');

	function isSmallScreen() {
		return typeof window !== 'undefined' && window.innerWidth < 1280;
	}

	function initializeLayoutState() {
		if (isSmallScreen()) {
			layoutState = 'hide-left';
		} else {
			layoutState = 'default';
		}
	}

	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	let isStoryMapLoading = $state(true);
	let iframeKey = $state(0);
	let layersPanelOpen = $state(false);
	let activeBaseLayers = $state({});
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('light');
	let baseMapLayer: TileLayer<any> | null = null;

	const basemaps = [
		{
			id: 'light',
			name: 'Light',
			url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
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

			const layer = new ImageLayer({
				source: new ImageArcGISRest({
					url: layerInfo.url,
					params: {
						LAYERS: `show:${layerId}`,
						FORMAT: 'PNG32',
						TRANSPARENT: true
					}
				}),
				zIndex: 2,
				opacity: 0.5
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
	}

	// Legend state
	let legendData = $state<
		Record<
			string,
			{ name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }
		>
	>({});
	let legendCollapsed = $state(false);
	let legendFetchTimeout: ReturnType<typeof setTimeout> | null = null;

	async function fetchLegendData() {
		if (legendFetchTimeout) {
			clearTimeout(legendFetchTimeout);
		}

		legendFetchTimeout = setTimeout(async () => {
			legendData = {};

			if (!currentDataset || !currentDataset.map_layers) return;

			const layers = currentDataset.map_layers.default;
			const layersToFetch: any[] = Array.isArray(layers) ? layers : [layers];

			for (const layer of layersToFetch) {
				if (!layer) continue;

				const uniqueKey = `${layer.url}_${layer.layerIndex}`;

				try {
					const legendUrl = `${layer.url}/legend?f=json`;
					const response = await fetch(legendUrl);
					const data = await response.json();

					const targetLayerId = parseInt(layer.layerIndex);
					const layerLegend = data.layers?.find((l: any) => l.layerId === targetLayerId);

					if (layerLegend) {
						legendData[uniqueKey] = {
							name: layer.name,
							items: layerLegend.legend.map((item: any) => ({
								label: item.label,
								imageData: `data:image/png;base64,${item.imageData}`
							}))
						};
					}
				} catch (error) {
					console.error('Error fetching legend:', error);
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

	function setLayoutState(state: 'default' | 'hide-left' | 'left-full') {
		layoutState = state;

		if (state === 'left-full' || state === 'default') {
			isStoryMapLoading = true;
			iframeKey++;
		}

		const forceMapResize = () => {
			if (map && mapContainer) {
				map.updateSize();
				setTimeout(() => {
					if (map) {
						map.updateSize();
						map.render();
					}
				}, 100);
				setTimeout(() => {
					if (map) {
						const view = map.getView();
						const currentCenter = view.getCenter();
						const currentZoom = view.getZoom();
						map.updateSize();
						map.render();
						if (currentCenter && currentZoom) {
							view.setCenter(currentCenter);
							view.setZoom(currentZoom);
						}
					}
				}, 350);
			}
		};

		requestAnimationFrame(() => {
			forceMapResize();
		});
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
					center: fromLonLat(HKH_CENTER),
					zoom: HKH_ZOOM
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
			}

			// Default: select Earthquake layer
			selectInformationLayer('Earthquake');
		}, 100);
	}

	onMount(() => {
		initializeLayoutState();

		const handleResize = () => {
			initializeLayoutState();
		};
		window.addEventListener('resize', handleResize);

		initializeMap();

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
				window.removeEventListener('resize', handleResize);
				resizeObserver.disconnect();
			};
		}

		return () => {
			window.removeEventListener('resize', handleResize);
		};
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

<!-- 3-Column Layout with Dynamic States -->
<div class="relative grid grid-cols-12 items-stretch gap-6">
	<!-- Floating Reopen Button - Only visible when left panel is hidden -->
	{#if layoutState === 'hide-left'}
		<button
			onclick={() => setLayoutState('default')}
			class="fixed top-[15rem] left-0 z-50 rounded-r-lg border border-l-0 border-slate-300 bg-white/90 p-2 text-slate-600 shadow-xl transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-2xl active:bg-slate-100 lg:p-1.5"
			title="Show Story Panel"
		>
			<ChevronsRight class="h-5 w-5 lg:h-4 lg:w-4" />
		</button>
	{/if}

	<!-- Left Sidebar - Story + Information -->
	<div
		class="sticky top-9 col-span-12 h-[70vh] min-h-[450px] flex-1 overflow-hidden rounded-xl border border-slate-200/30 lg:col-span-3 lg:h-[calc(100vh-14rem)] lg:min-h-[550px]"
		class:hidden={layoutState === 'hide-left'}
		class:lg:col-span-12={layoutState === 'left-full'}
		class:lg:h-[calc(100vh-8rem)]={layoutState === 'left-full'}
	>
		<!-- StoryMap Iframe Container -->
		<div class="relative h-full w-full overflow-hidden">
			<!-- Loading Screen -->
			{#if isStoryMapLoading}
				<div
					class="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
				>
					<div class="text-center">
						<div class="mb-4 flex justify-center">
							<div
								class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[rgb(227,136,0)]"
							></div>
						</div>
						<p class="text-sm font-medium text-slate-600">Loading Story...</p>
						<p class="mt-1 text-xs text-slate-500">Please wait</p>
					</div>
				</div>
			{/if}

			{#key iframeKey}
				<iframe
					src="https://storymaps.arcgis.com/stories/74d6389cbd8247e1ac38fbfc19130faa"
					class="h-full w-full border-0"
					title="Disaster StoryMap"
					allowfullscreen
					onload={() => (isStoryMapLoading = false)}
				></iframe>
			{/key}

			<!-- Overlay Control Buttons -->
			<div class="absolute top-2 right-5 z-20 flex items-center space-x-1 lg:space-x-2">
				{#if layoutState !== 'left-full'}
					<button
						onclick={() => setLayoutState('hide-left')}
						class="rounded-lg border border-slate-200/50 bg-white/90 p-1.5 text-slate-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 active:bg-slate-100 lg:p-1.5"
						title="Show Map"
					>
						<ChevronsLeft class="h-3.5 w-3.5" />
					</button>
					<button
						onclick={() => setLayoutState('left-full')}
						class="hidden rounded-lg border border-slate-200/50 bg-white/90 p-1.5 text-slate-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 lg:block"
						title="Expand Story"
					>
						<ChevronsRight class="h-3.5 w-3.5" />
					</button>
				{:else}
					<button
						onclick={() => setLayoutState('default')}
						class="rounded-lg border border-slate-200/50 bg-white/90 p-1.5 text-slate-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 active:bg-slate-100 lg:p-1.5"
						title="Back to Default"
					>
						<ChevronsLeft class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main Content Area -->
	<div
		class="sticky col-span-12 lg:col-span-9"
		class:lg:col-span-12={layoutState === 'hide-left'}
		class:hidden={layoutState !== 'hide-left'}
		class:lg:block={layoutState === 'default'}
		class:lg:hidden={layoutState === 'left-full'}
	>
		<div class="rounded-2xl border border-white/20 bg-white p-4 shadow-xl backdrop-blur-sm lg:p-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:gap-6">
				<!-- Left part: Map and Charts -->
				<div
					class="order-2 flex min-w-0 flex-col gap-2 lg:order-1 lg:gap-3 {layoutState ===
					'hide-left'
						? 'flex-1'
						: 'flex-1'}"
				>
					<!-- Map Section -->
					<div
						class="relative h-[60vh] min-h-[450px] overflow-hidden rounded-xl border border-slate-200/30 lg:h-[68vh] lg:max-h-[850px] lg:min-h-[550px]"
					>
						<div class="map-container flex h-full flex-col">
							<div
								bind:this={mapContainer}
								class="map-element h-full w-full overflow-hidden rounded-xl"
							></div>

							<!-- Home Reset Button -->
							<button
								class="absolute top-15 left-2 z-20 rounded border border-slate-200/50 bg-white p-1 shadow hover:bg-gray-100 focus:outline focus:outline-1 focus:outline-black"
								onclick={() => {
									if (map) {
										map.getView().setCenter(fromLonLat(HKH_CENTER));
										map.getView().setZoom(HKH_ZOOM);
									}
								}}
								title="Reset to Home View"
							>
								<House class="h-3.5 w-3.5 text-slate-600" />
							</button>

							<!-- Basemap Switcher Button -->
							<button
								class="absolute top-10 right-2 z-20 rounded border border-slate-200/50 bg-white p-1 shadow hover:bg-gray-100 focus:outline focus:outline-1 focus:outline-black"
								onclick={() => (basemapPanelOpen = !basemapPanelOpen)}
								title="Change Basemap"
								aria-label="Change Basemap"
							>
								<MapIcon class="h-3.5 w-3.5 text-slate-600" />
							</button>

							<!-- Basemap Switcher Panel -->
							<div
								class="absolute top-[4rem] right-10 z-20 w-48 overflow-hidden rounded-lg border border-slate-200/50 bg-white shadow-lg transition-all duration-300 ease-in-out {basemapPanelOpen
									? 'max-h-96 opacity-100'
									: 'max-h-0 opacity-0'}"
							>
								<div class="p-3">
									<h3 class="mb-2 text-sm font-semibold">Basemap</h3>
									<div class="space-y-1">
										{#each basemaps as basemap}
											<button
												class="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors {selectedBasemap ===
												basemap.id
													? 'bg-indigo-100 font-medium text-indigo-700'
													: 'text-slate-700 hover:bg-gray-100'}"
												onclick={() => {
													switchBasemap(basemap.id);
													basemapPanelOpen = false;
												}}
											>
												<span class="flex-1">{basemap.name}</span>
												<img
													src={basemap.image}
													alt={basemap.name}
													class="h-8 w-12 rounded border border-slate-200 object-cover"
												/>
											</button>
										{/each}
									</div>
								</div>
							</div>

							<!-- Layer Toggler Button -->
							<button
								class="absolute top-[4.5rem] right-2 z-20 rounded border border-slate-200/50 bg-white p-1 shadow hover:bg-gray-100"
								onclick={() => (layersPanelOpen = !layersPanelOpen)}
							>
								{#if layersPanelOpen}
									<ChevronsRight class="h-3.5 w-3.5" />
								{:else}
									<Layers class="h-3.5 w-3.5" />
								{/if}
							</button>

							<!-- Layer Toggler Panel -->
							<div
								class="absolute top-[6rem] right-10 z-20 w-40 overflow-hidden rounded-lg border border-slate-200/50 bg-white shadow-lg transition-all duration-300 ease-in-out {layersPanelOpen
									? 'max-h-96 opacity-100'
									: 'max-h-0 opacity-0'}"
							>
								<div class="p-3">
									<h3 class="mb-2 text-sm font-semibold">Base Layers</h3>
									<div class="space-y-2">
										{#each baseLayers as layerInfo}
											<label class="flex items-center space-x-2 text-sm">
												<input
													type="checkbox"
													checked={!!activeBaseLayers[
														layerInfo.id as keyof typeof activeBaseLayers
													]}
													onchange={(e) => {
														const target = e.target as HTMLInputElement;
														toggleBaseLayer(layerInfo.id, target.checked);
														target.blur();
													}}
													class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
												/>
												<span>{layerInfo.name}</span>
											</label>
										{/each}
									</div>
								</div>
							</div>

							<!-- Legend Panel -->
							{#if currentDataset && Object.keys(legendData).length > 0}
								<div class="absolute right-4 bottom-4 {isFullscreen ? 'z-[9999]' : 'z-10'}">
									<button
										class="mb-2 flex w-full items-center justify-between rounded-lg border border-white/30 bg-white/95 p-2 text-sm shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl"
										onclick={() => (legendCollapsed = !legendCollapsed)}
									>
										<div class="flex items-center space-x-2">
											<List class="h-3.5 w-3.5 text-[rgb(227,136,0)]" />
											{#if !legendCollapsed}
												<span class="font-medium text-slate-700">Legend</span>
											{/if}
										</div>
									</button>

									{#if !legendCollapsed}
										<div
											class="max-w-xs rounded-lg border border-white/30 bg-white/95 p-3 shadow-xl backdrop-blur-sm"
										>
											<div class="max-h-[320px] space-y-4 overflow-y-auto">
												{#each Object.keys(legendData) as uniqueKey}
													<div class="space-y-2">
														<h4 class="text-sm font-semibold text-slate-800">
															{legendData[uniqueKey].name}
														</h4>
														<div class="space-y-1">
															{#each legendData[uniqueKey].items as item}
																<div class="flex items-center space-x-2">
																	{#if item.imageData}
																		<img
																			src={item.imageData}
																			alt={item.label}
																			class="h-4 w-5 flex-shrink-0"
																		/>
																	{:else if item.imageUrl}
																		<img
																			src={item.imageUrl}
																			alt={item.label}
																			class="h-4 w-5 flex-shrink-0"
																		/>
																	{/if}
																	<span class="text-xs text-slate-700">{item.label}</span>
																</div>
															{/each}
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Chart Section -->
					<div class="flex-1 rounded-xl bg-slate-50/30 p-6">
						<div class="rounded-lg bg-slate-50/50">
							{#if currentDataset && currentCharts && currentCharts.length > 0}
								<div class="space-y-6">
									{#each currentCharts as chart, index}
										<div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
											<Chart
												chartData={chart.chart_data}
												title={chart.title}
												chart_type={chart.chart_type}
												yAxisTitle={chart.yAxisTitle}
												showLegend={false}
												unit={chart.units}
											/>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right part: Information Layer -->
				<div class="order-1 w-full flex-shrink-0 lg:order-2 lg:w-75">
					<div
						class="top-6 flex-1 flex-col rounded-2xl border border-white/20 bg-white/70 p-4 lg:min-h-[calc(100vh-16rem)]"
					>
						<!-- Information Layer Header -->
						<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
							<div class="rounded-lg bg-gradient-to-r from-[rgb(227,136,0)] to-[rgb(167,97,0)] p-2">
								<Layers class="h-5 w-5 text-white" />
							</div>
							<h3 class="text-lg font-bold text-slate-800">Information Layer</h3>
						</div>

						<!-- Information Layer Content -->
						<div class="flex-1 overflow-y-auto">
							{#if information_layers && information_layers.length > 0}
								<div class="space-y-3">
									{#each information_layers as layer, index}
										<div
											class="rounded-lg border backdrop-blur-sm transition-all duration-200 {selectedInformationLayer ===
											layer.title
												? 'border-[rgb(227,136,0)] bg-gradient-to-r from-amber-50/90 to-[rgb(227,136,0)]/10 shadow-md'
												: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80'}"
										>
											<button
												onclick={() => selectInformationLayer(layer.title)}
												class="flex w-full items-start space-x-2 p-4 text-left transition-all duration-200 hover:opacity-80"
											>
												<h4
													class="flex-1 text-sm font-medium {selectedInformationLayer ===
													layer.title
														? 'text-[rgb(167,97,0)]'
														: 'text-slate-800'}"
												>
													{layer.title}
												</h4>
												<span
													class="flex-shrink-0 cursor-pointer"
													role="button"
													tabindex="0"
													onclick={(e) => {
														e.stopPropagation();
														toggleLayerExpansion(layer.title);
													}}
													onkeydown={(e) => {
														if (e.key === 'Enter' || e.key === ' ') {
															e.preventDefault();
															e.stopPropagation();
															toggleLayerExpansion(layer.title);
														}
													}}
												>
													{#if expandedLayer === layer.title}
														<ChevronUp class="h-3.5 w-3.5 text-slate-600" />
													{:else}
														<ChevronDown class="h-3.5 w-3.5 text-slate-600" />
													{/if}
												</span>
											</button>

											{#if expandedLayer === layer.title}
												<div
													class="border-t border-slate-200/50 px-4 py-3 text-justify text-xs leading-relaxed text-slate-600"
												>
													<p>{layer.info}</p>
													<p class="pt-1 text-left text-xs text-slate-600">
														<span class="font-bold"> Data Source: </span>
														{layer.source}
													</p>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<div class="flex h-40 items-center justify-center">
									<div class="text-center text-slate-500">
										<Layers class="mx-auto mb-2 h-8 w-8 text-slate-400" />
										<p class="text-sm">No indicators available</p>
										<p class="text-xs">Layers will be added soon</p>
									</div>
								</div>
							{/if}
						</div>

						<div class="relative mt-6 flex min-h-0 flex-1 flex-col pt-6"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Fixed Floating Questions Button and Panel -->
{#if layoutState !== 'left-full'}
	<div class="fixed right-12 bottom-6 z-50 flex flex-col items-end">
		{#if isQuestionsPanelOpen}
			<div
				class="questions-panel mb-4 flex h-80 w-80 origin-bottom-right scale-100 transform flex-col rounded-2xl border border-white/20 bg-white/95 px-4 py-4 opacity-100 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
			>
				<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
					<div class="rounded-lg bg-gradient-to-r from-[rgb(227,136,0)] to-[rgb(167,97,0)] p-2">
						<Info class="h-3.5 w-3.5 text-white" />
					</div>
					<h3 class="text-base font-bold text-slate-800">Explore Questions</h3>
				</div>

				<div class="max-h-60 flex-1 space-y-3 overflow-y-auto">
					{#each questions as questionItem, index}
						<button
							class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
							questionItem.id
								? 'border-[rgb(227,136,0)] bg-amber-50 shadow-md'
								: 'border-slate-200/50 bg-white/50 hover:border-[rgb(227,136,0)]/50 hover:bg-amber-50/70 hover:shadow-sm'}"
							onclick={() => selectQuestion(questionItem.id)}
						>
							<div class="flex items-start space-x-2">
								<div class="mt-1 flex-shrink-0">
									{#if selectedQuestionId === questionItem.id}
										<CheckCircle class="h-3.5 w-3.5 text-[rgb(227,136,0)]" />
									{:else}
										<div
											class="h-3.5 w-3.5 rounded-full border-2 border-slate-300 group-hover:border-[rgb(227,136,0)]"
										></div>
									{/if}
								</div>
								<p
									class="text-xs leading-relaxed {selectedQuestionId === questionItem.id
										? 'font-medium text-[rgb(167,97,0)]'
										: 'text-slate-600 group-hover:text-slate-800'}"
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
			class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[rgb(227,136,0)] to-[rgb(167,97,0)] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
			aria-label="Toggle questions panel"
		>
			<HelpCircle class="h-6 w-6" />
		</button>
	</div>
{/if}

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
