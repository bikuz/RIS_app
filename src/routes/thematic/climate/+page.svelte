<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import { fromLonLat } from 'ol/proj';
	import TileWMS from 'ol/source/TileWMS';
	import 'ol/ol.css';
	import Chart from '$lib/components/Chart.svelte';
	import {
		Cloud,
		CheckCircle,
		Layers,
		Info,
		Eye,
		EyeOff,
		ChevronUp,
		ChevronDown
	} from '@lucide/svelte';
	import FullScreen from 'ol/control/FullScreen';
	import ScaleLine from 'ol/control/ScaleLine';
	import { defaults as defaultControls } from 'ol/control/defaults.js';

	let { currentTopic = 'climate', width = '100%', height = '400px' } = $props();

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates (optimized for full HKH view)
	const HKH_CENTER = [77.5, 32.5]; // Longitude, Latitude - adjusted for better HKH coverage
	const HKH_ZOOM = 5; // Reduced zoom to show more of the HKH region
	function initializeMap() {
		if (!mapContainer) return;

		// Small delay to ensure container has proper dimensions
		setTimeout(() => {
			map = new Map({
				target: mapContainer,
				controls: defaultControls().extend([
					new FullScreen(),
					new ScaleLine({ units: 'metric', bar: true })
				]),
				layers: [
					new TileLayer({
						source: new OSM()
					})
				],
				view: new View({
					center: fromLonLat(HKH_CENTER),
					zoom: HKH_ZOOM
				})
			});

			// Add some basic interaction
			map.on('click', (event) => {
				const coordinate = event.coordinate;
				console.log('Map clicked at:', coordinate);
			});

			// Ensure map renders properly
			if (map) {
				map.updateSize();
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

	onDestroy(() => {
		if (map) {
			map.dispose();
		}
	});

	// Generic climate dataset - array format for better structure
	const climateDataset = [
		{
			id: 'temp-trend-30y',
			question: 'What is the annual average temperature trend over the past 30 years',
			charts: [
				{
					title: 'Annual Mean Temperature Trend',
					chart_type: 'line',
					chart_data: {
						categories: [
							'1995',
							'1996',
							'1997',
							'1998',
							'1999',
							'2000',
							'2001',
							'2002',
							'2003',
							'2004',
							'2005',
							'2006',
							'2007',
							'2008',
							'2009',
							'2010',
							'2011',
							'2012',
							'2013',
							'2014',
							'2015',
							'2016',
							'2017',
							'2018',
							'2019',
							'2020',
							'2021',
							'2022',
							'2023',
							'2024'
						],
						series: [
							{
								name: 'Annual Mean Temperature (°C)',
								data: [
									4.7179, 4.7636, 3.9891, 5.3438, 5.5866, 4.8877, 5.418, 5.1678, 5.281, 5.2809,
									5.0343, 5.7049, 5.4111, 5.12, 5.6186, 5.8814, 5.2644, 4.9087, 5.378, 5.3068,
									5.5846, 6.3035, 6.0406, 5.7105, 5.3807, 5.6059, 6.0672, 6.0279, 5.9556, 6.4178
								]
							}
						]
					}
				},
				{
					title: 'Temperature Distribution by Decade',
					chart_type: 'column',
					chart_data: {
						categories: ['1995-2004', '2005-2014', '2015-2024'],
						series: [
							{
								name: 'Average Temperature (°C)',
								data: [5.06, 5.35, 5.89]
							}
						]
					}
				}
			],
			map_data: [
				{
					name: 'Annual Temperature Trend',
					wms_url: 'https://tethys.icimod.org:8443/geoserver/springs/wms',
					layer_name: 'springs:hkh_lc_2021'
				},
				{
					name: 'Temp Rise > 0.5°C',
					wms_url: 'https://example.com/geoserver/climate/wms',
					layer_name: 'climate:temp_anomaly_30y'
				},
				{
					name: 'Temp Rise > 1.5°C',
					wms_url: 'https://example.com/geoserver/climate/wms',
					layer_name: 'climate:temp_anomaly_30y'
				},
				{
					name: 'Temp Rise > 2.5°C',
					wms_url: 'https://example.com/geoserver/climate/wms',
					layer_name: 'climate:temp_anomaly_30y'
				}
			]
		},
		{
			id: 'temp-rise-decade',
			question: 'Which areas have observed temperature rise more than 1.5 degrees in last decade?',
			charts: [
				{
					title: 'Regional Temperature Rise (Last Decade)',
					chart_type: 'column',
					chart_data: {
						categories: ['Kashmir', 'Nepal', 'Bhutan', 'Tibet', 'Afghanistan', 'Pakistan'],
						series: [
							{
								name: 'Temperature Rise (°C)',
								data: [2.1, 1.8, 2.3, 2.5, 1.9, 2.0]
							}
						]
					}
				},
				{
					title: 'Temperature Anomaly Comparison',
					chart_type: 'line',
					chart_data: {
						categories: ['2019', '2020', '2021', '2022', '2023', '2024'],
						series: [
							{
								name: 'HKH Temperature Anomaly (°C)',
								data: [0.8, 1.2, 0.9, 1.4, 1.1, 1.6]
							},
							{
								name: 'Global Temperature Anomaly (°C)',
								data: [0.6, 0.8, 0.7, 0.9, 0.8, 1.0]
							}
						]
					}
				}
			],
			map_data: [
				{
					name: 'Regional Temperature Rise',
					wms_url: 'https://example.com/geoserver/wms',
					layer_name: 'climate:temp_rise_regions',
					style: 'temperature_rise_style',
					description: 'Areas with temperature rise >1.5°C in last decade'
				},
				{
					name: 'Temperature Anomaly Comparison',
					wms_url: 'https://example.com/geoserver/climate/wms',
					layer_name: 'climate:temp_anomaly_comparison',
					style: 'comparison_style',
					description: 'HKH vs Global temperature anomaly comparison'
				}
			]
		}
	];

	// Extract questions for UI (now simpler)
	const climateQuestions = climateDataset.map((item) => ({
		id: item.id,
		question: item.question
	}));

	// Track selected question - default to first question
	let selectedQuestionId = $state('temp-trend-30y');

	// Track active/visible map layers
	let activeMapLayers = $state(new Set<string>());

	// Track map data container collapse state
	let isMapDataCollapsed = $state(false);

	// Get current dataset based on selected question
	let currentDataset = $derived(
		selectedQuestionId
			? climateDataset.find((item) => item.id === selectedQuestionId)
			: climateDataset[0]
	);

	// Extract current data from dataset
	let currentCharts = $derived(currentDataset?.charts || []);
	let currentMapData = $derived(currentDataset?.map_data);

	// Get layer by ID from map (your better approach)
	const getLayerById = (layerID: string): any | null => {
		if (!map) return null;
		const layers = map.getLayers().getArray();
		for (const layer of layers) {
			if (layer.get('id') === layerID) {
				return layer;
			}
		}
		return null;
	};

	// Add WMS layer to map with ID
	function addWMSLayer(mapLayerData: any) {
		if (!map) return;

		const wmsLayer = new TileLayer({
			source: new TileWMS({
				url: mapLayerData.wms_url,
				params: {
					LAYERS: mapLayerData.layer_name,
					TILED: true
				},
				serverType: 'geoserver'
			})
		});

		// Set the ID for later retrieval (your approach)
		wmsLayer.set('id', mapLayerData.layer_name);

		// Add to map
		map.addLayer(wmsLayer);
		console.log('Added layer:', mapLayerData.layer_name);
	}

	// Remove layer from map by ID
	function removeWMSLayer(layerName: string) {
		if (!map) return;

		const layer = getLayerById(layerName);
		if (layer) {
			map.removeLayer(layer);
			console.log('Removed layer:', layerName);
		}
	}

	// Function to handle question selection
	function selectQuestion(questionId: string, questionText: string) {
		selectedQuestionId = questionId;
		console.log('Question selected:', questionId, questionText);
		console.log('Map data:', currentMapData);

		// Reset active layers when question changes
		// First remove all WMS layers
		activeMapLayers.forEach((layerName: string) => {
			removeWMSLayer(layerName);
		});
		activeMapLayers.clear();
	}

	// Function to toggle map layer visibility
	function toggleMapLayer(layerName: string) {
		// Find the layer data
		const layerData = currentMapData?.find((layer) => layer.layer_name === layerName);
		if (!layerData) {
			console.error('Layer data not found for:', layerName);
			return;
		}

		if (activeMapLayers.has(layerName)) {
			// Remove layer
			activeMapLayers.delete(layerName);
			removeWMSLayer(layerName);
		} else {
			// Add layer
			activeMapLayers.add(layerName);
			addWMSLayer(layerData);
		}

		// Trigger reactivity
		activeMapLayers = new Set(activeMapLayers);
		console.log('Layer toggled:', layerName, 'Active:', activeMapLayers.has(layerName));
	}
</script>

<!-- 3-Column Layout -->
<div class="grid grid-cols-12 items-stretch gap-8">
	<!-- Left Sidebar -->
	<div class="col-span-3 flex">
		<div
			class="sticky top-6 h-fit max-h-[calc(100vh-3rem)] flex-1 overflow-y-auto rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-sm"
		>
			<div class="mb-6 flex items-center space-x-3">
				<div class="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
					<Cloud class="h-5 w-5 text-white" />
				</div>
				<h3 class="text-lg font-bold text-slate-800">Climate Abstract</h3>
			</div>

			<div class="space-y-4">
				<p class="text-sm leading-relaxed text-slate-600">
					The Hindu Kush Himalaya (HKH) region experiences diverse climate patterns due to its
					complex topography and elevation gradients.
				</p>
				<p class="text-sm leading-relaxed text-slate-600">
					Climate change impacts in this region include rising temperatures, changing precipitation
					patterns, and accelerated glacial melting.
				</p>

				<div
					class="rounded-xl border border-blue-200/30 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 p-4 backdrop-blur-sm"
				>
					<h4 class="mb-3 flex items-center space-x-2 text-sm font-bold text-blue-800">
						<span>Key Climate Indicators</span>
					</h4>
					<ul class="space-y-2 text-sm text-blue-700">
						<li class="flex items-center space-x-2">
							<CheckCircle class="h-3 w-3" />
							<span>Temperature trends</span>
						</li>
						<li class="flex items-center space-x-2">
							<CheckCircle class="h-3 w-3" />
							<span>Area with temperature rise more than 1.5 degrees</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Area - Split into Map and Chart sections -->
	<div class="col-span-6 flex flex-col gap-4">
		<!-- Map Section -->
		<div
			class="relative flex-1 overflow-hidden rounded-xl border border-slate-200/50 bg-white shadow-sm"
		>
			<div
				class="map-container flex flex-col bg-white/70 backdrop-blur-sm"
				class:h-full={height === '100%'}
			>
				<div
					bind:this={mapContainer}
					class="map-element overflow-hidden rounded-2xl border border-slate-200/50"
					style="width: {width}; {height === '100%' ? 'min-height: 600px;' : `height: ${height};`}"
					class:flex-1={height === '100%'}
				></div>
			</div>

			<!-- Map Data Container - Bottom Right (Collapsible) -->
			{#if currentMapData && currentMapData.length > 0}
				<div
					class="absolute right-4 bottom-4 w-64 rounded-xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300"
				>
					<!-- Header with collapse toggle -->
					<button
						on:click={() => (isMapDataCollapsed = !isMapDataCollapsed)}
						class="flex w-full items-center justify-between rounded-t-xl p-3 transition-colors duration-200 hover:bg-white/50"
					>
						<div class="flex items-center space-x-2">
							<!-- <div class="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-1">
								<Layers class="h-3 w-3 text-white" />
							</div> -->
							<h4 class="text-sm font-bold text-slate-800">Indicators</h4>
						</div>
						{#if isMapDataCollapsed}
							<ChevronDown class="h-4 w-4 text-slate-600" />
						{:else}
							<ChevronUp class="h-4 w-4 text-slate-600" />
						{/if}
					</button>

					<!-- Collapsible content -->
					{#if !isMapDataCollapsed}
						<div class="border-t border-white/30 p-3">
							<div class="max-h-40 space-y-2 overflow-y-auto">
								{#each currentMapData as mapLayer, index}
									<button
										on:click={() => toggleMapLayer(mapLayer.layer_name)}
										class="w-full rounded-lg border px-3 py-2 backdrop-blur-sm transition-all duration-200 hover:shadow-sm {activeMapLayers.has(
											mapLayer.layer_name
										)
											? 'border-green-300 bg-gradient-to-r from-green-50/90 to-emerald-50/90 shadow-sm'
											: 'border-slate-200/30 bg-gradient-to-r from-slate-50/80 to-slate-100/80 hover:border-slate-300/50'}"
									>
										<div class="flex items-center justify-between text-left">
											<div class="flex items-center space-x-2">
												{#if activeMapLayers.has(mapLayer.layer_name)}
													<Eye class="h-3 w-3 flex-shrink-0 text-green-600" />
												{:else}
													<EyeOff class="h-3 w-3 flex-shrink-0 text-slate-400" />
												{/if}
												<span
													class="text-xs font-medium {activeMapLayers.has(mapLayer.layer_name)
														? 'text-green-800'
														: 'text-slate-800'} truncate"
												>
													{mapLayer.name}
												</span>
											</div>
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Chart Section -->
		<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
			<h3 class="mb-3 text-lg font-semibold text-slate-700">Climate Charts & Analytics</h3>
			<div class="rounded-lg bg-slate-50/50 p-2">
				{#if currentCharts && currentCharts.length > 0}
					<div class="space-y-6">
						{#each currentCharts as chart, index}
							<div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
								<Chart
									chartData={chart.chart_data}
									title={chart.title}
									subtitle="Hindu Kush Himalaya Region Climate Data"
									chart_type={chart.chart_type}
								/>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex h-80 items-center justify-center">
						<div class="text-center text-slate-500">
							<p class="text-sm">Select a question to view related charts</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Right Sidebar -->
	<div class="col-span-3 flex">
		<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
			<h3 class="mb-4 text-sm font-semibold text-slate-700">Possible Questions</h3>
			<div class="space-y-3">
				{#each climateQuestions as questionItem, index}
					<div
						class="group cursor-pointer rounded-lg border p-3 transition-all {selectedQuestionId ===
						questionItem.id
							? 'border-blue-500 bg-blue-50 shadow-md'
							: 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/50'}"
						role="button"
						tabindex="0"
						on:click={() => selectQuestion(questionItem.id, questionItem.question)}
					>
						<p
							class="text-xs leading-relaxed {selectedQuestionId === questionItem.id
								? 'font-medium text-blue-700'
								: 'text-slate-600'}"
						>
							{questionItem.question}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
</style>
