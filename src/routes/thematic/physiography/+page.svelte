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
		Mountain,
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

	let { currentTopic = 'physiography', width = '100%', height = '400px' } = $props();

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

	// Track questions panel state
	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Add new state variables for layers panel
	let layersPanelOpen = $state(false);
	let activeBaseLayers = $state({});

	// Basemap switcher state
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('dark-gray');
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
		{
			id: 'terrain',
			name: 'Terrain',
			url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			attribution: '© OpenStreetMap contributors, SRTM',
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

			if (currentDataset.control_type === 'simple' || currentDataset.control_type === 'none') {
				const layers = currentDataset.map_layers.default;
				layersToFetch = Array.isArray(layers) ? layers : [layers];
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
						name: 'Elevation',
						url: 'https://tethys.icimod.org:8443/geoserver/springs/wms',
						layerIndex: 'springs:elevation',
						mapserver: 'geoserver'
					}
				]
			},
			charts: []
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
						url: 'https://tethys.icimod.org:8443/geoserver/springs/wms',
						layerIndex: 'springs:Slope',
						mapserver: 'geoserver'
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
						url: 'https://tethys.icimod.org:8443/geoserver/springs/wms',
						layerIndex: 'springs:Aspect',
						mapserver: 'geoserver'
					}
				]
			},
			charts: []
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
			title: 'Elevation',
			dataset_id: 'elevation'
		},
		{
			id: 'map-indicator-2',
			title: 'Slope',
			dataset_id: 'slope'
		},
		{
			id: 'map-indicator-3',
			title: 'Aspect',
			dataset_id: 'aspect'
		}
	];

	// Track selected question - default to first question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection)
	let selectedInformationLayer = $state<string | null>('Elevation');

	// Get current dataset based on selected question or information layer
	let currentDataset = $derived.by(() => {
		// First priority: selected question
		if (selectedQuestionId) {
			const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
			if (selectedQuestion?.dataset_id) {
				return physiographyDataset.find((item) => item.id === selectedQuestion.dataset_id);
			}
		}

		// Second priority: selected information layer
		if (selectedInformationLayer) {
			const selectedLayer = information_layers.find(
				(layer) => layer.title === selectedInformationLayer
			);
			if (selectedLayer?.dataset_id) {
				return physiographyDataset.find((item) => item.id === selectedLayer.dataset_id);
			}
		}

		// Default: nothing selected, return null
		return null;
	});

	// Extract current data from dataset
	let currentCharts = $derived(currentDataset?.charts || []);

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
				resizeObserver.disconnect();
			};
		}
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

		console.log('Information layer selected:', layerId);
	}

	// Function to set specific layout state
	function setLayoutState(state: 'default' | 'hide-left' | 'left-full') {
		layoutState = state;

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
			// Create WMS layer (GeoServer)
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

	// Clear all physiography data layers (keep base map)
	function clearPhysiographyLayers() {
		if (!map) return;

		const layers = map.getLayers().getArray().slice();
		console.log('Clearing physiography layers. Total layers found:', layers.length);

		layers.forEach((layer) => {
			const layerId = layer.get('id');
			// Remove layers that have an ID (our custom layers), keep base layer
			if (layerId && map) {
				console.log('Removing layer with ID:', layerId);
				map.removeLayer(layer);
			}
		});

		console.log(
			'Physiography layers cleared. Remaining layers:',
			map.getLayers().getArray().length
		);
	}

	// Update layers based on current dataset
	function updateMapLayers() {
		if (!map) return;

		console.log('=== Starting updateMapLayers ===');
		console.log('Current dataset:', currentDataset?.id);
		console.log('Layers before clearing:', map.getLayers().getArray().length);

		// Always clear existing physiography layers first
		clearPhysiographyLayers();

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

		// For 'simple' or 'none' control type, show layers immediately
		if (currentDataset.control_type === 'simple' || currentDataset.control_type === 'none') {
			const layers = currentDataset.map_layers.default;
			if (layers) {
				if (Array.isArray(layers)) {
					console.log('Adding multiple layers:', layers.length);
					addMultipleLayers(layers);
				} else {
					console.log('Adding single layer:', layers.name);
					addWMSLayer(layers);
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
		// This will trigger when currentDataset changes
		const dataset = currentDataset;

		console.log(
			'Main effect triggered - Dataset:',
			dataset?.id || 'null',
			'Control type:',
			dataset?.control_type
		);

		// Only update map layers if we have a dataset
		if (dataset && map) {
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
			class="fixed top-[14rem] left-0 z-50 rounded-r-lg border border-l-0 border-slate-300 bg-white/50 p-1.5 text-slate-600 shadow-xl transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-2xl"
			title="Show Story Panel"
		>
			<ChevronsRight class="h-4 w-4" />
		</button>
	{/if}

	<!-- Left Sidebar - Story + Information -->
	<div
		class="sticky top-6 col-span-3 h-fit max-h-[calc(100vh-16rem)] flex-1 space-y-6 overflow-y-auto"
		class:hidden={layoutState === 'hide-left'}
		class:col-span-12={layoutState === 'left-full'}
	>
		<!-- Story Section -->
		<div class="rounded-2xl border border-white/20 bg-white/100 p-6">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="rounded-lg bg-gradient-to-r from-stone-500 to-amber-500 p-2">
						<Mountain class="h-5 w-5 text-white" />
					</div>
					<h3
						class="{layoutState === 'left-full'
							? 'text-2xl'
							: 'text-lg'} font-bold text-slate-800 transition-all duration-300"
					>
						Physiography of HKH
					</h3>
				</div>
				<div class="flex items-center space-x-2">
					{#if layoutState !== 'left-full'}
						<!-- Hide Left Panel Button -->
						<button
							onclick={() => setLayoutState('hide-left')}
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Hide Story Panel"
						>
							<ChevronsLeft class="h-4 w-4" />
						</button>
						<!-- Expand Story Button -->
						<button
							onclick={() => setLayoutState('left-full')}
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Expand Story"
						>
							<ChevronsRight class="h-4 w-4" />
						</button>
					{:else}
						<!-- Back to Default Button -->
						<button
							onclick={() => setLayoutState('default')}
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Back to Default"
						>
							<ChevronsLeft class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>

			<div
				class="{layoutState === 'left-full'
					? 'space-y-6'
					: 'space-y-4'} transition-all duration-300"
			>
				<!-- <p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-700 transition-all duration-300"
				>
					The Hindu Kush Himalaya (HKH) region is recognized as one of the world's most biodiverse
					mountain systems, harboring an extraordinary array of ecosystems from tropical forests to
					alpine meadows. This vast region spans across eight countries and encompasses 35
					biodiversity hotspots, making it a critical repository of global biological heritage. The
					HKH supports over 25,000 plant species, including numerous endemic varieties, and provides
					habitat for iconic wildlife such as snow leopards, Bengal tigers, one-horned rhinoceros,
					and countless bird species.
				</p>

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					However, these precious ecosystems face unprecedented threats from climate change, habitat
					fragmentation, and human encroachment. Rising temperatures are pushing species to higher
					altitudes, disrupting established ecological relationships and threatening the survival of
					cold-adapted species. Deforestation and land-use changes have fragmented critical wildlife
					corridors, isolating populations and reducing genetic diversity.
				</p>

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					The region's forests, which act as crucial carbon sinks and regulate water cycles, are
					under severe pressure from agricultural expansion, infrastructure development, and
					unsustainable harvesting practices. Wetlands and grasslands, equally important for
					biodiversity and ecosystem services, are being converted for agriculture and urban
					development at alarming rates.
				</p>

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Conservation efforts in the HKH require urgent, coordinated action across borders.
					Establishing and maintaining protected areas, creating wildlife corridors, and
					implementing sustainable land management practices are essential. Community-based
					conservation approaches that engage local populations as stewards of biodiversity have
					shown promising results. Additionally, scientific research and monitoring programs are
					crucial for understanding ecosystem dynamics and developing effective conservation
					strategies that can adapt to changing environmental conditions.
				</p> -->
			</div>
		</div>
	</div>

	<!-- Main Content Area - Unified container with common white background -->
	<div
		class="sticky col-span-9"
		class:col-span-12={layoutState === 'hide-left'}
		class:hidden={layoutState === 'left-full'}
	>
		<div class="rounded-2xl border border-white/20 bg-white p-6 shadow-xl backdrop-blur-sm">
			<div class="flex gap-6">
				<!-- Left part: Map and Charts -->
				<div
					class="flex min-w-0 flex-col gap-6 {layoutState === 'hide-left' ? 'flex-1' : 'flex-1'}"
				>
					<!-- Map Section -->
					<div
						class="relative h-[60vh] max-h-[800px] min-h-[500px] overflow-hidden rounded-xl border border-slate-200/30"
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
								<House class="h-4 w-4 text-slate-600" />
							</button>

							<!-- Basemap Switcher Button -->
							<button
								class="absolute top-10 right-2 z-20 rounded border border-slate-200/50 bg-white p-1 shadow hover:bg-gray-100 focus:outline focus:outline-1 focus:outline-black"
								onclick={() => (basemapPanelOpen = !basemapPanelOpen)}
								title="Change Basemap"
								aria-label="Change Basemap"
							>
								<MapIcon class="h-4 w-4 text-slate-600" />
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
									<ChevronsRight class="h-4 w-4" />
								{:else}
									<Layers class="h-4 w-4" />
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

							<!-- Legend Panel - Bottom Right INSIDE the map container -->
							{#if currentDataset && Object.keys(legendData).length > 0}
								<div class="absolute right-4 bottom-4 {isFullscreen ? 'z-[9999]' : 'z-10'}">
									<!-- Legend Toggle Button -->
									<button
										class="mb-2 flex w-full items-center justify-between rounded-lg border border-white/30 bg-white/95 p-2 text-sm shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl"
										onclick={() => (legendCollapsed = !legendCollapsed)}
									>
										<div class="flex items-center space-x-2">
											<List class="h-4 w-4 text-amber-600" />
											{#if !legendCollapsed}
												<span class="font-medium text-slate-700">Legend</span>
											{/if}
										</div>
									</button>

									<!-- Legend Content -->
									{#if !legendCollapsed}
										<div
											class="max-w-sm rounded-lg border border-white/30 bg-white/95 p-4 shadow-xl backdrop-blur-sm"
										>
											<div class="max-h-[200px] space-y-4 overflow-y-auto">
												{#each Object.keys(legendData) as uniqueKey}
													<div class="space-y-3">
														<h4 class="text-sm font-semibold text-slate-800">
															{legendData[uniqueKey].name}
														</h4>
														<div class="space-y-2">
															{#each legendData[uniqueKey].items as item}
																<div class="flex items-center space-x-3">
																	{#if item.imageData}
																		<img
																			src={item.imageData}
																			alt={item.label}
																			class="flex-shrink-0 object-contain"
																		/>
																	{:else if item.imageUrl}
																		<img
																			src={item.imageUrl}
																			alt={item.label}
																			class="flex-shrink-0 object-contain"
																		/>
																	{/if}
																	<!-- <span class="text-sm text-slate-700">{item.label}</span> -->
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
												subtitle="Hindu Kush Himalaya Region Ecosystem Data"
												chart_type={chart.chart_type}
											/>
										</div>
									{/each}
								</div>
							{:else}
								<!-- <div class="flex h-80 items-center justify-center">
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

				<!-- Right part: Information Layer -->
				<div class="w-80 flex-shrink-0">
					<div
						class=" top-6 min-h-[calc(100vh-16rem)] flex-1 flex-col rounded-2xl border border-white/20 bg-white/70 pr-4 pl-4"
					>
						<!-- Information Layer Header -->
						<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
							<div class="rounded-lg bg-gradient-to-r from-stone-500 to-amber-500 p-2">
								<Layers class="h-5 w-5 text-white" />
							</div>
							<h3 class="text-lg font-bold text-slate-800">Information Layer</h3>
						</div>

						<!-- Information Layer Content -->
						<div class="flex-1 overflow-y-auto">
							{#if information_layers && information_layers.length > 0}
								<div class="space-y-3">
									{#each information_layers as layer, index}
										<button
											onclick={() => selectInformationLayer(layer.title)}
											class="w-full rounded-lg border p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-md {selectedInformationLayer ===
											layer.title
												? 'border-stone-300 bg-gradient-to-r from-stone-50/90 to-amber-50/90 shadow-md'
												: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80 hover:border-slate-300/70 hover:bg-slate-100/90'}"
										>
											<div class="flex items-start space-x-3 text-left">
												<div class="flex-1">
													<h4
														class="text-sm font-medium {selectedInformationLayer === layer.title
															? 'text-stone-800'
															: 'text-slate-800'} mb-1"
													>
														{layer.title}
													</h4>
												</div>
											</div>
										</button>
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
					<div class="rounded-lg bg-gradient-to-r from-stone-500 to-amber-500 p-2">
						<Info class="h-4 w-4 text-white" />
					</div>
					<h3 class="text-base font-bold text-slate-800">Explore Questions</h3>
				</div>

				<div class="max-h-60 flex-1 space-y-3 overflow-y-auto">
					{#each questions as questionItem, index}
						<button
							class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
							questionItem.id
								? 'border-stone-500 bg-stone-50 shadow-md'
								: 'border-slate-200/50 bg-white/50 hover:border-stone-300 hover:bg-stone-50/70 hover:shadow-sm'}"
							onclick={() => selectQuestion(questionItem.id)}
						>
							<div class="flex items-start space-x-2">
								<div class="mt-1 flex-shrink-0">
									{#if selectedQuestionId === questionItem.id}
										<CheckCircle class="h-4 w-4 text-green-600" />
									{:else}
										<div
											class="h-4 w-4 rounded-full border-2 border-slate-300 group-hover:border-stone-400"
										></div>
									{/if}
								</div>
								<p
									class="text-xs leading-relaxed {selectedQuestionId === questionItem.id
										? 'font-medium text-stone-700'
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
			class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-stone-500 to-amber-500 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
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
