<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import { fromLonLat } from 'ol/proj';
	import 'ol/ol.css';
	import lightMap from '$lib/assets/images/basemaps/light-map.png';
	import darkMap from '$lib/assets/images/basemaps/dark-map.png';
	import osmMap from '$lib/assets/images/basemaps/osm-map.png';
	import satelliteMap from '$lib/assets/images/basemaps/satellite-map.png';
	import terrainMap from '$lib/assets/images/basemaps/terrain-map.png';
	import icimodLogo from '$lib/assets/logo/logo-icimod_white.png';
	import {
		Search,
		Filter,
		CheckCircle,
		Circle,
		FileText,
		Eye,
		EyeOff,
		MoreVertical,
		Trash2,
		Download,
		MapIcon,
		House,
		Layers,
		ChevronDown,
		ChevronRight
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { topicIcons, getTopicName, getTopicColor } from '$lib/data/themeData';
	import FullScreen from 'ol/control/FullScreen';
	import { defaults as defaultControls } from 'ol/control/defaults.js';
	import ImageLayer from 'ol/layer/Image';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import { allMapLayers } from './mapLayers.js';

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates
	const HKH_CENTER = [82.94924, 27.6382055];
	const HKH_ZOOM = 4.8;

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

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
	}

	// Dataset management state
	let activeTab = $state<'available' | 'selected'>('available');
	let searchQuery = $state('');
	let selectedDatasets = $state<Set<string>>(new Set());
	let datasetVisibility = $state<Record<string, boolean>>({});
	let expandedGroups = $state<Set<string>>(new Set(['physiography', 'ecosystem', 'cryosphere']));

	// Transform allMapLayers into groupedDatasets format
	// Helper function to extract the first/default layer from a dataset's map_layers
	function extractDefaultLayer(datasetId: string, mapLayersConfig: any): {
		id: string;
		name: string;
		description: string;
		url: string;
		layerIndex: number | string;
		metadataUrl: string;
	} | null {
		if (!mapLayersConfig) return null;

		// Handle different structures: default array, nested objects, or direct objects
		let layer = null;

		if (mapLayersConfig.default && Array.isArray(mapLayersConfig.default)) {
			layer = mapLayersConfig.default[0];
		} else if (Array.isArray(mapLayersConfig)) {
			layer = mapLayersConfig[0];
		} else if (mapLayersConfig.overall && Array.isArray(mapLayersConfig.overall)) {
			layer = mapLayersConfig.overall[0];
		} else if (typeof mapLayersConfig === 'object' && mapLayersConfig.url) {
			layer = mapLayersConfig;
		} else if (typeof mapLayersConfig === 'object') {
			// Try to get first value from object
			const firstKey = Object.keys(mapLayersConfig)[0];
			const firstValue = mapLayersConfig[firstKey];
			if (Array.isArray(firstValue)) {
				layer = firstValue[0];
			} else if (firstValue && typeof firstValue === 'object' && firstValue.url) {
				layer = firstValue;
			}
		}

		if (!layer || !layer.url) return null;

		return {
			id: datasetId,
			name: layer.name || datasetId,
			description: layer.description || `${layer.name || datasetId} layer for the HKH region.`,
			url: layer.url,
			layerIndex: typeof layer.layerIndex === 'string' ? parseInt(layer.layerIndex) || layer.layerIndex : layer.layerIndex,
			metadataUrl: 'https://rds.icimod.org/Home/DataDetail?metadataId=1972511'
		};
	}

	// Build groupedDatasets from allMapLayers
	const groupedDatasets: Record<string, Array<{
		id: string;
		name: string;
		description: string;
		url: string;
		layerIndex: number | string;
		metadataUrl: string;
	}>> = {};

	// Process each thematic area
	for (const [thematicArea, datasets] of Object.entries(allMapLayers)) {
		if (!groupedDatasets[thematicArea]) {
			groupedDatasets[thematicArea] = [];
		}

		// Process each dataset in the thematic area
		for (const [datasetId, mapLayersConfig] of Object.entries(datasets as Record<string, any>)) {
			const layer = extractDefaultLayer(datasetId, mapLayersConfig);
			if (layer) {
				groupedDatasets[thematicArea].push(layer);
			}
		}
	}

	// Add some additional layers that might be missing
	// HKH Outline layers
	if (!groupedDatasets.physiography) {
		groupedDatasets.physiography = [];
	}
	
	// Add HKH Outline if not already present
	if (!groupedDatasets.physiography.find(d => d.id === 'hkh-outline')) {
		groupedDatasets.physiography.unshift({
			id: 'hkh-outline',
			name: 'HKH Outline',
			description: 'HKH region outline boundary.',
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
			layerIndex: 0,
			metadataUrl: 'https://rds.icimod.org/Home/DataDetail?metadataId=1972511'
		});
	}

	// Flatten all datasets for easy access
	const availableDatasets = Object.values(groupedDatasets).flat();

	// Toggle group expansion
	function toggleGroup(groupId: string) {
		if (expandedGroups.has(groupId)) {
			expandedGroups.delete(groupId);
		} else {
			expandedGroups.add(groupId);
		}
		expandedGroups = new Set(expandedGroups);
	}

	// Map layers storage
	let mapLayers = $state<Record<string, ImageLayer<any>>>({});

	// Get filtered datasets by group
	let filteredGroupedDatasets = $derived.by(() => {
		if (activeTab === 'selected') {
			const selected = getSelectedDatasets();
			return { 'Selected': selected };
		}

		const filtered: Record<string, typeof availableDatasets> = {};
		const query = searchQuery.toLowerCase().trim();

		for (const [groupId, datasets] of Object.entries(groupedDatasets)) {
			const filteredDatasets = query
				? datasets.filter((ds) => ds.name.toLowerCase().includes(query))
				: datasets;
			
			if (filteredDatasets.length > 0) {
				filtered[groupId] = filteredDatasets;
			}
		}

		return filtered;
	});

	// Get selected datasets
	function getSelectedDatasets() {
		return availableDatasets.filter((ds) => selectedDatasets.has(ds.id));
	}

	// Get currently displayed dataset
	let currentDataset = $derived.by(() => {
		const selected = getSelectedDatasets();
		return selected.length > 0 ? selected[0] : null;
	});

	// Toggle dataset (add/remove)
	function toggleDataset(datasetId: string) {
		if (!map) return;

		const dataset = availableDatasets.find((ds) => ds.id === datasetId);
		if (!dataset) return;

		if (selectedDatasets.has(datasetId)) {
			// Remove dataset
			selectedDatasets.delete(datasetId);
			delete datasetVisibility[datasetId];

			if (mapLayers[datasetId]) {
				map.removeLayer(mapLayers[datasetId]);
				delete mapLayers[datasetId];
			}
		} else {
			// Add dataset
			selectedDatasets.add(datasetId);
			datasetVisibility[datasetId] = true;

			// Create and add layer
			const layer = new ImageLayer({
				source: new ImageArcGISRest({
					url: dataset.url,
					params: {
						LAYERS: `show:${dataset.layerIndex}`,
						FORMAT: 'PNG32',
						TRANSPARENT: true
					}
				}),
				zIndex: 10,
				opacity: 0.7,
				visible: true
			});

			layer.set('datasetId', datasetId);
			map.addLayer(layer);
			mapLayers[datasetId] = layer;
		}
		selectedDatasets = new Set(selectedDatasets);
	}

	// Remove dataset from map
	function removeDataset(datasetId: string) {
		if (!map) return;

		selectedDatasets.delete(datasetId);
		delete datasetVisibility[datasetId];

		if (mapLayers[datasetId]) {
			map.removeLayer(mapLayers[datasetId]);
			delete mapLayers[datasetId];
		}
		selectedDatasets = new Set(selectedDatasets);
	}

	// Toggle dataset visibility
	function toggleVisibility(datasetId: string) {
		if (!mapLayers[datasetId]) return;
		const isVisible = !datasetVisibility[datasetId];
		datasetVisibility[datasetId] = isVisible;
		mapLayers[datasetId].setVisible(isVisible);
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

			return () => {
				resizeObserver.disconnect();
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

		if (map) {
			map.dispose();
		}
	});

	// Auto-add first dataset on mount
	$effect(() => {
		if (map && selectedDatasets.size === 0 && availableDatasets.length > 0) {
			// Auto-add Land Cover dataset
			toggleDataset('land-cover-2022');
		}
	});
</script>

<header class="relative overflow-hidden bg-gradient-to-r from-blue-800 to-green-800 text-white">
	<div class="absolute inset-0 bg-black/20"></div>
	<div class="relative mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex h-24 items-center justify-between">
			<div class="flex items-center space-x-6">
				<div class="flex flex-col">
					<div class="text-3xl font-bold text-white">Hi-RIS (HKH Regional Information System)</div>
				</div>
			</div>
			<div class="">
				<img src={icimodLogo} alt="ICIMOD Logo" class="h-7 w-auto" />
			</div>
			
		</div>
	</div>
</header>

<div class="min-h-screen bg-gray-50 p-3 sm:p-6">
	<div class="grid grid-cols-12 gap-4 lg:gap-6">
		<!-- Left Sidebar: Dataset Management -->
		<div class="col-span-12 lg:col-span-3">
			<div class="sticky top-6 flex h-[calc(100vh-9rem)] flex-col rounded-2xl border border-white/20 bg-white p-4 shadow-xl backdrop-blur-sm lg:p-6">
				<!-- Home Button -->
				<button
					onclick={() => goto(`${base}/layout3`)}
					class="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-500 to-green-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-green-600 hover:shadow-md"
					title="Go to Home Page"
				>
					<House class="h-4 w-4" />
					<span>Home</span>
				</button>

				<!-- Search Bar -->
				<div class="mb-4 flex items-center gap-2">
					<div class="relative flex-1">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
						/>
						<input
							type="text"
							placeholder="Search datasets"
							bind:value={searchQuery}
							class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
					<button
						class="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-600 hover:bg-gray-100"
						title="Filter"
					>
						<Filter class="h-4 w-4" />
					</button>
				</div>

				<!-- Tabs -->
				<div class="mb-4 flex gap-2 border-b border-gray-200">
					<button
						onclick={() => (activeTab = 'available')}
						class="flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
						'available'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-gray-600 hover:text-gray-800'}"
					>
						Available Datasets
					</button>
					<button
						onclick={() => (activeTab = 'selected')}
						class="flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
						'selected'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-gray-600 hover:text-gray-800'}"
					>
						Selected Datasets
					</button>
				</div>

				<!-- Dataset List -->
				<div class="flex-1 space-y-2 overflow-y-auto">
					{#if activeTab === 'available'}
						{#each Object.entries(filteredGroupedDatasets) as [groupId, datasets]}
							{@const IconComponent = topicIcons[groupId as keyof typeof topicIcons]}
							{@const isExpanded = expandedGroups.has(groupId)}
							<div class="rounded-lg border border-gray-200 bg-white">
								<!-- Group Header -->
								<button
									onclick={() => toggleGroup(groupId)}
									class="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-gray-50"
								>
									<div class="flex items-center gap-2">
										{#if IconComponent}
											{@const Icon = IconComponent}
											<div class="rounded-lg bg-gradient-to-r {getTopicColor(groupId)} p-1.5">
												<Icon class="h-4 w-4 text-white" />
											</div>
										{/if}
										<span class="text-sm font-semibold text-gray-800">{getTopicName(groupId)}</span>
									</div>
									{#if isExpanded}
										<ChevronDown class="h-4 w-4 text-gray-600" />
									{:else}
										<ChevronRight class="h-4 w-4 text-gray-600" />
									{/if}
								</button>

								<!-- Group Datasets -->
								{#if isExpanded}
									<div class="border-t border-gray-100 p-2 space-y-1">
										{#each datasets as dataset}
											<div
												class="group flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 transition-all hover:border-blue-300 hover:bg-blue-50/50 {selectedDatasets.has(dataset.id)
													? 'border-blue-500 bg-blue-50'
													: ''}"
											>
												<button
													onclick={() => toggleDataset(dataset.id)}
													class="flex-shrink-0 rounded p-1 text-blue-600 transition-colors hover:bg-blue-100"
													title={selectedDatasets.has(dataset.id) ? 'Remove from map' : 'Add to map'}
												>
													{#if selectedDatasets.has(dataset.id)}
														<CheckCircle class="h-4 w-4 fill-current" />
													{:else}
														<Circle class="h-4 w-4" />
													{/if}
												</button>
												<div class="flex-1 min-w-0">
													<h4 class="truncate text-sm font-medium text-gray-800">{dataset.name}</h4>
												</div>
												<button
													class="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100"
													title="View details"
												>
													<FileText class="h-4 w-4" />
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					{:else}
						{#each getSelectedDatasets() as dataset}
							<div
								class="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md"
							>
								<div class="flex-1 min-w-0">
									<h4 class="truncate text-sm font-medium text-gray-800">{dataset.name}</h4>
								</div>
								<div class="flex items-center gap-1">
									<button
										onclick={() => toggleVisibility(dataset.id)}
										class="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
										title={datasetVisibility[dataset.id] ? 'Hide layer' : 'Show layer'}
									>
										{#if datasetVisibility[dataset.id] !== false}
											<Eye class="h-4 w-4" />
										{:else}
											<EyeOff class="h-4 w-4" />
										{/if}
									</button>
									<button
										class="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
										title="Layer options"
									>
										<Layers class="h-4 w-4" />
									</button>
									<button
										class="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
										title="View details"
									>
										<FileText class="h-4 w-4" />
									</button>
									<button
										onclick={() => removeDataset(dataset.id)}
										class="rounded p-1.5 text-red-600 transition-colors hover:bg-red-100"
										title="Remove from map"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</div>
						{/each}

						{#if getSelectedDatasets().length === 0}
							<div class="py-8 text-center text-sm text-gray-500">
								<p>No datasets selected</p>
							</div>
						{/if}
					{/if}

					{#if activeTab === 'available' && Object.keys(filteredGroupedDatasets).length === 0}
						<div class="py-8 text-center text-sm text-gray-500">
							<p>No datasets found</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Main Map Area -->
		<div class="col-span-12 lg:col-span-9">
			<div class="sticky top-6 flex h-[calc(100vh-9rem)] flex-col rounded-2xl border border-white/20 bg-white p-4 shadow-xl backdrop-blur-sm lg:p-6">
				<!-- Map Container -->
				<div
					class="relative flex-1 min-h-0 overflow-hidden rounded-xl border border-gray-200"
				>
					<div
						bind:this={mapContainer}
						class="h-full w-full"
					></div>

					<!-- Map Controls -->
					<!-- Home Reset Button -->
					<button
						class="absolute top-2 left-2 z-20 rounded border border-gray-200 bg-white p-1.5 shadow hover:bg-gray-100"
						onclick={() => {
							if (map) {
								map.getView().setCenter(fromLonLat(HKH_CENTER));
								map.getView().setZoom(HKH_ZOOM);
							}
						}}
						title="Reset to Home View"
					>
						<House class="h-4 w-4 text-gray-700" />
					</button>

					<!-- Basemap Switcher Button -->
					<button
						class="absolute top-2 right-2 z-20 rounded border border-gray-200 bg-white p-1.5 shadow hover:bg-gray-100"
						onclick={() => (basemapPanelOpen = !basemapPanelOpen)}
						title="Change Basemap"
					>
						<MapIcon class="h-4 w-4 text-gray-700" />
					</button>

					<!-- Basemap Switcher Panel -->
					{#if basemapPanelOpen}
						<div
							class="absolute top-12 right-2 z-20 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
						>
							<div class="p-3">
								<h3 class="mb-2 text-sm font-semibold">Basemap</h3>
								<div class="space-y-1">
									{#each basemaps as basemap}
										<button
											class="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors {selectedBasemap ===
											basemap.id
												? 'bg-indigo-100 font-medium text-indigo-700'
												: 'text-gray-700 hover:bg-gray-100'}"
											onclick={() => {
												switchBasemap(basemap.id);
												basemapPanelOpen = false;
											}}
										>
											<span class="flex-1">{basemap.name}</span>
											<img
												src={basemap.image}
												alt={basemap.name}
												class="h-8 w-12 rounded border border-gray-200 object-cover"
											/>
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Dataset Description Panel -->
				{#if currentDataset}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="mb-2 text-lg font-semibold text-gray-800">{currentDataset.name}</h3>
								<p class="mb-3 text-sm text-gray-600">{currentDataset.description}</p>
								<a
									href={currentDataset.metadataUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
								>
									<Download class="h-4 w-4" />
									<span>{currentDataset.metadataUrl}</span>
								</a>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:global(.map-wrapper .map-container) {
		height: 100% !important;
	}

	:global(.ol-viewport) {
		width: 100% !important;
		height: 100% !important;
	}
</style>
