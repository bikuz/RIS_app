<script lang="ts">

    import { onMount, onDestroy } from 'svelte';
    import climate_1 from '$lib/assets/images/climate_1.png';
    import climate_2 from '$lib/assets/images/climate_2.png';
    import Map from 'ol/Map';
    import View from 'ol/View';
    import OSM from 'ol/source/OSM';
    import { fromLonLat } from 'ol/proj';
    import TileWMS from 'ol/source/TileWMS';
    import TileLayer from 'ol/layer/Tile';
	import ImageLayer from 'ol/layer/Image';
	import ImageWMS from 'ol/source/ImageWMS';
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
		ChevronDown,
		HelpCircle
	} from '@lucide/svelte';
	import FullScreen from 'ol/control/FullScreen';
	import ScaleLine from 'ol/control/ScaleLine';
	import { defaults as defaultControls } from 'ol/control/defaults.js';

	let { currentTopic = 'climate', width = '100%', height = '400px' } = $props();

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Hindu Kush Himalaya region coordinates (optimized for full HKH view)
	const HKH_CENTER = [77.5, 32.5]; // Longitude, Latitude - adjusted for better HKH coverage
	const HKH_ZOOM = 5; // Reduced zoom to show more of the HKH region

    	// ArcGIS MapServer endpoint and layers
	const arcgisServerUrl = 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/Demography/MapServer/WmsServer';
	const arcgisLayers = [
		{ id: '0', name: 'Population 2025' },
		{ id: '1', name: 'Sex Ratio 2025' },
		{ id: '2', name: 'Proportion of Aged >=75' },
		{ id: '3', name: 'Child Woman Ratio 2025' },
		{ id: '4', name: 'Child Dependency Ratio 2025' },
		{ id: '5', name: 'Age Dependency Ratio 2025' }
	];

    	// The currently visible ArcGIS layer ID
	let activeLayerId = $state('0');



	function initializeMap() {
		if (!mapContainer) return;

		// Small delay to ensure container has proper dimensions
		setTimeout(() => {
            			// Base layer (OSM)
			const osmLayer = new TileLayer({
				source: new OSM(),
				title: 'OSM'
			});

			// ArcGIS dynamic layer
			const arcgisLayer = new ImageLayer({
				source: new ImageWMS({
					url: arcgisServerUrl,
					params: {
						'LAYERS': activeLayerId, // Use the activeLayerId
						'VERSION': '1.3.0',
						'FORMAT': 'image/png'
					},
					serverType: 'geoserver' // It works better with ArcGIS server
				}),
                				title: 'ArcGIS Demography Layers'
			});
			
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
<div class="grid grid-cols-12 items-stretch gap-6">
	<!-- Left Sidebar - Story + Questions -->
	<div class="col-span-3 flex">
		<div class="sticky top-6 h-fit max-h-[calc(100vh-16rem)] flex-1 space-y-6 overflow-y-auto">
			<!-- Story Section -->
			<div class="rounded-2xl border border-white/20 bg-white/70 p-6">
				<div class="mb-6 flex items-center space-x-3">
					<div class="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
						<Cloud class="h-5 w-5 text-white" />
					</div>
					<h3 class="text-lg font-bold text-slate-800">Climate Change in HKH</h3>
				</div>

				<div class="space-y-4">
					<p class="text-justify text-sm leading-relaxed text-slate-600">
						Historically, the climate of the HKH has experienced significant changes that are
						closely related to the rise and fall of regional cultures and civilizations. The region
						is one of the most climate-sensitive mountain systems in the world. Known as the “Third
						Pole” for its vast ice reserves, the HKH plays a critical role in regulating Asia’s
						climate and serves as the source of ten major river systems that sustain the livelihoods
						of over 1.6 billion people downstream. However, the impacts of climate change are being
						felt here more intensely than the global average, with temperatures rising significantly
						faster than elsewhere.
					</p>
					<p class="text-justify text-sm leading-relaxed text-slate-600">
						In the future, even if global warming is kept to 1.5 °C, warming in the Hindu Kush
						Himalaya (HKH) region will likely be at least 0.3 °C higher, and in the northwest
						Himalaya and Karakoram at least 0.7 °C higher. Such large warming could trigger a
						multitude of biophysical and socio-economic impacts, such as biodiversity loss,
						increased glacial melting, and less predictable water availability—all of which will
						impact livelihoods and well-being in the HKH.
					</p>
					<p class="text-justify text-sm leading-relaxed text-slate-600">
						Glaciers in the HKH are retreating at unprecedented rates, snow cover is diminishing,
						and permafrost is degrading, all of which are altering river flows and threatening water
						security.
					</p>

					<p class="text-justify text-sm leading-relaxed text-slate-600">
						Climate change is also amplifying the frequency and severity of extreme weather events,
						including floods, droughts, and landslides, which pose immediate risks to lives,
						infrastructure, and economies. The loss of cryospheric mass not only threatens long-term
						water availability but also increases the risk of glacial lake outburst floods (GLOFs)
						that can devastate downstream communities.
					</p>
					<p class="text-justify text-sm leading-relaxed text-slate-600">
						The impacts extend beyond the physical environment to agriculture, biodiversity, and
						cultural heritage. Shifts in seasonal patterns are affecting crop yields, while warming
						temperatures are pushing species to higher altitudes, disrupting delicate alpine
						ecosystems. Many communities in the HKH rely on climate-sensitive livelihoods such as
						farming, herding, and tourism, making them particularly vulnerable.
					</p>
					<p class="text-justify text-sm leading-relaxed text-slate-600">
						Addressing climate change in the HKH requires urgent, coordinated, and region-wide
						action. This includes investing in climate-resilient infrastructure, expanding early
						warning systems, improving water management, and enhancing scientific monitoring of
						glaciers and weather patterns. Regional cooperation is essential for sharing data,
						aligning adaptation strategies, and managing shared water resources sustainably. Equally
						important is empowering local communities with knowledge, technology, and resources to
						adapt to changing conditions while preserving the environmental and cultural richness of
						the HKH.
					</p>
				</div>

				<!-- Images Section - Stacked -->
				<div class="mt-6 space-y-3">
					<div class="overflow-hidden rounded-lg border border-slate-200/50 bg-white/50">
						<img
							src={climate_1}
							alt="Himalayan glacial retreat"
							class="h-50 w-full object-contain"
						/>
						<div class="p-2">
							<p class="text-center text-xs text-slate-600">
								<span
									>We see <span class="font-semibold">less snow on the mountain peaks </span> in recent
									years
								</span>
							</p>
						</div>
					</div>
					<div class="overflow-hidden rounded-lg border border-slate-200/50 bg-white/50">
						<img src={climate_2} alt="Climate impacts" class="h-55 w-full object-contain" />
						<div class="p-2">
							<p class="text-center text-xs text-slate-600">
								<span>
									<span class="font-semibold"> Flooded street in Kathmandu </span> after a less than
									an hour heavy downpour</span
								>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Area - Map and Chart sections -->
	<div class="col-span-7 flex flex-col gap-6">
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
				<!-- Right Expand/Collapse Button -->
			</div>
		</div>

		<!-- Chart Section -->
		<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-semibold text-slate-700">Climate Analytics</h3>
			<div class="rounded-lg bg-slate-50/50 p-4">
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

	<!-- Right Sidebar - Indicators -->
	<div class="col-span-2 flex">
		<div
			class="sticky top-6 flex max-h-[calc(100vh-14rem)] min-h-[calc(100vh-14rem)] flex-1 flex-col rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-sm"
		>
			<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
				<div class="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
					<Layers class="h-5 w-5 text-white" />
				</div>
				<h3 class="text-lg font-bold text-slate-800">Information Layer</h3>
			</div>

			<div class="flex-1 overflow-y-auto">
				{#if currentMapData && currentMapData.length > 0}
					<div class="space-y-3">
						{#each currentMapData as mapLayer, index}
							<button
								onclick={() => toggleMapLayer(mapLayer.layer_name)}
								class="w-full rounded-lg border p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-md {activeMapLayers.has(
									mapLayer.layer_name
								)
									? 'border-green-300 bg-gradient-to-r from-green-50/90 to-emerald-50/90 shadow-md'
									: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80 hover:border-slate-300/70 hover:bg-slate-100/90'}"
							>
								<div class="flex items-start space-x-3 text-left">
									<div class="mt-1 flex-shrink-0">
										{#if activeMapLayers.has(mapLayer.layer_name)}
											<Eye class="h-5 w-5 text-green-600" />
										{:else}
											<EyeOff class="h-5 w-5 text-slate-400" />
										{/if}
									</div>
									<div class="flex-1">
										<h4
											class="text-sm font-medium {activeMapLayers.has(mapLayer.layer_name)
												? 'text-green-800'
												: 'text-slate-800'} mb-1"
										>
											{mapLayer.name}
										</h4>
										{#if mapLayer.description}
											<p class="text-xs leading-relaxed text-slate-600">
												{mapLayer.description}
											</p>
										{/if}
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

            <!-- Questions section -->
			<div class="relative mt-6 flex min-h-0 flex-1 flex-col border-t border-slate-200/50 pt-6">
				<div class="absolute right-1 bottom-1 z-50 flex flex-col items-end">
					<div
						class="questions-panel mb-4 w-60 origin-bottom-right transform rounded-lg bg-white/95 p-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
						class:scale-0={!isQuestionsPanelOpen}
						class:scale-100={isQuestionsPanelOpen}
						class:opacity-0={!isQuestionsPanelOpen}
						class:opacity-100={isQuestionsPanelOpen}
						class:pointer-events-none={!isQuestionsPanelOpen}
					>
						<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
							<div class="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 p-2">
								<Info class="h-4 w-4 text-white" />
							</div>
							<h3 class="text-base font-bold text-slate-800">Explore Questions</h3>
						</div>

						<div class="flex-1 space-y-3 overflow-y-auto">
							{#each climateQuestions as questionItem, index}
								<button
									class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
									questionItem.id
										? 'border-blue-500 bg-blue-50 shadow-md'
										: 'border-slate-200/50 bg-white/50 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-sm'}"
									onclick={() => selectQuestion(questionItem.id)}
								>
									<div class="flex items-start space-x-2">
										<div class="mt-1 flex-shrink-0">
											{#if selectedQuestionId === questionItem.id}
												<CheckCircle class="h-4 w-4 text-blue-600" />
											{:else}
												<div
													class="h-4 w-4 rounded-full border-2 border-slate-300 group-hover:border-blue-400"
												></div>
											{/if}
										</div>
										<p
											class="text-xs leading-relaxed {selectedQuestionId === questionItem.id
												? 'font-medium text-blue-700'
												: 'text-slate-600 group-hover:text-slate-800'}"
										>
											{questionItem.question}
										</p>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<button
						onclick={toggleQuestionsPanel}
						class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg transition-all duration-300 hover:scale-110"
						aria-label="Toggle questions panel"
					>
						<HelpCircle class="h-6 w-6" />
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
</style>
