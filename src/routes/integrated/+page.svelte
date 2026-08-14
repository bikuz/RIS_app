<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import 'ol/ol.css';
	import lightMap from '$lib/assets/images/basemaps/light-map.png';
	import darkMap from '$lib/assets/images/basemaps/dark-map.png';
	import osmMap from '$lib/assets/images/basemaps/osm-map.png';
	import satelliteMap from '$lib/assets/images/basemaps/satellite-map.png';
	import terrainMap from '$lib/assets/images/basemaps/terrain-map.png';
	import {
		Search,
		CheckSquare,
		Square,
		Eye,
		EyeOff,
		Trash2,
		MapIcon,
		House,
		Layers,
		ChevronUp,
		ChevronDown,
		Sliders,
		GripVertical,
		Columns,
		List,
		SlidersHorizontal
	} from '@lucide/svelte';
	import { themes } from '$lib/data/themes';
	import { themeIcons } from '$lib/theme-icons';
	import { fitMapToHkhOutline, HKH_OUTLINE_CENTER } from '$lib/map/hkh-extent';
	import FullScreen from 'ol/control/FullScreen';
	import { defaults as defaultControls } from 'ol/control/defaults.js';
	import ImageLayer from 'ol/layer/Image';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import { allMapLayers } from './mapLayers.js';

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;
	
	// Swipe mode state
	let swipeMode = $state(false);
	let swipePosition = $state(50); // Percentage (0-100)
	let mapContainerRight: HTMLDivElement;
	let mapRight: Map | null = null;
	let baseMapLayerRight: TileLayer<any> | null = null;
	let isDraggingDivider = $state(false);

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

	// Basemap switcher state
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('light');
	let baseMapLayer: TileLayer<any> | null = null;

	// Layer panel state
	let layerPanelOpen = $state(false);
	
	// Basic overlay layers (like boundaries, outlines, etc.)
	const basicLayers = [
		{
			id: 'hkh-outline',
			name: 'HKH Outline',
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
			layerIndex: 0,
			mapserver: 'arcgis'
		}
	];
	
	// Track which basic layers are active
	let activeBasicLayers = $state<Set<string>>(new Set());
	let basicMapLayers = $state<Record<string, ImageLayer<any>>>({});

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
		
		// Also update right map basemap if swipe mode is active
		if (swipeMode && mapRight && baseMapLayerRight) {
			const newBaseMapLayerRight = new TileLayer({
				source: new XYZ({
					url: basemapConfig.url,
					attributions: basemapConfig.attribution
				}),
				zIndex: 0
			});
			
			const rightLayers = mapRight.getLayers();
			rightLayers.insertAt(0, newBaseMapLayerRight);
			mapRight.removeLayer(baseMapLayerRight);
			baseMapLayerRight = newBaseMapLayerRight;
		}
	}

	// Toggle basic overlay layer (like HKH outline)
	function toggleBasicLayer(layerId: string) {
		if (!map) return;

		const layerConfig = basicLayers.find((l) => l.id === layerId);
		if (!layerConfig) return;

		if (activeBasicLayers.has(layerId)) {
			// Remove layer from main map
			activeBasicLayers.delete(layerId);
			if (basicMapLayers[layerId]) {
				map.removeLayer(basicMapLayers[layerId]);
				delete basicMapLayers[layerId];
			}
			
			// Also remove from right map if swipe mode is active
			if (swipeMode && mapRight) {
				const rightLayers = mapRight.getLayers();
				const layersArray = rightLayers.getArray();
				for (let i = layersArray.length - 1; i >= 0; i--) {
					const layer = layersArray[i];
					// Check if it's an ImageLayer and has getSource method
					if (layer instanceof ImageLayer) {
						const source = layer.getSource();
						if (source && 'getUrl' in source) {
							const url = (source as any).getUrl();
							if (url === layerConfig.url) {
								mapRight.removeLayer(layer);
								break;
							}
						}
					}
				}
			}
		} else {
			// Add layer to main map
			activeBasicLayers.add(layerId);
			
			const layer = new ImageLayer({
				source: new ImageArcGISRest({
					url: layerConfig.url,
					params: {
						LAYERS: `show:${layerConfig.layerIndex}`,
						FORMAT: 'PNG32',
						TRANSPARENT: true
					}
				}),
				zIndex: 20, // Above all data layers (data layers use zIndex 10)
				opacity: 1,
				visible: true
			});

			// Insert at the end to ensure it's on top of all other layers
			const layers = map.getLayers();
			layers.push(layer);
			basicMapLayers[layerId] = layer;
			
			// Also add to right map if swipe mode is active
			if (swipeMode && mapRight) {
				const rightLayer = new ImageLayer({
					source: new ImageArcGISRest({
						url: layerConfig.url,
						params: {
							LAYERS: `show:${layerConfig.layerIndex}`,
							FORMAT: 'PNG32',
							TRANSPARENT: true
						}
					}),
					zIndex: 20,
					opacity: 1,
					visible: true
				});
				const rightLayers = mapRight.getLayers();
				rightLayers.push(rightLayer);
			}
		}
		
		activeBasicLayers = new Set(activeBasicLayers);
		basicMapLayers = { ...basicMapLayers };
	}
	
	// Initialize right map for swipe mode
	function initializeRightMap() {
		if (!mapContainerRight || !map) return;
		
		const initialBasemap = basemaps.find((b) => b.id === selectedBasemap);
		if (!initialBasemap) return;
		
		baseMapLayerRight = new TileLayer({
			source: new XYZ({
				url: initialBasemap.url,
				attributions: initialBasemap.attribution
			}),
			zIndex: 0
		});
		
		// Copy view from main map
		const mainView = map.getView();
		
		// Add active basic layers to right map
		const rightMapLayers: any[] = [baseMapLayerRight];
		for (const layerId of activeBasicLayers) {
			const layerConfig = basicLayers.find((l) => l.id === layerId);
			if (layerConfig) {
				const rightLayer = new ImageLayer({
					source: new ImageArcGISRest({
						url: layerConfig.url,
						params: {
							LAYERS: `show:${layerConfig.layerIndex}`,
							FORMAT: 'PNG32',
							TRANSPARENT: true
						}
					}),
					zIndex: 20, // Above all data layers
					opacity: 1,
					visible: true
				});
				rightMapLayers.push(rightLayer);
			}
		}
		
		mapRight = new Map({
			target: mapContainerRight,
			controls: defaultControls(),
			layers: rightMapLayers,
			// view: new View({
			// 	center: mainView.getCenter(),
			// 	zoom: mainView.getZoom(),
			// 	rotation: mainView.getRotation()
			// })
			view: mainView
		});
		
		// // Sync views - when main map moves, update right map
		// map.on('moveend', () => {
		// 	if (mapRight) {
		// 		const center = mainView.getCenter();
		// 		const zoom = mainView.getZoom();
		// 		if (center && zoom !== undefined) {
		// 			mapRight.getView().setCenter(center);
		// 			mapRight.getView().setZoom(zoom);
		// 		}
		// 	}
		// });
		
		// // Also sync from right to left (in case user interacts with right map)
		// const rightMapRef = mapRight;
		// if (rightMapRef) {
		// 	rightMapRef.on('moveend', () => {
		// 		if (map && mapRight) {
		// 			const rightView = mapRight.getView();
		// 			const center = rightView.getCenter();
		// 			const zoom = rightView.getZoom();
		// 			if (center && zoom !== undefined) {
		// 				map.getView().setCenter(center);
		// 				map.getView().setZoom(zoom);
		// 			}
		// 		}
		// 	});
		// }
		
		// Update layers based on current layerOrder
		updateSwipeLayers();
		
		// Ensure right map is properly sized (full width)
		setTimeout(() => {
			if (mapRight) {
				mapRight.updateSize();
				mapRight.render();
			}
		}, 50);
	}
	
	// Helper function to create a layer instance from layerPath
	function createLayerFromPath(layerPath: string): ImageLayer<any> | null {
		if (!mapLayers[layerPath]) return null;
		
		const existingLayer = mapLayers[layerPath];
		const source = existingLayer.getSource();
		
		// Create a new layer instance with the same source and properties
		const newLayer = new ImageLayer({
			source: source,
			zIndex: existingLayer.getZIndex(),
			opacity: existingLayer.getOpacity(),
			visible: existingLayer.getVisible()
		});
		
		newLayer.set('layerPath', layerPath);
		return newLayer;
	}
	
	// Update layers for swipe mode based on layerOrder
	function updateSwipeLayers() {
		if (!swipeMode || !map || !mapRight) return;
		
		const topLayerPath = layerOrder[0];
		const otherLayerPaths = layerOrder.slice(1);
		
		// Collect all layers that need to be moved
		const allLayerPaths = [topLayerPath, ...otherLayerPaths].filter(Boolean);
		
		// Remove all data layers from both maps first
		const leftLayers = map.getLayers();
		const rightLayers = mapRight.getLayers();
		
		const leftLayersToRemove: any[] = [];
		leftLayers.forEach((layer) => {
			if (layer.get('layerPath')) {
				leftLayersToRemove.push(layer);
			}
		});
		leftLayersToRemove.forEach((layer) => {
			if (map) map.removeLayer(layer);
		});
		
		const rightLayersToRemove: any[] = [];
		rightLayers.forEach((layer) => {
			if (layer.get('layerPath')) {
				rightLayersToRemove.push(layer);
			}
		});
		rightLayersToRemove.forEach((layer) => {
			if (mapRight) mapRight.removeLayer(layer);
		});
		
		// Add top layer to left map
		if (topLayerPath && mapLayers[topLayerPath]) {
			leftLayers.insertAt(1, mapLayers[topLayerPath]);
		}
		
		// Add all other layers to right map
		otherLayerPaths.forEach((layerPath) => {
			if (mapLayers[layerPath]) {
				rightLayers.insertAt(1, mapLayers[layerPath]);
			}
		});
		
		// Force render after layer updates
		setTimeout(() => {
			if (map) {
				map.updateSize();
				map.render();
			}
			if (mapRight) {
				mapRight.updateSize();
				mapRight.render();
			}
		}, 50);
	}
	
	// Toggle swipe mode
	function toggleSwipeMode() {
		swipeMode = !swipeMode;
		
		if (swipeMode) {
			// Enable swipe mode
			// Wait for DOM to update, then update map target and size
			setTimeout(() => {
				if (map && mapContainer) {
					// Update map target to the new container (in case it changed)
					map.setTarget(mapContainer);
					map.updateSize();
					map.render();
				}
			}, 50);
			
			setTimeout(() => {
				if (mapContainerRight) {
					initializeRightMap();
					// Update both map sizes after initialization
					setTimeout(() => {
						if (map) {
							map.updateSize();
							map.render();
						}
						if (mapRight) {
							mapRight.updateSize();
							mapRight.render();
						}
					}, 100);
				}
			}, 100);
		} else {
			// Disable swipe mode - restore all layers to main map
			if (mapRight && map) {
				// Get all layers from right map (except basemap)
				const rightLayers = mapRight.getLayers();
				const dataLayers: any[] = [];
				rightLayers.forEach((layer) => {
					if (layer.get('layerPath')) {
						dataLayers.push(layer);
					}
				});
				
				// Add all layers back to main map
				const mainLayers = map.getLayers();
				dataLayers.forEach((layer) => {
					mainLayers.insertAt(1, layer);
				});
				
				// Dispose right map
				mapRight.dispose();
				mapRight = null;
				baseMapLayerRight = null;
				
				// Update main map target and size
				setTimeout(() => {
					if (map && mapContainer) {
						map.setTarget(mapContainer);
						map.updateSize();
						map.render();
					}
				}, 100);
			}
		}
	}
	
	// Handle divider drag
	function handleDividerMouseDown(event: MouseEvent) {
		isDraggingDivider = true;
		event.preventDefault();
	}
	
	function handleDividerMouseMove(event: MouseEvent) {
		if (!isDraggingDivider || !mapContainer) return;
		
		// Get parent container (the overlay container) for accurate width calculation
		const parentContainer = mapContainer.parentElement;
		if (!parentContainer) return;
		
		const rect = parentContainer.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const percentage = (x / rect.width) * 100;
		
		// Clamp between 10% and 90%
		swipePosition = Math.max(10, Math.min(90, percentage));
		
		// No map size updates needed - both maps are full width, just clipping changes
	}
	
	function handleDividerMouseUp() {
		isDraggingDivider = false;
		// No map size updates needed - both maps are full width, just clipping changes
	}

	// Dataset management state
	let activeTab = $state<'available' | 'selected'>('available');
	let searchQuery = $state('');
	// Track selected layers: key is full path like "datasetId|nestedKey1|nestedKey2|layerIndex"
	let selectedLayers = $state<Set<string>>(new Set());
	let layerOrder = $state<string[]>([]); // Track order of layers as they're added
	let layerVisibility = $state<Record<string, boolean>>({});
	let layerOpacity = $state<Record<string, number>>({});
	let opacityPanelOpen = $state<Record<string, boolean>>({});
	let expandedGroups = $state<Set<string>>(new Set([ 'ecosystem'])); //'physiography', 'cryosphere'
	let expandedDatasets = $state<Set<string>>(new Set());
	let expandedNestedKeys = $state<Set<string>>(new Set());
	let draggedLayerIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let dropPosition = $state<'above' | 'below' | null>(null);

	// Helper function to get keys in insertion order (preserves order from source)
	function getKeysInOrder(obj: any): string[] {
		if (!obj || typeof obj !== 'object') return [];
		// Use Reflect.ownKeys to preserve insertion order
		return Reflect.ownKeys(obj).filter(key => typeof key === 'string') as string[];
	}

	// Helper function to check if map_layers has nested structure
	function hasNestedLayers(mapLayers: any): boolean {
		if (!mapLayers || typeof mapLayers !== 'object') return false;
		
		// Check if it's a direct layer object (has url and layerIndex/layer_id)
		if (mapLayers.url && (mapLayers.layerIndex !== undefined || mapLayers.layer_id !== undefined)) {
			return false;
		}
		
		// Check if it has default array
		if (Array.isArray(mapLayers.default)) {
			return mapLayers.default.length > 1 || Object.keys(mapLayers).length > 1;
		}
		
		// If it has multiple keys, it's nested
		return Object.keys(mapLayers).length > 1;
	}

	// Helper function to extract layer config from nested structure
	function extractLayerConfig(mapLayers: any, path: string[] = []): any {
		if (!mapLayers) return null;
		
		// Direct layer object
		if (mapLayers.url && (mapLayers.layerIndex !== undefined || mapLayers.layer_id !== undefined)) {
			return mapLayers;
		}
		
		// Array of layers
		if (Array.isArray(mapLayers)) {
			return mapLayers[0] || null;
		}
		
		// Object with nested structure - follow the path
		if (typeof mapLayers === 'object') {
			if (path.length === 0) {
				// No path specified, try to get default or first available
				if (mapLayers.default && Array.isArray(mapLayers.default)) {
					return mapLayers.default[0] || null;
				}
				// Get first key's value
				const firstKey = Object.keys(mapLayers)[0];
				if (firstKey) {
					return extractLayerConfig(mapLayers[firstKey], []);
				}
			} else {
				// Follow the path
				const [currentKey, ...rest] = path;
				if (mapLayers[currentKey]) {
					return extractLayerConfig(mapLayers[currentKey], rest);
				}
			}
		}
		
		return null;
	}

	// Get all datasets grouped by thematic area (preserving nested structure)
	const groupedDatasets = allMapLayers;

	// Flatten all datasets for search
	function getAllDatasetsFlat() {
		const flat: Array<{ id: string; title: string; thematicArea: string }> = [];
		for (const [thematicArea, datasets] of Object.entries(allMapLayers)) {
			if (Array.isArray(datasets)) {
				for (const dataset of datasets) {
					flat.push({
						id: dataset.id,
						title: (dataset as any).title || dataset.id,
						thematicArea
					});
				}
			}
		}
		return flat;
	}

	// Toggle group expansion
	function toggleGroup(groupId: string) {
		if (expandedGroups.has(groupId)) {
			expandedGroups.delete(groupId);
		} else {
			expandedGroups.add(groupId);
		}
		expandedGroups = new Set(expandedGroups);
	}

	// Toggle dataset expansion
	function toggleDataset(datasetId: string) {
		if (expandedDatasets.has(datasetId)) {
			expandedDatasets.delete(datasetId);
		} else {
			expandedDatasets.add(datasetId);
		}
		expandedDatasets = new Set(expandedDatasets);
	}

	// Toggle nested key expansion
	function toggleNestedKey(key: string) {
		if (expandedNestedKeys.has(key)) {
			expandedNestedKeys.delete(key);
		} else {
			expandedNestedKeys.add(key);
		}
		expandedNestedKeys = new Set(expandedNestedKeys);
	}

	// Map layers storage - key is full path
	let mapLayers = $state<Record<string, ImageLayer<any>>>({});
	
	// Store layer configs for legend fetching - key is full path
	let layerConfigs = $state<Record<string, { url: string; layerIndex: number; name: string; mapserver?: string }>>({});
	
	// Legend state management
	let legendData = $state<Record<string, { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }>>({});
	let legendCollapsed = $state(false);
	let leftLegendCollapsed = $state(false);
	let rightLegendCollapsed = $state(false);
	let legendFetchTimeout: ReturnType<typeof setTimeout> | null = null;

	// Define the order of thematic areas as they appear in mapLayers.js
	const thematicAreaOrder = ['basic_Layer', 'climate', 'ecosystem', 'cryosphere', 'physiography', 'human-dimensions'];

	// Get filtered datasets by group
	let filteredGroupedDatasets = $derived.by(() => {
		if (activeTab === 'selected') {
			return getSelectedLayersGrouped();
		}

		const filtered: Record<string, any[]> = {};
		const query = searchQuery.toLowerCase().trim();

		// Iterate in the order defined in mapLayers.js
		for (const groupId of thematicAreaOrder) {
			const datasets = (groupedDatasets as any)[groupId];
			if (Array.isArray(datasets)) {
				const filteredDatasets = query
					? datasets.filter((ds) => ((ds as any).title || ds.id).toLowerCase().includes(query))
					: datasets;
				
				if (filteredDatasets.length > 0) {
					filtered[groupId] = filteredDatasets;
				}
			}
		}

		return filtered;
	});

	// Get selected layers grouped
	function getSelectedLayersGrouped() {
		const grouped: Record<string, any[]> = {};
		
		for (const layerPath of selectedLayers) {
			const [datasetId, ...rest] = layerPath.split('|');
			
			// Find the dataset
			for (const [thematicArea, datasets] of Object.entries(allMapLayers)) {
				if (Array.isArray(datasets)) {
					const dataset = datasets.find(d => d.id === datasetId);
					if (dataset) {
						if (!grouped[thematicArea]) {
							grouped[thematicArea] = [];
						}
						if (!grouped[thematicArea].find(d => d.id === datasetId)) {
							grouped[thematicArea].push(dataset);
						}
						break;
					}
				}
			}
		}
		
		return grouped;
	}

	// Get currently displayed layer
	let currentLayer = $derived.by(() => {
		if (selectedLayers.size === 0) return null;
		
		const firstPath = Array.from(selectedLayers)[0];
		const [datasetId, ...pathParts] = firstPath.split('|');
		
		// Find the dataset
		for (const [, datasets] of Object.entries(allMapLayers)) {
			if (Array.isArray(datasets)) {
				const dataset = datasets.find(d => d.id === datasetId);
				if (dataset) {
					const layerConfig = extractLayerConfig(dataset.map_layers, pathParts);
					if (layerConfig) {
						return {
							id: datasetId,
							title: (dataset as any).title || datasetId,
							description: layerConfig.description || `${(dataset as any).title || datasetId} layer for the HKH region.`,
							url: layerConfig.url,
							layerIndex: layerConfig.layerIndex !== undefined ? layerConfig.layerIndex : layerConfig.layer_id,
							metadataUrl: 'https://rds.icimod.org/Home/DataDetail?metadataId=1972511'
						};
					}
				}
			}
		}
		
		return null;
	});

	// Toggle layer (add/remove)
	function toggleLayer(datasetId: string, path: string[] = [], layerConfig: any = null) {
		if (!map) return;

		const layerPath = [datasetId, ...path].join('|');
		
		if (selectedLayers.has(layerPath)) {
			// Remove layer
			selectedLayers.delete(layerPath);
			layerOrder = layerOrder.filter(path => path !== layerPath);
			delete layerVisibility[layerPath];

			if (mapLayers[layerPath]) {
				map.removeLayer(mapLayers[layerPath]);
				delete mapLayers[layerPath];
			}
		} else {
			// Add layer
			let dataset: any = null;
			if (!layerConfig) {
				// Find the dataset and extract layer config
				for (const [, datasets] of Object.entries(allMapLayers)) {
					if (Array.isArray(datasets)) {
						dataset = datasets.find(d => d.id === datasetId);
						if (dataset) {
							layerConfig = extractLayerConfig(dataset.map_layers, path);
							break;
						}
					}
				}
			} else {
				// Find dataset for title
				for (const [, datasets] of Object.entries(allMapLayers)) {
					if (Array.isArray(datasets)) {
						dataset = datasets.find(d => d.id === datasetId);
						if (dataset) break;
					}
				}
			}
			
			if (!layerConfig || !layerConfig.url) return;

			selectedLayers.add(layerPath);
			// Add to order array (new layers go to the end)
			layerOrder.push(layerPath);
			layerVisibility[layerPath] = true;
			// Set default opacity to 0.7 (70%) if not already set
			if (layerOpacity[layerPath] === undefined) {
				layerOpacity[layerPath] = 0.7;
			}

			// Create and add layer
			const layerIndex = layerConfig.layerIndex !== undefined ? layerConfig.layerIndex : layerConfig.layer_id;
			const layer = new ImageLayer({
				source: new ImageArcGISRest({
					url: layerConfig.url,
					params: {
						LAYERS: `show:${layerIndex}`,
						FORMAT: 'PNG32',
						TRANSPARENT: true
					}
				}),
				zIndex: 10,
				opacity: layerOpacity[layerPath] ?? 0.7,
				visible: true
			});

			layer.set('layerPath', layerPath);
			
			// Store layer config for legend fetching
			layerConfigs[layerPath] = {
				url: layerConfig.url,
				layerIndex: layerIndex,
				name: layerConfig.name || dataset?.title || datasetId,
				mapserver: layerConfig.mapserver || 'arcgis'
			};
			
			// Insert at index 1 to keep the first layer on top
			// If this is the first layer, just add it normally
			if (layerOrder.length === 1) {
				map.addLayer(layer);
			} else {
				const layers = map.getLayers();
				layers.insertAt(1, layer);
			}
			
			mapLayers[layerPath] = layer;
		}
		selectedLayers = new Set(selectedLayers);
		layerConfigs = { ...layerConfigs };
	}

	// Remove layer from map
	function removeLayer(layerPath: string) {
		if (!map) return;

		selectedLayers.delete(layerPath);
		layerOrder = layerOrder.filter(path => path !== layerPath);
		delete layerVisibility[layerPath];
		delete layerOpacity[layerPath];
		delete opacityPanelOpen[layerPath];

		if (mapLayers[layerPath]) {
			map.removeLayer(mapLayers[layerPath]);
			delete mapLayers[layerPath];
		}
		delete layerConfigs[layerPath];
		delete legendData[layerPath];
		selectedLayers = new Set(selectedLayers);
		layerConfigs = { ...layerConfigs };
		legendData = { ...legendData };
	}

	// Toggle layer visibility
	function toggleLayerVisibility(layerPath: string) {
		if (!mapLayers[layerPath]) return;
		const isVisible = !layerVisibility[layerPath];
		layerVisibility[layerPath] = isVisible;
		mapLayers[layerPath].setVisible(isVisible);
	}

	// Toggle opacity panel - only one panel open at a time
	function toggleOpacityPanel(layerPath: string) {
		const isCurrentlyOpen = opacityPanelOpen[layerPath];
		
		// Close all panels first
		opacityPanelOpen = {};
		
		// If the clicked panel wasn't open, open it now
		if (!isCurrentlyOpen) {
			opacityPanelOpen[layerPath] = true;
		}
		
		opacityPanelOpen = { ...opacityPanelOpen };
	}

	// Close opacity panel when clicking outside
	$effect(() => {
		const openPanelPath = Object.keys(opacityPanelOpen).find(path => opacityPanelOpen[path]);
		if (!openPanelPath) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			const opacityPanel = document.querySelector(`[data-opacity-panel="${openPanelPath}"]`);
			const opacityButton = document.querySelector(`[data-opacity-button="${openPanelPath}"]`);
			
			if (opacityPanel && opacityButton && openPanelPath) {
				if (!opacityPanel.contains(target) && !opacityButton.contains(target)) {
					opacityPanelOpen[openPanelPath] = false;
					opacityPanelOpen = { ...opacityPanelOpen };
				}
			}
		}

		// Add click listener when panel is open
		document.addEventListener('click', handleClickOutside);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Close layer and basemap panels when clicking outside
	$effect(() => {
		if (!layerPanelOpen && !basemapPanelOpen) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			const layerButton = document.querySelector('[data-layer-button]');
			const layerPanel = document.querySelector('[data-layer-panel]');
			const basemapButton = document.querySelector('[data-basemap-button]');
			const basemapPanel = document.querySelector('[data-basemap-panel]');
			
			if (layerPanelOpen && layerButton && layerPanel) {
				if (!layerPanel.contains(target) && !layerButton.contains(target)) {
					layerPanelOpen = false;
				}
			}
			
			if (basemapPanelOpen && basemapButton && basemapPanel) {
				if (!basemapPanel.contains(target) && !basemapButton.contains(target)) {
					basemapPanelOpen = false;
				}
			}
		}

		document.addEventListener('click', handleClickOutside);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Update layer opacity
	function updateLayerOpacity(layerPath: string, opacity: number) {
		if (!mapLayers[layerPath]) return;
		layerOpacity[layerPath] = opacity;
		mapLayers[layerPath].setOpacity(opacity);
		layerOpacity = { ...layerOpacity };
	}
	
	// Fetch legend data for selected layers
	async function fetchLegendData() {
		// Clear any existing timeout
		if (legendFetchTimeout) {
			clearTimeout(legendFetchTimeout);
		}
		
		// Debounce the legend fetch to prevent rapid requests
		legendFetchTimeout = setTimeout(async () => {
			// Clear legend data first
			legendData = {};
			
			// Fetch legend for each selected layer
			for (const layerPath of layerOrder) {
				const config = layerConfigs[layerPath];
				if (!config) continue;
				
				try {
					if (config.mapserver === 'arcgis') {
						const legendUrl = `${config.url}/legend?f=json`;
						const response = await fetch(legendUrl);
						const data = await response.json();
						
						const targetLayerId = parseInt(String(config.layerIndex));
						const layerLegend = data.layers?.find((l: any) => l.layerId === targetLayerId);
						
						if (layerLegend) {
							legendData[layerPath] = {
								name: config.name,
								items: layerLegend.legend.map((item: any) => ({
									label: item.label,
									imageData: `data:image/png;base64,${item.imageData}`
								}))
							};
						}
					} else {
						// Handle WMS/GeoServer layers
						const legendUrl = `${config.url}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${config.layerIndex}`;
						
						legendData[layerPath] = {
							name: config.name,
							items: [
								{
									label: config.name,
									imageUrl: legendUrl
								}
							]
						};
					}
				} catch (error) {
					console.error(`Error fetching legend for ${layerPath}:`, error);
				}
			}
			
			legendData = { ...legendData };
		}, 300); // 300ms debounce delay
	}

	// Throttle function to reduce rapid state updates
	let dragOverUpdatePending = false;
	// Store original element bounds to prevent flickering when element scales
	let originalElementBounds = $state<Record<number, { top: number; height: number }>>({});
	// Store last drop position to prevent rapid toggling
	let lastDropPosition = $state<{ index: number; position: 'above' | 'below' } | null>(null);
	
	// Drag and drop handlers for reordering layers
	function handleDragStart(index: number, event: DragEvent) {
		draggedLayerIndex = index;
		originalElementBounds = {};
		lastDropPosition = null;
		
		// Store original bounds for all elements before any transformations
		setTimeout(() => {
			const allItems = document.querySelectorAll('[role="listitem"]');
			allItems.forEach((item, idx) => {
				if (idx < layerOrder.length) {
					const itemRect = item.getBoundingClientRect();
					originalElementBounds[idx] = {
						top: itemRect.top,
						height: itemRect.height
					};
				}
			});
		}, 0);
		
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', String(index));
		}
	}

	function handleDragOver(index: number, event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		if (draggedLayerIndex !== null && draggedLayerIndex !== index) {
			// Use requestAnimationFrame to batch state updates and reduce flickering
			if (!dragOverUpdatePending) {
				dragOverUpdatePending = true;
				// Capture values before requestAnimationFrame
				const target = event.currentTarget as HTMLElement;
				const mouseY = event.clientY;
				
				requestAnimationFrame(() => {
					// Store original bounds on first dragOver if not already stored
					if (target && !originalElementBounds[index]) {
						const rect = target.getBoundingClientRect();
						originalElementBounds[index] = {
							top: rect.top,
							height: rect.height
						};
					}
					
					// Only update dragOverIndex if it actually changes
					if (dragOverIndex !== index) {
						dragOverIndex = index;
					}
					
					// Update drop position based on mouse position using original bounds
					// This prevents flickering when the element scales down
					if (target && originalElementBounds[index]) {
						const bounds = originalElementBounds[index];
						const centerY = bounds.top + bounds.height / 2;
						const distanceFromCenter = mouseY - centerY;
						
						// Use a threshold (8px) to create a dead zone near the center
						// This prevents rapid toggling when mouse is between original and scaled positions
						const threshold = 8;
						
						let newPosition: 'above' | 'below';
						if (Math.abs(distanceFromCenter) < threshold) {
							// In the dead zone - keep the last position if we have one
							if (lastDropPosition?.index === index) {
								newPosition = lastDropPosition.position;
							} else {
								// Default to 'below' if no previous position
								newPosition = 'below';
							}
						} else {
							// Outside dead zone - determine position normally
							newPosition = distanceFromCenter < 0 ? 'above' : 'below';
						}
						
						// Only update if position actually changes
						if (dropPosition !== newPosition) {
							dropPosition = newPosition;
							lastDropPosition = { index, position: newPosition };
						}
					}
					
					dragOverUpdatePending = false;
				});
			}
		}
	}

	function handleDragLeave() {
		// Use requestAnimationFrame to batch the state update
		requestAnimationFrame(() => {
			// Only clear if we're not currently dragging over another element
			// This prevents flickering when moving between elements
			if (dragOverIndex === null) {
				dropPosition = null;
				lastDropPosition = null;
			}
		});
	}

	function handleDrop(index: number, event: DragEvent) {
		event.preventDefault();
		dragOverIndex = null;
		dropPosition = null;

		if (draggedLayerIndex === null || draggedLayerIndex === index) {
			draggedLayerIndex = null;
			return;
		}

		// Reorder the layerOrder array
		const newOrder = [...layerOrder];
		const [draggedItem] = newOrder.splice(draggedLayerIndex, 1);
		newOrder.splice(index, 0, draggedItem);
		layerOrder = newOrder;

		// Update map layer order - reverse the UI order for map (map renders bottom to top)
		// UI shows top layer first, but map renders last layer on top
		// So UI index 0 (first in list) = map top (last position)
		// UI index N (last in list) = map bottom (first position after basemap)
		if (map) {
			const layers = map.getLayers();
			const draggedLayer = mapLayers[draggedItem];
			
			if (draggedLayer) {
				// Remove the dragged layer from its current position
				map.removeLayer(draggedLayer);
				
				// Get current layers after removal (basemap + remaining data layers)
				const currentLayers = layers.getArray();
				
				// Calculate target index: reverse the UI index
				// UI index 0 -> should be at end (top of map)
				// UI index (length-1) -> should be at position 1 (after basemap, bottom of map)
				const totalDataLayers = newOrder.length; // Includes the dragged item
				const reversedUIIndex = totalDataLayers - 1 - index;
				
				// Map index: basemap is at 0, so data layers start at 1
				// After removing dragged layer, we have (totalDataLayers - 1) data layers
				// reversedUIIndex 0 = bottom of map = index 1
				// reversedUIIndex (totalDataLayers-1) = top of map = index totalDataLayers
				// But since we removed one layer, the top is now at (currentLayers.length)
				const targetIndex = 1 + reversedUIIndex;
				
				// Ensure targetIndex doesn't exceed current layers length
				const safeTargetIndex = Math.min(targetIndex, currentLayers.length);
				
				// Insert the dragged layer at the target position
				layers.insertAt(safeTargetIndex, draggedLayer);
			}
		}

		draggedLayerIndex = null;
	}

	function handleDragEnd() {
		draggedLayerIndex = null;
		dragOverIndex = null;
		dropPosition = null;
		originalElementBounds = {};
		lastDropPosition = null;
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
				toggleBasicLayer('hkh-outline');
			}
		}, 100);
	}

	onMount(() => {
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
			
			// Also observe right map container when swipe mode is active
			const rightMapObserver = new ResizeObserver(() => {
				if (mapRight) {
					setTimeout(() => {
						if (mapRight) {
							mapRight.updateSize();
						}
					}, 100);
				}
			});
			
			// Watch for swipe mode changes to observe right map
			const checkSwipeMode = setInterval(() => {
				if (swipeMode && mapContainerRight) {
					try {
						rightMapObserver.observe(mapContainerRight);
					} catch (e) {
						// Already observing
					}
				} else {
					rightMapObserver.disconnect();
				}
			}, 500);

			return () => {
				clearInterval(checkSwipeMode);
				resizeObserver.disconnect();
				rightMapObserver.disconnect();
			};
		}
	});

	onDestroy(() => {
		if (fullscreenHandler) {
			document.removeEventListener('fullscreenchange', fullscreenHandler);
			document.removeEventListener('webkitfullscreenchange', fullscreenHandler);
			document.removeEventListener('mozfullscreenchange', fullscreenHandler);
			document.removeEventListener('MSFullscreenChange', fullscreenHandler);
			fullscreenHandler = null;
		}

		if (mapRight) {
			mapRight.dispose();
			mapRight = null;
		}

		if (map) {
			map.dispose();
		}
	});

	// Auto-add first dataset and hkh-outline on mount
	$effect(() => {
		if (map) {
			// Auto-add HKH outline layer
			if (!activeBasicLayers.has('hkh-outline')) {
				toggleBasicLayer('hkh-outline');
			}
			
			// Auto-add Land Cover dataset if available and no layers selected
			if (selectedLayers.size === 0) {
				const landCoverDataset = allMapLayers.ecosystem?.find((d: any) => d.id === 'land-cover-2022');
				if (landCoverDataset) {
					const layerConfig = extractLayerConfig(landCoverDataset.map_layers);
					if (layerConfig) {
						toggleLayer('land-cover-2022', [], layerConfig);
					}
				}
			}
		}
	});
	
	// Update swipe layers when layerOrder changes
	$effect(() => {
		if (swipeMode && layerOrder.length >= 0) {
			updateSwipeLayers();
		}
	});
	
	// Fetch legends when layerOrder or layerConfigs change
	$effect(() => {
		if (layerOrder.length > 0 && Object.keys(layerConfigs).length > 0) {
			fetchLegendData();
		} else {
			legendData = {};
		}
	});
	
	// Ensure HKH outline layer stays on top of all data layers
	$effect(() => {
		if (!map) return;
		
		// Watch layerOrder to ensure basic layers stay on top when data layers change
		const _ = layerOrder.length; // Trigger effect when layerOrder changes
		
		// Move all basic layers to the top whenever layerOrder changes
		const layers = map.getLayers();
		const layersArray = layers.getArray();
		
		for (const layerId of activeBasicLayers) {
			const basicLayer = basicMapLayers[layerId];
			if (basicLayer && layersArray.includes(basicLayer)) {
				// Remove from current position
				layers.remove(basicLayer);
				// Add to the end (top of stack)
				layers.push(basicLayer);
			}
		}
		
		// Also update right map if swipe mode is active
		if (swipeMode && mapRight) {
			const rightLayers = mapRight.getLayers();
			const rightLayersArray = rightLayers.getArray();
			
			for (const layerId of activeBasicLayers) {
				const layerConfig = basicLayers.find((l) => l.id === layerId);
				if (layerConfig) {
					// Find the matching layer in right map
					for (let i = rightLayersArray.length - 1; i >= 0; i--) {
						const layer = rightLayersArray[i];
						if (layer instanceof ImageLayer) {
							const source = layer.getSource();
							if (source && 'getUrl' in source) {
								const url = (source as any).getUrl();
								if (url === layerConfig.url) {
									// Remove from current position
									rightLayers.remove(layer);
									// Add to the end (top of stack)
									rightLayers.push(layer);
									break;
								}
							}
						}
					}
				}
			}
		}
	});
	
	// No map size updates needed when swipe position changes
	// Both maps are full width, only clipping changes via CSS
	
	// Watch swipeMode to ensure maps are properly initialized when mode changes
	$effect(() => {
		if (swipeMode && map && mapContainer) {
			// When swipe mode is enabled, ensure both maps are full width and properly initialized
			setTimeout(() => {
				if (map && mapContainer) {
					// Ensure map is pointing to the correct container
					map.setTarget(mapContainer);
					// Both maps should be full width - update size once to ensure proper rendering
					map.updateSize();
					map.render();
				}
				if (mapRight) {
					// Right map is also full width
					mapRight.updateSize();
					mapRight.render();
				}
			}, 150);
		} else if (!swipeMode && map && mapContainer) {
			// When swipe mode is disabled, ensure map target is correct
			setTimeout(() => {
				if (map && mapContainer) {
					map.setTarget(mapContainer);
					map.updateSize();
					map.render();
				}
			}, 150);
		}
	});
	
	// Add global mouse event listeners for divider dragging
	$effect(() => {
		if (isDraggingDivider) {
			const handleMouseMove = (e: MouseEvent) => handleDividerMouseMove(e);
			const handleMouseUp = () => handleDividerMouseUp();
			
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	});
</script>

<svelte:head>
	<title>Integrated Viewer | ICIMOD RIS</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col">
	<div class="shrink-0">
		<h1 class="text-[20px] font-semibold tracking-[-0.045em] text-[#0F3557] sm:text-[22px]">
			Integrated Viewer
		</h1>
		<p class="mt-1 max-w-2xl text-sm leading-6 text-[#64788B]">
			Combine layers from every theme on one map to compare patterns across the HKH.
		</p>
	</div>

	<div class="mt-3 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 lg:grid-cols-[0.7fr_2.4fr] lg:grid-rows-[minmax(0,1fr)]">
	<!-- Left Sidebar: Dataset Management -->
	<aside class="context-panel flex h-full min-h-0 flex-col overflow-hidden p-5" style="background-color: #EEF6FB">
		<div class="flex items-center justify-between border-b border-[#E0E7EE] pb-4">
			<div>
				<p class="chart-kicker">Viewer</p>
				<h2 class="mt-1 text-base font-semibold text-[#17324D]">Datasets</h2>
			</div>
			<span class="grid size-8 place-items-center rounded-lg bg-[#E8EEF4]">
				<SlidersHorizontal class="size-4 text-[#64788B]" />
			</span>
		</div>

		<div class="relative mt-4">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A9BAD]" />
			<input
				type="text"
				placeholder="Search datasets"
				bind:value={searchQuery}
				class="w-full rounded-lg border border-[#D8E1EA] bg-white py-2 pl-10 pr-4 text-sm text-[#17324D] placeholder:text-[#8A9BAD] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
			/>
		</div>

		<div class="mt-4 flex gap-2 border-b border-[#D8E1EA]">
			<button
				onclick={() => (activeTab = 'available')}
				class="flex-1 border-b-2 px-3 py-2 text-sm font-semibold transition-colors {activeTab ===
				'available'
					? 'border-[#2563EB] text-[#2563EB]'
					: 'border-transparent text-[#46637A] hover:text-[#17324D]'}"
			>
				Available
			</button>
			<button
				onclick={() => (activeTab = 'selected')}
				class="flex-1 border-b-2 px-3 py-2 text-sm font-semibold transition-colors {activeTab ===
				'selected'
					? 'border-[#2563EB] text-[#2563EB]'
					: 'border-transparent text-[#46637A] hover:text-[#17324D]'}"
			>
				Selected
			</button>
		</div>

				<!-- Dataset List -->
				<div class="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
					{#if activeTab === 'available'}
						{#each Object.entries(filteredGroupedDatasets) as [groupId, datasets]}
							{@const theme = themes.find((t) => t.slug === groupId)}
							{@const Icon = theme ? themeIcons[theme.icon] : Layers}
							{@const isExpanded = expandedGroups.has(groupId)}
							<div class="overflow-hidden rounded-xl border border-[#D8E1EA] bg-[#F3F7FA]">
								<!-- Group Header -->
								<button
									onclick={() => toggleGroup(groupId)}
									class="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[#F3F7FA]"
								>
									<div class="flex items-center gap-2">
										<Icon class="size-4 shrink-0 text-[#46637A]" strokeWidth={2} />
										<span class="text-sm font-semibold text-[#17324D]">{theme?.name ?? groupId}</span>
									</div>
									{#if isExpanded}
										<ChevronDown class="h-4 w-4 text-[#46637A]" />
									{:else}
										<ChevronUp class="h-4 w-4 text-[#46637A]" />
									{/if}
								</button>

								<!-- Group Datasets -->
								{#if isExpanded}
									<div class="border-t border-[#E0E7EE] p-2 space-y-1">
										{#each datasets as dataset}
											{@const hasNested = hasNestedLayers(dataset.map_layers)}
											{@const isDatasetExpanded = expandedDatasets.has(dataset.id)}
											<div class="rounded-lg border border-[#D8E1EA] bg-white">
												<!-- Dataset Header -->
												<button
													onclick={() => toggleDataset(dataset.id)}
													class="flex w-full items-center justify-between p-2.5 text-left transition-colors hover:bg-[#EEF6FB]"
												>
													<div class="flex items-center gap-2 flex-1 min-w-0">
														{#if hasNested}
															{#if isDatasetExpanded}
																<ChevronDown class="h-3.5 w-3.5 text-[#71869A] flex-shrink-0" />
															{:else}
																<ChevronUp class="h-3.5 w-3.5 text-[#71869A] flex-shrink-0" />
															{/if}
														{/if}
														<span class="text-sm font-medium text-[#17324D] truncate">{(dataset as any).title || dataset.id}</span>
													</div>
												</button>

												<!-- Nested Layers -->
												{#if hasNested && isDatasetExpanded}
													<div class="border-t border-[#D8E1EA] p-2 space-y-1">
														{#each getKeysInOrder(dataset.map_layers) as key}
															{@const value = dataset.map_layers[key]}
															{@const nestedKey = `${dataset.id}|${key}`}
															{@const isNestedExpanded = expandedNestedKeys.has(nestedKey)}
															{@const nestedValue = value}
															
															{#if Array.isArray(nestedValue) && nestedValue.length > 0}
																<!-- Array of layers -->
																{#if nestedValue.length === 1}
																	{@const layerConfig = nestedValue[0]}
																	{@const layerPath = `${dataset.id}|${key}`}
																	{@const isSelected = selectedLayers.has(layerPath)}
																	<div
																		class="group flex items-center gap-2 rounded-lg border border-[#D8E1EA] bg-white p-2 transition-all hover:border-[#93C5FD] hover:bg-[#EEF6FB] {isSelected
																			? 'border-[#2563EB] bg-[#DBEAFE]'
																			: ''}"
																	>
																		<button
																			onclick={() => toggleLayer(dataset.id, [key], layerConfig)}
																			class="flex-shrink-0 rounded p-1 text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
																			title={isSelected ? 'Remove from map' : 'Add to map'}
																		>
																			{#if isSelected}
																				<CheckSquare class="h-4.5 w-4.5 fill-[#2563EB] stroke-white stroke-[2]" />
																			{:else}
																				<Square class="h-4.5 w-4.5 stroke-[#8A9BAD] stroke-[1.5]" />
																			{/if}
																		</button>
																		<div 
																			class="flex-1 min-w-0 cursor-pointer"
																			onclick={() => toggleLayer(dataset.id, [key], layerConfig)}
																			onkeydown={(e) => e.key === 'Enter' && toggleLayer(dataset.id, [key], layerConfig)}
																			role="button"
																			tabindex="0"
																			title={isSelected ? 'Remove from map' : 'Add to map'}
																		>
																			<h5 class="truncate text-xs font-medium text-[#31506A]">{layerConfig.name || key}</h5>
																		</div>
																	</div>
																{:else}
																	<!-- Multiple layers in array - show as expandable -->
																	<button
																		onclick={() => toggleNestedKey(nestedKey)}
																		class="flex w-full items-center gap-2 rounded-lg border border-[#D8E1EA] bg-white p-2 text-left transition-colors hover:bg-[#F3F7FA]"
																	>
																		{#if isNestedExpanded}
																			<ChevronDown class="h-3 w-3 text-[#71869A]" />
																		{:else}
																			<ChevronUp class="h-3 w-3 text-[#71869A]" />
																		{/if}
																		<span class="text-xs font-medium text-[#31506A]">{key}</span>
																	</button>
																	{#if isNestedExpanded}
																		<div class="ml-4 space-y-1">
																			{#each nestedValue as layerConfig, idx}
																				{@const layerPath = `${dataset.id}|${key}|${idx}`}
																				{@const isSelected = selectedLayers.has(layerPath)}
																				<div
																					class="group flex items-center gap-2 rounded-lg border border-[#D8E1EA] bg-white p-1.5 transition-all hover:border-[#93C5FD] hover:bg-[#EEF6FB] {isSelected
																						? 'border-[#2563EB] bg-[#DBEAFE]'
																						: ''}"
																				>
																					<button
																						onclick={() => toggleLayer(dataset.id, [key, String(idx)], layerConfig)}
																						class="flex-shrink-0 rounded p-0.5 text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
																						title={isSelected ? 'Remove from map' : 'Add to map'}
																					>
																						{#if isSelected}
																							<CheckSquare class="h-4 w-4 fill-[#2563EB] stroke-white stroke-[2]" />
																						{:else}
																							<Square class="h-4 w-4 stroke-[#8A9BAD] stroke-[1.5]" />
																						{/if}
																					</button>
																					<div 
																						class="flex-1 min-w-0 cursor-pointer"
																						onclick={() => toggleLayer(dataset.id, [key, String(idx)], layerConfig)}
																						onkeydown={(e) => e.key === 'Enter' && toggleLayer(dataset.id, [key, String(idx)], layerConfig)}
																						role="button"
																						tabindex="0"
																						title={isSelected ? 'Remove from map' : 'Add to map'}
																					>
																						<h6 class="truncate text-xs text-[#46637A]">{layerConfig.name || `${key} - ${idx + 1}`}</h6>
																					</div>
																				</div>
																			{/each}
																		</div>
																	{/if}
																{/if}
															{:else if typeof nestedValue === 'object' && nestedValue !== null}
																<!-- Nested object structure (e.g., overall/significant -> annual/spring) -->
																<button
																	onclick={() => toggleNestedKey(nestedKey)}
																	class="flex w-full items-center gap-2 rounded-lg border border-[#D8E1EA] bg-white p-2 text-left transition-colors hover:bg-[#F3F7FA]"
																>
																	{#if isNestedExpanded}
																		<ChevronDown class="h-3 w-3 text-[#71869A]" />
																	{:else}
																		<ChevronUp class="h-3 w-3 text-[#71869A]" />
																	{/if}
																	<span class="text-xs font-medium text-[#31506A] capitalize">{key}</span>
																</button>
																{#if isNestedExpanded}
																	<div class="ml-4 space-y-1">
																		{#each getKeysInOrder(nestedValue) as subKey}
																			{@const subValue = nestedValue[subKey]}
																			{@const subNestedKey = `${nestedKey}|${subKey}`}
																			{@const isSubExpanded = expandedNestedKeys.has(subNestedKey)}
																			
																			{#if Array.isArray(subValue) && subValue.length > 0}
																				{@const layerConfig = subValue[0]}
																				{@const layerPath = `${dataset.id}|${key}|${subKey}`}
																				{@const isSelected = selectedLayers.has(layerPath)}
																				<div
																					class="group flex items-center gap-2 rounded-lg border border-[#D8E1EA] bg-white p-1.5 transition-all hover:border-[#93C5FD] hover:bg-[#EEF6FB] {isSelected
																						? 'border-[#2563EB] bg-[#DBEAFE]'
																						: ''}"
																				>
																					<button
																						onclick={() => toggleLayer(dataset.id, [key, subKey], layerConfig)}
																						class="flex-shrink-0 rounded p-0.5 text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
																						title={isSelected ? 'Remove from map' : 'Add to map'}
																					>
																						{#if isSelected}
																							<CheckSquare class="h-4 w-4 fill-[#2563EB] stroke-white stroke-[2]" />
																						{:else}
																							<Square class="h-4 w-4 stroke-[#8A9BAD] stroke-[1.5]" />
																						{/if}
																					</button>
																					<div 
																						class="flex-1 min-w-0 cursor-pointer"
																						onclick={() => toggleLayer(dataset.id, [key, subKey], layerConfig)}
																						onkeydown={(e) => e.key === 'Enter' && toggleLayer(dataset.id, [key, subKey], layerConfig)}
																						role="button"
																						tabindex="0"
																						title={isSelected ? 'Remove from map' : 'Add to map'}
																					>
																						<h6 class="truncate text-xs text-[#46637A] capitalize">{layerConfig.name || subKey}</h6>
																					</div>
																				</div>
																			{/if}
																		{/each}
																	</div>
																{/if}
															{:else if nestedValue && typeof nestedValue === 'object' && (nestedValue as any).url}
																<!-- Direct layer object -->
																{@const layerPath = `${dataset.id}|${key}`}
																{@const isSelected = selectedLayers.has(layerPath)}
																<div
																	class="group flex items-center gap-2 rounded-lg border border-[#D8E1EA] bg-white p-2 transition-all hover:border-[#93C5FD] hover:bg-[#EEF6FB] {isSelected
																		? 'border-[#2563EB] bg-[#DBEAFE]'
																		: ''}"
																>
																	<button
																		onclick={() => toggleLayer(dataset.id, [key], nestedValue)}
																		class="flex-shrink-0 rounded p-1 text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
																		title={isSelected ? 'Remove from map' : 'Add to map'}
																	>
																		{#if isSelected}
																			<CheckSquare class="h-4.5 w-4.5 fill-[#2563EB] stroke-white stroke-[2]" />
																		{:else}
																			<Square class="h-4.5 w-4.5 stroke-[#8A9BAD] stroke-[1.5]" />
																		{/if}
																	</button>
																	<div 
																		class="flex-1 min-w-0 cursor-pointer"
																		onclick={() => toggleLayer(dataset.id, [key], nestedValue)}
																		onkeydown={(e) => e.key === 'Enter' && toggleLayer(dataset.id, [key], nestedValue)}
																		role="button"
																		tabindex="0"
																		title={isSelected ? 'Remove from map' : 'Add to map'}
																	>
																		<h5 class="truncate text-xs font-medium text-[#31506A]">{(nestedValue as any).name || key}</h5>
																	</div>
																</div>
															{/if}
														{/each}
													</div>
												{:else if !hasNested}
													<!-- No nested layers - show as direct layer -->
													{@const layerConfig = extractLayerConfig(dataset.map_layers)}
													{#if layerConfig}
														{@const layerPath = dataset.id}
														{@const isSelected = selectedLayers.has(layerPath)}
														<div
															class="group flex items-center gap-2 rounded-lg border border-[#D8E1EA] bg-white p-2 transition-all hover:border-[#93C5FD] hover:bg-[#EEF6FB] {isSelected
																? 'border-[#2563EB] bg-[#DBEAFE]'
																: ''}"
														>
															<button
																onclick={() => toggleLayer(dataset.id, [], layerConfig)}
																class="flex-shrink-0 rounded p-1 text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
																title={isSelected ? 'Remove from map' : 'Add to map'}
															>
																{#if isSelected}
																	<CheckSquare class="h-4.5 w-4.5 fill-[#2563EB] stroke-white stroke-[2]" />
																{:else}
																	<Square class="h-4.5 w-4.5 stroke-[#8A9BAD] stroke-[1.5]" />
																{/if}
															</button>
															<div 
																class="flex-1 min-w-0 cursor-pointer"
																onclick={() => toggleLayer(dataset.id, [], layerConfig)}
																onkeydown={(e) => e.key === 'Enter' && toggleLayer(dataset.id, [], layerConfig)}
																role="button"
																tabindex="0"
																title={isSelected ? 'Remove from map' : 'Add to map'}
															>
																<h5 class="truncate text-xs font-medium text-[#31506A]">{(layerConfig as any).name || (dataset as any).title || dataset.id}</h5>
															</div>
														</div>
													{/if}
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					{:else}
						<!-- Selected Layers Tab - Display in order they were added -->
						<!-- Swipe Mode Toggle Button -->
						<div class="mb-4">
							<button
								class="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D8E1EA] bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#F3F7FA] {swipeMode ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]' : 'text-[#31506A]'}"
								onclick={toggleSwipeMode}
								title={swipeMode ? 'Stop Swipe Mode' : 'Start Swipe Mode'}
							>
								<Columns class="h-4 w-4" />
								<span>{swipeMode ? 'Stop Swipe' : 'Start Swipe'}</span>
							</button>
						</div>
						
						{#each layerOrder as layerPath, index}
							{@const [datasetId, ...pathParts] = layerPath.split('|')}
							{@const dataset = (() => {
								for (const [, datasets] of Object.entries(allMapLayers)) {
									if (Array.isArray(datasets)) {
										const found = datasets.find(d => d.id === datasetId);
										if (found) return found;
									}
								}
								return null;
							})()}
							{#if dataset}
								{@const layerConfig = extractLayerConfig(dataset.map_layers, pathParts)}
								{#if layerConfig}
									<div 
										class="relative {dragOverIndex === index && draggedLayerIndex !== null && draggedLayerIndex !== index ? 'mt-4' : ''}"
										role="listitem"
										ondragover={(e) => handleDragOver(index, e)}
										ondragleave={handleDragLeave}
										ondrop={(e) => handleDrop(index, e)}
										ondragend={handleDragEnd}
									>
										<!-- Drop indicator line above -->
										{#if dragOverIndex === index && draggedLayerIndex !== null && draggedLayerIndex !== index && dropPosition === 'above'}
											<div class="absolute -top-2 left-0 right-0 h-1 bg-[#2563EB] border-2 border-dashed border-[#2563EB] rounded-full z-20 shadow-lg"></div>
										{/if}
										
										<!-- Drop indicator line below -->
										{#if dragOverIndex === index && draggedLayerIndex !== null && draggedLayerIndex !== index && dropPosition === 'below'}
											<div class="absolute -bottom-2 left-0 right-0 h-1 bg-[#2563EB] border-2 border-dashed border-[#2563EB] rounded-full z-20 shadow-lg"></div>
										{/if}
										
										<div
											class="group flex items-center gap-2 rounded-lg border bg-white p-3 {dragOverIndex === index && draggedLayerIndex !== null && draggedLayerIndex !== index ? 'border-[#2563EB] border-2 border-dashed bg-[#DBEAFE]/50 shadow-xl scale-[0.95] ring-2 ring-[#BFDBFE]' : 'border-[#D8E1EA]'} {draggedLayerIndex === index ? 'opacity-50 cursor-grabbing' : ''} {draggedLayerIndex === null ? 'transition-colors hover:border-[#93C5FD] hover:shadow-md' : ''}"
											style="will-change: transform, opacity;"
										>
											<!-- Drag Handle -->
											<div 
												class="flex-shrink-0 cursor-move text-[#8A9BAD] hover:text-[#46637A]"
												role="button"
												tabindex="0"
												draggable="true"
												ondragstart={(e) => {
													// Only allow drag from the handle
													handleDragStart(index, e);
												}}
											>
												<GripVertical class="h-5 w-5" />
											</div>
											<div class="flex-1 min-w-0">
												<h4 class="truncate text-sm font-medium text-[#17324D]">{(dataset as any).title || dataset.id}</h4>
													{#if pathParts.length > 0}
														<p class="truncate text-xs text-[#71869A]">{pathParts.join(' → ')}</p>
													{/if}
												</div>
												<div class="flex items-center gap-1 {draggedLayerIndex !== null ? 'pointer-events-none opacity-40' : ''}">
													<button
														onclick={() => toggleLayerVisibility(layerPath)}
														disabled={draggedLayerIndex !== null}
														class="rounded p-1.5 text-[#46637A] transition-colors hover:bg-[#EEF6FB] disabled:opacity-40 disabled:cursor-not-allowed"
														title={layerVisibility[layerPath] !== false ? 'Hide layer' : 'Show layer'}
													>
														{#if layerVisibility[layerPath] !== false}
															<Eye class="h-4 w-4" />
														{:else}
															<EyeOff class="h-4 w-4" />
														{/if}
													</button>
													<button
														data-opacity-button={layerPath}
														onclick={() => toggleOpacityPanel(layerPath)}
														disabled={draggedLayerIndex !== null}
														ondragstart={(e) => e.stopPropagation()}
														ondrag={(e) => e.stopPropagation()}
														ondragover={(e) => e.stopPropagation()}
														class="rounded p-1.5 text-[#46637A] transition-colors hover:bg-[#EEF6FB] {opacityPanelOpen[layerPath] ? 'bg-[#DBEAFE] text-[#2563EB]' : ''} disabled:opacity-40 disabled:cursor-not-allowed"
														title="Adjust opacity"
													>
														<Sliders class="h-4 w-4" />
													</button>
													<button
														onclick={() => removeLayer(layerPath)}
														disabled={draggedLayerIndex !== null}
														class="rounded p-1.5 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
														title="Remove from map"
													>
														<Trash2 class="h-4 w-4" />
													</button>
												</div>
											</div>
											
											<!-- Opacity Slider Panel -->
											{#if opacityPanelOpen[layerPath]}
												{@const currentOpacity = layerOpacity[layerPath] ?? 0.7}
												<div 
													data-opacity-panel={layerPath}
													role="group"
													class="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-[#D8E1EA] bg-white p-3 shadow-lg"
													ondragstart={(e) => e.stopPropagation()}
													ondrag={(e) => e.stopPropagation()}
													ondragover={(e) => e.stopPropagation()}
													ondragenter={(e) => e.stopPropagation()}
													ondragleave={(e) => e.stopPropagation()}
													ondrop={(e) => e.stopPropagation()}
												>
													<div class="mb-2 flex items-center justify-between">
														<span class="text-xs font-medium text-[#31506A]">Opacity</span>
														<span class="text-xs text-[#46637A]">{Math.round(currentOpacity * 100)}%</span>
													</div>
													<input
														type="range"
														min="0"
														max="1"
														step="0.01"
														value={currentOpacity}
														oninput={(e) => updateLayerOpacity(layerPath, parseFloat(e.currentTarget.value))}
														ondragstart={(e) => e.stopPropagation()}
														ondrag={(e) => e.stopPropagation()}
														ondragover={(e) => e.stopPropagation()}
														class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E5EDF3] accent-[#2563EB]"
													/>
												</div>
											{/if}
										</div>
									{/if}
							{/if}
						{/each}

						{#if selectedLayers.size === 0}
							<div class="py-8 text-center text-sm text-[#71869A]">
								<p>No layers selected</p>
							</div>
						{/if}
					{/if}

					{#if activeTab === 'available' && Object.keys(filteredGroupedDatasets).length === 0}
						<div class="py-8 text-center text-sm text-[#71869A]">
							<p>No datasets found</p>
						</div>
					{/if}
				</div>
	</aside>

		<!-- Main Map Area -->
		<div class="relative h-full min-h-0">
			<div class="map-frame h-full">
				<div class="map-container relative flex h-full min-h-0 flex-col">
					<div class="relative min-h-0 flex-1 overflow-hidden rounded-[10px]">
					{#if swipeMode}
						<!-- Swipe Mode: Overlay View with Clipping -->
						<div class="relative h-full w-full">
							<!-- Right Map (Other Layers) - Full width, behind -->
							<div
								bind:this={mapContainerRight}
								class="absolute inset-0 h-full w-full"
							></div>
							
							<!-- Left Map (Top Layer) - Full width, clipped from right -->
							<div
								bind:this={mapContainer}
								class="absolute inset-0 h-full w-full z-10"
								style="clip-path: inset(0 {100 - swipePosition}% 0 0);"
							></div>
							
							<!-- Divider -->
							<button
								type="button"
								class="absolute top-0 bottom-0 w-12 cursor-col-resize z-30 flex items-center justify-center border-0 p-0 overflow-visible"
								style="left: {swipePosition}%; transform: translateX(-50%);"
								onmousedown={handleDividerMouseDown}
								aria-label="Drag to adjust swipe position"
								title="Drag to adjust swipe position"
							>
								<!-- Visible divider line -->
								<div class="absolute top-0 bottom-0 w-0.5 bg-black pointer-events-none z-0"></div>
								<!-- Holder with dots -->
								<div class="relative w-4 h-12 bg-[#0F3557] rounded flex items-center justify-center shadow-lg pointer-events-none z-10">
									<div class="flex flex-col gap-1.5">
										<div class="w-1 h-1 bg-white/80 rounded-full"></div>
										<div class="w-1 h-1 bg-white/80 rounded-full"></div>
										<div class="w-1 h-1 bg-white/80 rounded-full"></div>
									</div>
								</div>
							</button>
						</div>
					{:else}
						<!-- Normal Mode: Single Map -->
						<div
							bind:this={mapContainer}
							class="h-full w-full relative"
						></div>
					{/if}

					<button
						class="map-btn absolute top-3 left-[52px] z-20"
						onclick={() => {
							fitMapToHkhOutline(map, 300);
							fitMapToHkhOutline(mapRight, 300);
						}}
						title="Reset to Home View"
					>
						<House class="size-4" />
					</button>

					<button
						data-basemap-button
						class="map-btn absolute top-3 right-[52px] z-20"
						onclick={() => {
							basemapPanelOpen = !basemapPanelOpen;
							if (basemapPanelOpen) layerPanelOpen = false;
						}}
						title="Change Basemap"
					>
						<MapIcon class="size-4" />
					</button>

					{#if basemapPanelOpen}
						<div
							data-basemap-panel
							class="absolute top-14 right-[52px] z-20 w-48 overflow-hidden rounded-xl border border-[#D8E1EA] bg-white shadow-lg"
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
					{/if}

					<button
						data-layer-button
						class="map-btn absolute top-[52px] right-3 z-20"
						onclick={() => {
							layerPanelOpen = !layerPanelOpen;
							if (layerPanelOpen) basemapPanelOpen = false;
						}}
						title="Toggle Layers"
					>
						<Layers class="size-4" />
					</button>

					<!-- Layer Panel -->
					{#if layerPanelOpen}
						<div
							data-layer-panel
							class="absolute top-[92px] right-3 z-20 w-56 overflow-hidden rounded-xl border border-[#D8E1EA] bg-white shadow-lg"
						>
							<div class="p-3">
								<h3 class="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#46637A]">Layers</h3>
								<div class="space-y-1">
									{#each basicLayers as layer}
										{@const isActive = activeBasicLayers.has(layer.id)}
										<button
											class="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors {isActive
												? 'bg-[#DBEAFE] font-semibold text-[#2563EB]'
												: 'text-[#31506A] hover:bg-[#EEF6FB]'}"
											onclick={() => toggleBasicLayer(layer.id)}
										>
											<div class="flex items-center gap-2 flex-1">
												{#if isActive}
													<CheckSquare class="h-4 w-4 fill-[#2563EB] stroke-white stroke-[1.5] flex-shrink-0" />
												{:else}
													<Square class="h-4 w-4 stroke-[#8A9BAD] stroke-[1.5] flex-shrink-0" />
												{/if}
												<span class="flex-1">{layer.name}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
					
					<!-- Legend Panel(s) -->
					{#if layerOrder.some(path => legendData[path] && layerVisibility[path] !== false)}
						{#if swipeMode}
							<!-- Swipe Mode: Two separate legends -->
							<!-- Left Map Legend (Top Layer) -->
							{#if layerOrder[0] && legendData[layerOrder[0]] && layerVisibility[layerOrder[0]] !== false}
								{@const topLayerPath = layerOrder[0]}
								{@const topLegend = legendData[topLayerPath]}
								<div
									class="pointer-events-none absolute inset-0 z-20"
									style="clip-path: inset(0 {100 - swipePosition}% 0 0);"
								>
									<div
										class="pointer-events-auto absolute bottom-2 left-2 w-56 max-h-[50vh] overflow-hidden rounded-xl border border-[#D8E1EA] bg-white shadow-lg"
									>
									<!-- Legend Header -->
									<button
										class="flex w-full items-center justify-between p-3 text-left hover:bg-[#F3F7FA] transition-colors"
										onclick={() => (leftLegendCollapsed = !leftLegendCollapsed)}
									>
										<div class="flex items-center gap-2">
											<List class="h-4 w-4 text-[#46637A]" />
											<h3 class="text-sm font-semibold text-[#17324D]">Left Map</h3>
										</div>
										{#if leftLegendCollapsed}
											<ChevronUp class="h-4 w-4 text-[#46637A]" />
										{:else}
											<ChevronDown class="h-4 w-4 text-[#46637A]" />
										{/if}
									</button>
									
									{#if !leftLegendCollapsed}
										<div class="max-h-[calc(50vh-3.5rem)] overflow-y-auto border-t border-[#E0E7EE]">
											<div class="p-3">
												<h4 class="mb-2 text-xs font-semibold text-[#31506A]">{topLegend.name}</h4>
												<div class="space-y-1.5">
													{#each topLegend.items as item}
														<div class="flex items-center gap-2">
															{#if item.imageData}
																<img
																	src={item.imageData}
																	alt={item.label}
																	class="h-4 w-4 flex-shrink-0"
																/>
															{:else if item.imageUrl}
																<img
																	src={item.imageUrl}
																	alt={item.label}
																	class="h-4 w-4 flex-shrink-0"
																	onerror={(e) => {
																		(e.target as HTMLImageElement).style.display = 'none';
																	}}
																/>
															{/if}
															<span class="text-xs text-[#46637A]">{item.label}</span>
														</div>
													{/each}
												</div>
											</div>
										</div>
									{/if}
									</div>
								</div>
							{/if}
							
							<!-- Right Map Legend (Other Layers) -->
							{@const otherLayers = layerOrder.slice(1).filter(path => legendData[path] && layerVisibility[path] !== false)}
							{#if otherLayers.length > 0}
								<div
									class="pointer-events-none absolute inset-0 z-20"
									style="clip-path: inset(0 0 0 {swipePosition}%);"
								>
									<div
										class="pointer-events-auto absolute bottom-2 right-2 w-56 max-h-[50vh] overflow-hidden rounded-xl border border-[#D8E1EA] bg-white shadow-lg"
									>
									<!-- Legend Header -->
									<button
										class="flex w-full items-center justify-between p-3 text-left hover:bg-[#F3F7FA] transition-colors"
										onclick={() => (rightLegendCollapsed = !rightLegendCollapsed)}
									>
										<div class="flex items-center gap-2">
											<List class="h-4 w-4 text-[#46637A]" />
											<h3 class="text-sm font-semibold text-[#17324D]">Right Map</h3>
										</div>
										{#if rightLegendCollapsed}
											<ChevronUp class="h-4 w-4 text-[#46637A]" />
										{:else}
											<ChevronDown class="h-4 w-4 text-[#46637A]" />
										{/if}
									</button>
									
									{#if !rightLegendCollapsed}
										<div class="max-h-[calc(50vh-3.5rem)] overflow-y-auto border-t border-[#E0E7EE]">
											{#each otherLayers as layerPath}
												{@const legend = legendData[layerPath]}
												<div class="border-b border-[#E0E7EE] last:border-b-0">
													<div class="p-3">
														<h4 class="mb-2 text-xs font-semibold text-[#31506A]">{legend.name}</h4>
														<div class="space-y-1.5">
															{#each legend.items as item}
																<div class="flex items-center gap-2">
																	{#if item.imageData}
																		<img
																			src={item.imageData}
																			alt={item.label}
																			class="h-4 w-4 flex-shrink-0"
																		/>
																	{:else if item.imageUrl}
																		<img
																			src={item.imageUrl}
																			alt={item.label}
																			class="h-4 w-4 flex-shrink-0"
																			onerror={(e) => {
																				(e.target as HTMLImageElement).style.display = 'none';
																			}}
																		/>
																	{/if}
																	<span class="text-xs text-[#46637A]">{item.label}</span>
																</div>
															{/each}
														</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
									</div>
								</div>
							{/if}
						{:else}
							<!-- Normal Mode: Single legend -->
							<div
								class="absolute bottom-2 left-2 z-20 w-64 max-h-[60vh] overflow-hidden rounded-xl border border-[#D8E1EA] bg-white shadow-lg"
							>
								<!-- Legend Header -->
								<button
									class="flex w-full items-center justify-between p-3 text-left hover:bg-[#F3F7FA] transition-colors"
									onclick={() => (legendCollapsed = !legendCollapsed)}
								>
									<div class="flex items-center gap-2">
										<List class="h-4 w-4 text-[#46637A]" />
										<h3 class="text-sm font-semibold text-[#17324D]">Legends</h3>
									</div>
									{#if legendCollapsed}
										<ChevronUp class="h-4 w-4 text-[#46637A]" />
									{:else}
										<ChevronDown class="h-4 w-4 text-[#46637A]" />
									{/if}
								</button>
								
								{#if !legendCollapsed}
									<div class="max-h-[calc(60vh-3.5rem)] overflow-y-auto border-t border-[#E0E7EE]">
										{#each layerOrder as layerPath}
											{#if legendData[layerPath] && layerVisibility[layerPath] !== false}
												{@const legend = legendData[layerPath]}
												<div class="border-b border-[#E0E7EE] last:border-b-0">
													<div class="p-3">
														<h4 class="mb-2 text-xs font-semibold text-[#31506A]">{legend.name}</h4>
														<div class="space-y-1.5">
															{#each legend.items as item}
																<div class="flex items-center gap-2">
																	{#if item.imageData}
																		<img
																			src={item.imageData}
																			alt={item.label}
																			class="h-4 w-4 flex-shrink-0"
																		/>
																	{:else if item.imageUrl}
																		<img
																			src={item.imageUrl}
																			alt={item.label}
																			class="h-4 w-4 flex-shrink-0"
																			onerror={(e) => {
																				(e.target as HTMLImageElement).style.display = 'none';
																			}}
																		/>
																	{/if}
																	<span class="text-xs text-[#46637A]">{item.label}</span>
																</div>
															{/each}
														</div>
													</div>
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.ol-viewport),
	:global(.ol-overlaycontainer-stopevent) {
		width: 100% !important;
		height: 100% !important;
	}
</style>
