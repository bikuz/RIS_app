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
		Leaf,
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

	let { currentTopic = 'ecosystem', width = '100%', height = '400px' } = $props();

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates (optimized for full HKH view)
	const HKH_CENTER = [82.94924, 27.6382055]; // Longitude, Latitude - adjusted for better HKH coverage
	const HKH_ZOOM = 4.8; // Reduced zoom to show more of the HKH region

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

	// Layout states: 'default' | 'hide-left' | 'left-full'
	let layoutState = $state('default');

	// Function to check if screen is small (laptop, tablet, or mobile)
	function isSmallScreen() {
		return typeof window !== 'undefined' && window.innerWidth < 1280; // lg breakpoint
	}

	// Initialize layout based on screen size
	function initializeLayoutState() {
		if (isSmallScreen()) {
			layoutState = 'hide-left';
		} else {
			layoutState = 'default';
		}
	}

	// Track questions panel state
	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Track iframe loading state
	let isStoryMapLoading = $state(true);

	// Generate iframe key based on layout state to force reload on layout change
	let iframeKey = $state(0);

	// Add new state variables for layers panel
	let layersPanelOpen = $state(false);
	let activeBaseLayers = $state({});

	// Basemap switcher state
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('light');
	let baseMapLayer: TileLayer<any> | null = null;

	// Define available basemaps
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
		// {
		// 	id: 'terrain',
		// 	name: 'Terrain',
		// 	url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
		// 	attribution: '© OpenStreetMap contributors, SRTM',
		// 	image: terrainMap
		// }
		{
			id: 'topographic',
			name: 'Topographic',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
			attribution:
				'Esri, TomTom, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, CNES/Airbus DS, InterMap, NASA/METI, NASA/NGS and the GIS User Community',
			image: terrainMap
		}
	];

	// Function to switch basemap
	function switchBasemap(basemapId: string) {
		if (!map) return;

		selectedBasemap = basemapId;
		const basemapConfig = basemaps.find((b) => b.id === basemapId);
		if (!basemapConfig) return;

		// Create new basemap layer
		const newBaseMapLayer = new TileLayer({
			source: new XYZ({
				url: basemapConfig.url,
				attributions: basemapConfig.attribution
			}),
			zIndex: 0
		});

		// Remove old basemap layer
		if (baseMapLayer) {
			map.removeLayer(baseMapLayer);
		}

		// Add new basemap layer as the first layer (bottom)
		const layers = map.getLayers();
		layers.insertAt(0, newBaseMapLayer);

		// Store reference to current basemap layer
		baseMapLayer = newBaseMapLayer;
	}

	// Define base layers from HKH/Outline service
	const baseLayers = [
		{
			id: 0,
			name: 'Outline',
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer'
		}
		// {
		// 	id: 1,
		// 	name: 'Soil',
		// 	url: BASELAYERS_URL
		// },
		// {
		// 	id: 3,
		// 	name: 'River',
		// 	url: BASELAYERS_URL
		// }
	];

	// Function to toggle base layers
	async function toggleBaseLayer(layerId: number, checked: boolean) {
		if (!map) return;
		activeBaseLayers = { ...activeBaseLayers, [layerId]: checked };

		if (checked) {
			const layerInfo = baseLayers.find((l) => l.id === layerId);
			if (!layerInfo) return;

			let layer;

			if (layerId === 0) {
				// Apply special styling or configuration for layerId 0
				layer = new ImageLayer({
					source: new ImageArcGISRest({
						url: layerInfo.url,
						params: {
							LAYERS: `show:${layerId}`,
							FORMAT: 'PNG32',
							TRANSPARENT: true
						}
					}),
					zIndex: 2,
					// Example styling: reduce opacity or add custom properties
					opacity: 0.5
				});
			} else {
				// Default configuration for other layers
				layer = new ImageLayer({
					source: new ImageArcGISRest({
						url: layerInfo.url,
						params: {
							LAYERS: `show:${layerId}`,
							FORMAT: 'PNG32',
							TRANSPARENT: true
						}
					}),
					zIndex: 2
				});
			}

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

	// Legend state management
	let legendData = $state<
		Record<
			string,
			{ name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }
		>
	>({});
	let legendCollapsed = $state(false);

	// Sample ecosystem datasets structure
	const ecosystemDataset = [
		{
			id: 'land-cover-2022',
			title: 'Land Cover 2022',
			description: 'Land cover distribution in the HKH region',
			control_type: 'none',
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
				default: [
					{
						id: 'land-cover-2022-layer',
						name: 'Land Cover 2022',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Landcover/MapServer/',
						layerIndex: 21,
						mapserver: 'arcgis'
					}
				]
			},
			charts: [
				{
					title: 'Land Cover of HKH Region in 2022',
					chart_type: 'column',
					units: 'hectares',
					yAxisTitle: 'hectares',
					chart_data: {
						categories: [
							'Forest',
							'Grassland',
							'Cropland',
							'Bare Soil',
							'Bare Rock',
							'Built-Up',
							'Snow and Glacier',
							'Water Body',
							'Riverbed'
						],

						series: [
							{
								name: 'Land Cover',
								data: [
									{ y: 84185046.72, color: '#006f00' },
									{ y: 159413631.12, color: '#91ef7a' },
									{ y: 20996243.19, color: '#f6ee04' },
									{ y: 77065078.77, color: '#dcd4e1' },
									{ y: 54904168.62, color: '#d9b2de' },
									{ y: 1199387.79, color: '#ff0000' },
									{ y: 12850846.29, color: '#b1f2ff' },
									{ y: 6858504.36, color: '#081cfb' },
									{ y: 1844620.92, color: '#a6dcda' }
								]
							}
						]
					}
				}
			]
		},
		{
			id: 'browning-greening',
			title: 'Vegetation Health',
			description: 'Vegetation Health in the HKH region',
			control_type: 'none',
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
				default: [
					{
						id: 'browning-greening-layer',
						name: 'Vegetation Health',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_NDVI_EVI/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				]
			},
			charts: []
		},
		{
			id: 'ndvi-trend',
			title: 'NDVI Trend (2000-2023)',
			description: 'NDVI Trend in the HKH region',
			control_type: 'none',
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
				default: [
					{
						id: 'ndvi-trend-layer',
						name: 'NDVI Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_NDVI_EVI/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				]
			},
			charts: []
		},
		{
			id: 'evi-trend',
			title: 'EVI Trend (2000-2023)',
			description: 'EVI Trend in the HKH region',
			control_type: 'none',
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
				default: [
					{
						id: 'evi-trend-layer',
						name: 'EVI Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_NDVI_EVI/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				]
			},
			charts: []
		},

		{
			id: 'soil-carbon-content',
			title: 'Soil Organic Carbon Content',
			control_type: 'threshold-control',
			control_options: ['0', '30', '60', '200'],
			default_option: '30',
			charts: [],
			map_layers: {
				'0': [
					{
						id: 'soil-carbon-content-0',
						name: 'At 0cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				],

				'30': [
					{
						id: 'soil-carbon-content-30',
						name: 'At 30cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				'60': [
					{
						id: 'soil-carbon-content-60',
						name: 'At 60cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				'200': [
					{
						id: 'soil-carbon-content-200',
						name: 'At 200cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				]
			}
		}
	];

	const questions: any = [
		// {
		// 	id: 'question-1',
		// 	question: 'Which areas have the highest forest cover in the HKH region?',
		// 	dataset_id: 'forest-cover'
		// },
		// {
		// 	id: 'question-2',
		// 	question: 'Where are the major biodiversity hotspots located?',
		// 	dataset_id: 'biodiversity-hotspots'
		// },
		// {
		// 	id: 'question-3',
		// 	question: 'How has ecosystem degradation affected wildlife corridors?',
		// 	dataset_id: 'forest-cover'
		// }
	];

	const information_layers: any = [
		{
			id: 'map-indicator-1',
			title: 'Land Cover Distribution 2022',
			dataset_id: 'land-cover-2022',
			info: 'The map represents the physical or biophysical characteristics of the HKH region. This dataset is developed by ICIMOD under its SERVIR–HKH Initiative, using remote-sensing and Google Earth Engine, and collaborating with  partner organizations.',
			source: 'Regional Database System, Icimod  (https://rds.icimod.org/)'
		},
		{
			id: 'map-indicator-3',
			title: 'NDVI Trend (2000-2023)',
			dataset_id: 'ndvi-trend',
			info: 'The map represents the spatial pattern of vegetation greenness change over the past 24 years (2000–2023). Each pixel indicates the rate of NDVI change per year, derived using the Sen-Median trend analysis and Mann-Kendall (MK) test.',
			source: 'MODIS'
		},
		{
			id: 'map-indicator-2',
			title: 'Vegetation Health',
			dataset_id: 'browning-greening',
			info: 'The map represents the long-term vegetation productivity trends from 2000 to 2023 using NDVI as a proxy for vegetation productivity. Temporal trends were analyzed using the Mann-Kendall test to detect statistically significant changes and Theil-Sen slope estimator was applied to quantify the rate of change. Pixels are classified into three categories based on the Mann-Kendall Z-statistic at 95% confidence (α = 0.05): Degrading: Z <−1.96 (significant declining trend), Stable: −1.96 Z ≤ +1.96 (no significant trend) and Improving: Z > +1.96 (significant increasing trend).',
			source: 'MODIS'
		},
		{
			id: 'map-indicator-4',
			title: 'EVI Trend (2000-2023)',
			dataset_id: 'evi-trend',
			info: 'The map represents the spatial pattern of vegetation greenness change over the past 24 years (2000–2023). Each pixel indicates the rate of EVI change per year, derived using using the Sen-Median trend analysis and Mann-Kendall (MK) test.',
			source: 'MODIS'
		},
		{
			id: 'map-indicator-5',
			title: 'Soil Organic Carbon Content',
			dataset_id: 'soil-carbon-content',
			info: 'The map represents the spaial distribution of soil organic carbon content across HKH at 4 different depths(0cm, 30cm, 60cm and 200cm).The data is sourced from the OpenLandMap global soil database.Values are expressed in g/kg, indicating the mass of soil organic carbon present per kilogram of soil at spatial resolution of 250m.',
			source: 'OpenLandMap Soil Organic Carbon Content (https://stac.openlandmap.org/)'
		}
	];

	// Track selected question - default to first question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection)
	let selectedInformationLayer = $state<string | null>('Land Cover Distribution 2022');

	// Track expanded layer for accordion - default closed
	let expandedLayer = $state<string | null>(null);

	// Control state variables
	let soilCarbonDepth = $state<'0' | '30' | '60' | '200'>('30');

	// Get current dataset based on selected question or information layer
	let currentDataset = $derived.by(() => {
		// First priority: selected question
		if (selectedQuestionId) {
			const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
			if (selectedQuestion?.dataset_id) {
				return ecosystemDataset.find((item) => item.id === selectedQuestion.dataset_id);
			}
		}

		// Second priority: selected information layer
		if (selectedInformationLayer) {
			const selectedLayer = information_layers.find(
				(layer) => layer.title === selectedInformationLayer
			);
			if (selectedLayer?.dataset_id) {
				return ecosystemDataset.find((item) => item.id === selectedLayer.dataset_id);
			}
		}

		// Default: nothing selected, return null
		return null;
	});

	// Extract current data from dataset
	let currentCharts = $derived(currentDataset?.charts || []);

	// Get current map layers based on dataset
	let currentMapLayers = $derived(currentDataset?.map_layers || null);

	// Debounce timer for legend fetching
	let legendFetchTimeout: ReturnType<typeof setTimeout> | null = null;

	// Fetch legend data for current layers
	async function fetchLegendData() {
		// Clear any existing timeout
		if (legendFetchTimeout) {
			clearTimeout(legendFetchTimeout);
		}

		// Debounce the legend fetch to prevent rapid requests
		legendFetchTimeout = setTimeout(async () => {
			// Clear legend data first
			legendData = {};

			if (!currentDataset || !currentDataset.map_layers) {
				return;
			}

			console.log('Fetching legend data for dataset:', currentDataset.id);

			// Get current layers based on control type
			let layersToFetch: any[] = [];

			if (currentDataset.control_type === 'none') {
				const layers = currentDataset.map_layers.default;
				layersToFetch = Array.isArray(layers) ? layers : [layers];
			} else if (currentDataset.control_type === 'threshold-control') {
				const selectedLayers = currentMapLayers && (currentMapLayers as any)[soilCarbonDepth];
				layersToFetch = Array.isArray(selectedLayers) ? selectedLayers : [selectedLayers];
			}

			// Fetch legend for each layer
			for (const layer of layersToFetch) {
				if (!layer) continue;

				const uniqueKey = `${layer.url}_${layer.layerIndex}`;

				if (layer.mapserver === 'arcgis') {
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
						console.error('Error fetching ArcGIS legend:', error);
					}
				} else {
					// Handle WMS/GeoServer layers
					const legendUrl = `${layer.url}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${layer.layerIndex}`;

					legendData[uniqueKey] = {
						name: layer.name,
						items: [
							{
								label: layer.name,
								imageUrl: legendUrl
							}
						]
					};
				}
			}

			console.log('Legend data updated:', Object.keys(legendData));
		}, 300); // 300ms debounce delay
	}

	function initializeMap() {
		if (!mapContainer) return;

		// Small delay to ensure container has proper dimensions
		setTimeout(() => {
			// Create custom fullscreen control
			const fullScreenControl = new FullScreen({
				source: mapContainer.parentElement || mapContainer
			});

			// Get initial basemap configuration
			const initialBasemap = basemaps.find((b) => b.id === selectedBasemap);
			if (!initialBasemap) return;

			// Create initial basemap layer
			baseMapLayer = new TileLayer({
				source: new XYZ({
					url: initialBasemap.url,
					attributions: initialBasemap.attribution
				}),
				zIndex: 0
			});

			map = new Map({
				target: mapContainer,
				controls: defaultControls().extend([
					fullScreenControl
					// new ScaleLine({ units: 'metric', bar: true })
				]),
				// interactions: defaultInteractions({
				// 	mouseWheelZoom: false
				// }),
				layers: [baseMapLayer],
				view: new View({
					center: fromLonLat(HKH_CENTER),
					zoom: HKH_ZOOM
				})
			});

			// Listen for fullscreen changes
			const handleFullscreenChange = () => {
				const isCurrentlyFullscreen = document.fullscreenElement !== null;
				isFullscreen = isCurrentlyFullscreen;

				// Force map resize when entering/exiting fullscreen
				setTimeout(() => {
					if (map) {
						map.updateSize();
						map.render();
					}
				}, 100);
			};

			// Store handler reference for cleanup
			fullscreenHandler = handleFullscreenChange;

			// Add fullscreen event listeners
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.addEventListener('mozfullscreenchange', handleFullscreenChange);
			document.addEventListener('MSFullscreenChange', handleFullscreenChange);

			// Add some basic interaction
			map.on('click', (event) => {
				const coordinate = event.coordinate;
				console.log('Map clicked at:', coordinate);
			});

			// Ensure map renders properly
			if (map) {
				map.updateSize();
				// Load default layers after map is initialized only if a dataset is selected
				setTimeout(() => {
					if (currentDataset) {
						console.log('Initial map layer update after map initialization');
						updateMapLayers();
					}
				}, 200);
			}
		}, 100);
	}

	onMount(() => {
		// Initialize layout state based on screen size
		initializeLayoutState();

		// Add window resize listener for responsive layout
		const handleResize = () => {
			initializeLayoutState();
		};
		window.addEventListener('resize', handleResize);

		initializeMap();

		// Add resize observer to handle container size changes
		if (typeof ResizeObserver !== 'undefined' && mapContainer) {
			const resizeObserver = new ResizeObserver(() => {
				if (map) {
					// Small delay to ensure DOM is updated
					setTimeout(() => {
						if (map) {
							map.updateSize();
						}
					}, 100);
				}
			});
			resizeObserver.observe(mapContainer);

			// Cleanup on destroy
			return () => {
				window.removeEventListener('resize', handleResize);
				resizeObserver.disconnect();
			};
		}

		// Cleanup resize listener even if ResizeObserver is not available
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (legendFetchTimeout) {
			clearTimeout(legendFetchTimeout);
		}

		// Remove fullscreen event listeners
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

	// Watch for layout state changes and update map size
	$effect(() => {
		// This effect runs whenever layoutState changes
		layoutState;

		// Multiple resize attempts with different timings
		if (map && mapContainer) {
			// Immediate attempt
			requestAnimationFrame(() => {
				if (map) {
					map.updateSize();
				}
			});

			// Delayed attempt
			setTimeout(() => {
				if (map) {
					map.updateSize();
					map.render();
				}
			}, 150);

			// Final attempt after all transitions
			setTimeout(() => {
				if (map) {
					map.updateSize();
					map.render();
				}
			}, 400);
		}
	});

	// Function to handle question selection
	function selectQuestion(questionId: string) {
		selectedQuestionId = questionId;
		// Clear information layer selection when selecting a question
		selectedInformationLayer = null;

		console.log('Question selected:', questionId);
	}

	// Function to select information layer
	function selectInformationLayer(layerId: string) {
		// If clicking the same layer, deselect it
		if (selectedInformationLayer === layerId) {
			selectedInformationLayer = null;
			return;
		}

		// Simply select the layer
		selectedInformationLayer = layerId;
		// Clear question selection when selecting an information layer
		selectedQuestionId = '';

		// Find the dataset and set default control values
		const selectedLayer = information_layers.find((layer) => layer.title === layerId);
		if (selectedLayer?.dataset_id) {
			const dataset = ecosystemDataset.find((item) => item.id === selectedLayer.dataset_id);

			// Set default control values based on dataset
			if (dataset?.control_type === 'threshold-control' && dataset.default_option) {
				soilCarbonDepth = dataset.default_option as '0' | '30' | '60' | '200';
			}
		}

		console.log('Information layer selected:', layerId);
	}

	// Function to toggle layer expansion
	function toggleLayerExpansion(layerId: string) {
		if (expandedLayer === layerId) {
			expandedLayer = null;
		} else {
			expandedLayer = layerId;
		}
	}

	// Function to set specific layout state
	function setLayoutState(state: 'default' | 'hide-left' | 'left-full') {
		layoutState = state;

		// Force iframe reload when expanding/collapsing story section
		if (state === 'left-full' || state === 'default') {
			isStoryMapLoading = true;
			iframeKey++;
		}

		// Force map resize with multiple attempts to ensure it works
		const forceMapResize = () => {
			if (map && mapContainer) {
				// Clear any existing size constraints
				const mapElement = mapContainer;
				mapElement.style.width = '100%';
				mapElement.style.maxWidth = '100%';

				// First immediate update
				map.updateSize();

				// Second update after a short delay
				setTimeout(() => {
					if (map) {
						map.updateSize();
						// Force a render
						map.render();
					}
				}, 100);

				// Third update after CSS transitions complete
				setTimeout(() => {
					if (map) {
						// Force complete resize
						const view = map.getView();
						const currentCenter = view.getCenter();
						const currentZoom = view.getZoom();

						map.updateSize();
						map.render();

						// Restore view if it changed
						if (currentCenter && currentZoom) {
							view.setCenter(currentCenter);
							view.setZoom(currentZoom);
						}

						console.log('Map resized for layout:', state);
					}
				}, 350);
			}
		};

		// Use requestAnimationFrame to ensure DOM updates are complete
		requestAnimationFrame(() => {
			forceMapResize();
		});
	}

	// Add layer to map based on layer configuration
	function addWMSLayer(layerConfig: any) {
		if (!map || !layerConfig) return;

		let layer;

		if (layerConfig.mapserver === 'arcgis') {
			// Create ArcGIS layer
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
			// Create WMS layer
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

		// Set layer ID for identification
		layer.set('id', layerConfig.id);
		layer.set('layerName', layerConfig.name);

		// Add to map
		if (map) {
			map.addLayer(layer);
			console.log('Added layer:', layerConfig.name, 'ID:', layerConfig.id);
		}
	}

	// Add multiple layers (for datasets with multiple layers)
	function addMultipleLayers(layerConfigs: any[]) {
		if (!layerConfigs || !Array.isArray(layerConfigs)) return;

		layerConfigs.forEach((layerConfig) => {
			addWMSLayer(layerConfig);
		});
	}

	// Remove layer from map
	function removeLayer(layerId: string) {
		if (!map) return;

		const layers = map.getLayers().getArray().slice();
		layers.forEach((layer) => {
			if (layer.get('id') === layerId && map) {
				map.removeLayer(layer);
				console.log('Removed layer:', layerId);
			}
		});
	}

	// Clear all ecosystem data layers (keep base map)
	function clearEcosystemLayers() {
		if (!map) return;

		const layers = map.getLayers().getArray().slice();
		console.log('Clearing ecosystem layers. Total layers found:', layers.length);

		layers.forEach((layer) => {
			const layerId = layer.get('id');
			// Remove layers that have an ID (our custom layers), keep base layer
			if (layerId && map) {
				console.log('Removing layer with ID:', layerId);
				map.removeLayer(layer);
			}
		});

		console.log('Ecosystem layers cleared. Remaining layers:', map.getLayers().getArray().length);
	}

	// Update layers based on current dataset
	function updateMapLayers() {
		if (!map) return;

		console.log('=== Starting updateMapLayers ===');
		console.log('Current dataset:', currentDataset?.id);
		console.log('Layers before clearing:', map.getLayers().getArray().length);

		// Always clear existing ecosystem layers first
		clearEcosystemLayers();

		// If no dataset is selected, stop here (layers are cleared)
		if (!currentDataset || !currentDataset.map_layers) {
			console.log('No dataset selected - layers cleared');
			return;
		}

		console.log(
			'Updating map layers for dataset:',
			currentDataset.id,
			'control_type:',
			currentDataset.control_type
		);

		// For 'none' control type, show layers immediately
		if (currentDataset.control_type === 'none') {
			const layers = currentDataset.map_layers.default;
			if (layers) {
				if (Array.isArray(layers)) {
					console.log('Adding multiple layers:', layers.length);
					addMultipleLayers(layers);
				} else {
					console.log('Adding single layer:', (layers as any).name);
					addWMSLayer(layers);
				}
			}
		} else if (currentDataset.control_type === 'threshold-control') {
			// For threshold control, show layer based on selected depth
			const selectedLayers = currentMapLayers && (currentMapLayers as any)[soilCarbonDepth];
			if (selectedLayers) {
				if (Array.isArray(selectedLayers)) {
					addMultipleLayers(selectedLayers);
				} else {
					addWMSLayer(selectedLayers);
				}
			}
		}

		console.log('Layers after adding:', map.getLayers().getArray().length);
		console.log('=== Finished updateMapLayers ===');

		// Fetch legend data after updating layers
		fetchLegendData();
	}

	// Single consolidated effect for all map layer updates
	$effect(() => {
		// This will trigger when any of these state variables change
		const dataset = currentDataset;
		const depth = soilCarbonDepth;

		console.log(
			'Main effect triggered - Dataset:',
			dataset?.id || 'null',
			'Control type:',
			dataset?.control_type
		);

		// Only update map layers if we have a dataset
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
						<!-- Animated Spinner -->
						<div class="mb-4 flex justify-center">
							<div
								class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-green-500"
							></div>
						</div>
						<!-- Loading Text -->
						<p class="text-sm font-medium text-slate-600">Loading Story...</p>
						<p class="mt-1 text-xs text-slate-500">Please wait</p>
					</div>
				</div>
			{/if}

			<!-- Iframe -->
			{#key iframeKey}
				<iframe
					src="https://storymaps.arcgis.com/stories/d5a8e4ea8c084a33bd5af57f6d84368f"
					width="100%"
					height="100%"
					style="border:none;"
					allowfullscreen
					class="h-full w-full"
					title="ArcGIS StoryMap - Ecosystem"
					onload={() => {
						isStoryMapLoading = false;
					}}
				></iframe>
			{/key}

			<!-- Overlay Control Buttons -->
			<div class="absolute top-2 right-5 z-20 flex items-center space-x-1 lg:space-x-2">
				{#if layoutState !== 'left-full'}
					<!-- Hide Left Panel Button - Show Map -->
					<button
						onclick={() => setLayoutState('hide-left')}
						class="rounded-lg border border-slate-200/50 bg-white/90 p-1.5 text-slate-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 active:bg-slate-100 lg:p-1.5"
						title="Show Map"
					>
						<ChevronsLeft class="h-3.5 w-3.5" />
					</button>
					<!-- Expand Story Button - Desktop only -->
					<button
						onclick={() => setLayoutState('left-full')}
						class="hidden rounded-lg border border-slate-200/50 bg-white/90 p-1.5 text-slate-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 lg:block"
						title="Expand Story"
					>
						<ChevronsRight class="h-3.5 w-3.5" />
					</button>
				{:else}
					<!-- Back to Default Button -->
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

	<!-- Main Content Area - Unified container with common white background -->
	<div
		class="sticky col-span-12 lg:col-span-9"
		class:lg:col-span-12={layoutState === 'hide-left'}
		class:hidden={layoutState !== 'hide-left'}
		class:lg:block={layoutState === 'default'}
		class:lg:hidden={layoutState === 'left-full'}
	>
		<div class="rounded-2xl border border-white/20 bg-white p-4 shadow-xl backdrop-blur-sm lg:p-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:gap-6">
				<!-- Left part: Map and Charts - Shows second on mobile/tablet -->
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
														target.blur(); // Removes focus from the checkbox
													}}
													class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
												/>
												<span>{layerInfo.name}</span>
											</label>
										{/each}
									</div>
								</div>
							</div>

							<!-- Dynamic Control Panel at Bottom -->
							{#if currentDataset && currentDataset.control_type === 'threshold-control'}
								<!-- Always show expanded Soil Carbon Depth Panel -->
								<div
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm {isFullscreen
										? 'z-[9999]'
										: 'z-10'}"
								>
									<!-- Depth Label -->
									<div class="flex items-center space-x-2">
										<div class="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-1">
											<div class="h-2 w-2 rounded-full bg-white"></div>
										</div>
										<span class="text-sm font-medium text-slate-700">Depth (g/kg)</span>
									</div>

									<!-- Separator -->
									<div class="h-4 w-px bg-slate-300"></div>

									<!-- Depth Options as Slider-like Radio Buttons -->
									<div class="flex items-center space-x-0.5 rounded-full bg-slate-100/80 p-1">
										{#if currentDataset.control_options}
											{#each currentDataset.control_options as option}
												<label class="relative cursor-pointer">
													<input
														type="radio"
														bind:group={soilCarbonDepth}
														value={option}
														class="peer sr-only"
													/>
													<div
														class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-green-600 peer-checked:hover:to-emerald-600 {soilCarbonDepth ===
														option
															? 'text-white'
															: 'text-slate-600'}"
													>
														{option}cm
													</div>
												</label>
											{/each}
										{/if}
									</div>
								</div>
							{/if}

							<!-- Legend Panel - Bottom Right INSIDE the map container -->
							{#if currentDataset && Object.keys(legendData).length > 0}
								<div class="absolute right-4 bottom-4 {isFullscreen ? 'z-[9999]' : 'z-10'}">
									<!-- Legend Toggle Button -->
									<button
										class="mb-2 flex w-full items-center justify-between rounded-lg border border-white/30 bg-white/95 p-2 text-sm shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl"
										onclick={() => (legendCollapsed = !legendCollapsed)}
									>
										<div class="flex items-center space-x-2">
											<List class="h-3.5 w-3.5 text-green-600" />
											{#if !legendCollapsed}
												<span class="font-medium text-slate-700">Legend</span>
											{/if}
										</div>
									</button>

									<!-- Legend Content -->
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
								<!-- {:else}
								<div class="flex h-80 items-center justify-center">
									<div class="text-center text-slate-500">
										<p class="text-sm">
											Select a question or information layer to view related charts
										</p>
									</div>
								</div> -->
							{/if}
						</div>
					</div>
				</div>

				<!-- Right part: Information Layer - Shows first on mobile/tablet -->
				<div class="order-1 w-full flex-shrink-0 lg:order-2 lg:w-75">
					<div
						class="top-6 flex-1 flex-col rounded-2xl border border-white/20 bg-white/70 p-4 lg:min-h-[calc(100vh-16rem)]"
					>
						<!-- Information Layer Header -->
						<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
							<div class="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-2">
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
												? 'border-green-300 bg-gradient-to-r from-green-50/90 to-emerald-50/90 shadow-md'
												: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80'}"
										>
											<button
												onclick={() => selectInformationLayer(layer.title)}
												class="flex w-full items-start space-x-2 p-4 text-left transition-all duration-200 hover:opacity-80"
											>
												<h4
													class="flex-1 text-sm font-medium {selectedInformationLayer ===
													layer.title
														? 'text-green-800'
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

											<!-- Expandable content -->
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
										<p class="text-xs">Select a question to view map layers</p>
									</div>
								</div>
							{/if}
						</div>

						<!-- Questions section - now empty, button moved to fixed position -->
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
					<div class="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-2">
						<Info class="h-3.5 w-3.5 text-white" />
					</div>
					<h3 class="text-base font-bold text-slate-800">Explore Questions</h3>
				</div>

				<div class="max-h-60 flex-1 space-y-3 overflow-y-auto">
					{#each questions as questionItem, index}
						<button
							class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
							questionItem.id
								? 'border-green-500 bg-green-50 shadow-md'
								: 'border-slate-200/50 bg-white/50 hover:border-green-300 hover:bg-green-50/70 hover:shadow-sm'}"
							onclick={() => selectQuestion(questionItem.id)}
						>
							<div class="flex items-start space-x-2">
								<div class="mt-1 flex-shrink-0">
									{#if selectedQuestionId === questionItem.id}
										<CheckCircle class="h-3.5 w-3.5 text-green-600" />
									{:else}
										<div
											class="h-3.5 w-3.5 rounded-full border-2 border-slate-300 group-hover:border-green-400"
										></div>
									{/if}
								</div>
								<p
									class="text-xs leading-relaxed {selectedQuestionId === questionItem.id
										? 'font-medium text-green-700'
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
			class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
			aria-label="Toggle questions panel"
		>
			<HelpCircle class="h-6 w-6" />
		</button>
	</div>
{/if}

<style>
	/* Ensure map containers resize properly */
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

	/* Force OpenLayers map to be responsive */
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

	/* Ensure flex children don't overflow */
	:global(.flex > *) {
		min-width: 0;
	}

	/* Fullscreen mode adjustments */
	:global(:fullscreen .map-container),
	:global(:-webkit-full-screen .map-container),
	:global(:-moz-full-screen .map-container),
	:global(:-ms-fullscreen .map-container) {
		position: relative !important;
		width: 100vw !important;
		height: 100vh !important;
		z-index: 9998 !important;
	}

	/* Ensure controls are visible in fullscreen */
	:global(:fullscreen .absolute),
	:global(:-webkit-full-screen .absolute),
	:global(:-moz-full-screen .absolute),
	:global(:-ms-fullscreen .absolute) {
		position: fixed !important;
		z-index: 9999 !important;
	}
</style>
