<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import climate_1 from '$lib/assets/images/climate_1.png';
	import climate_2 from '$lib/assets/images/climate_2.png';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import OSM from 'ol/source/OSM';
	import { fromLonLat } from 'ol/proj';
	import TileLayer from 'ol/layer/Tile';
	import ImageLayer from 'ol/layer/Image';
	import TileArcGISRest from 'ol/source/TileArcGISRest';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import 'ol/ol.css';
	import Chart from '$lib/components/Chart.svelte';
	import { Cloud, CheckCircle, Layers, Info, Eye, EyeOff, HelpCircle } from '@lucide/svelte';
	import FullScreen from 'ol/control/FullScreen';
	import ScaleLine from 'ol/control/ScaleLine';
	import { defaults as defaultControls } from 'ol/control/defaults.js';

	let { currentTopic = 'climate', width = '100%', height = '400px' } = $props();

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates
	const HKH_CENTER = [77.5, 32.5]; // Longitude, Latitude
	const HKH_ZOOM = 4;

	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// ArcGIS MapServer URL
	const arcgisBaseUrl =
		'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/Demography/MapServer';

	// Layer definitions - split into information layers and question layers
	const informationLayers = [
		{ id: 0, title: 'Population 2025', type: 'info' },
		{ id: 1, title: 'Sex Ratio 2025', type: 'info' },
		{ id: 2, title: 'Proportion of Aged >=75', type: 'info' }
	];

	const questionLayers = [
		{ id: 3, title: 'Child Woman Ratio 2025', type: 'question' },
		{ id: 4, title: 'Child Dependency Ratio 2025', type: 'question' },
		{ id: 5, title: 'Age Dependency Ratio 2025', type: 'question' }
	];

	// Track the currently active layer
	let activeLayerId = $state<number | null>(0);
	let currentArcGISLayer: ImageLayer<ImageArcGISRest> | null = null;

	// Dummy chart data for different layers
	const layerChartData = {
		0: {
			// Population 2025
			title: 'Population Distribution Analysis',
			chart_type: 'column',
			chart_data: {
				categories: ['Kashmir', 'Nepal', 'Bhutan', 'Tibet', 'Afghanistan', 'Pakistan'],
				series: [
					{
						name: 'Population (Millions)',
						data: [12.5, 29.1, 0.8, 3.2, 38.9, 220.9]
					}
				]
			}
		},
		1: {
			// Sex Ratio 2025
			title: 'Sex Ratio Analysis',
			chart_type: 'line',
			chart_data: {
				categories: ['2015', '2017', '2019', '2021', '2023', '2025'],
				series: [
					{
						name: 'Males per 100 Females',
						data: [105.2, 104.8, 104.5, 104.1, 103.8, 103.5]
					}
				]
			}
		},
		2: {
			// Proportion of Aged >=75
			title: 'Elderly Population Distribution',
			chart_type: 'column',
			chart_data: {
				categories: ['Kashmir', 'Nepal', 'Bhutan', 'Tibet', 'Afghanistan', 'Pakistan'],
				series: [
					{
						name: 'Aged >=75 (%)',
						data: [3.2, 2.8, 2.1, 4.5, 1.9, 2.6]
					}
				]
			}
		},
		3: {
			// Child Woman Ratio 2025
			title: 'Child Woman Ratio Trends',
			chart_type: 'line',
			chart_data: {
				categories: ['2015', '2017', '2019', '2021', '2023', '2025'],
				series: [
					{
						name: 'Children per 1000 Women',
						data: [380, 365, 350, 335, 320, 305]
					}
				]
			}
		},
		4: {
			// Child Dependency Ratio 2025
			title: 'Child Dependency Analysis',
			chart_type: 'column',
			chart_data: {
				categories: ['Kashmir', 'Nepal', 'Bhutan', 'Tibet', 'Afghanistan', 'Pakistan'],
				series: [
					{
						name: 'Child Dependency Ratio',
						data: [32.5, 28.7, 25.3, 22.1, 45.2, 35.8]
					}
				]
			}
		},
		5: {
			// Age Dependency Ratio 2025
			title: 'Age Dependency Trends',
			chart_type: 'line',
			chart_data: {
				categories: ['2015', '2017', '2019', '2021', '2023', '2025'],
				series: [
					{
						name: 'Age Dependency Ratio',
						data: [58.2, 56.8, 55.1, 53.7, 52.3, 51.0]
					}
				]
			}
		}
	};

	function initializeMap() {
		if (!mapContainer) return;

		setTimeout(() => {
			// Create base OSM layer
			const baseLayer = new TileLayer({
				source: new OSM()
			});

			// Create map
			map = new Map({
				target: mapContainer,
				controls: defaultControls().extend([
					new FullScreen(),
					new ScaleLine({ units: 'metric', bar: true })
				]),
				layers: [baseLayer],
				view: new View({
					center: fromLonLat(HKH_CENTER),
					zoom: HKH_ZOOM
				})
			});

			// Click logging
			map.on('click', (event) => {
				console.log('Map clicked at:', event.coordinate);
			});

			// Ensure map renders properly
			if (map) {
				map.updateSize();
			}
		}, 100);
	}

    function selectLayer(layerId: number, layerTitle: string) {
    // Always add the selected layer — no toggle-off
    addArcGISLayer(layerId);
    activeLayerId = layerId;
    console.log('Selected layer:', layerTitle);
}


	// Test function to check MapServer capabilities
	function testMapServerEndpoint() {
		const testUrl = `${arcgisBaseUrl}?f=json`;
		console.log('Test MapServer endpoint:', testUrl);
		console.log('You can visit this URL to see the service capabilities');
	}

	onMount(() => {
    initializeMap();
    testMapServerEndpoint();

    // Once map is ready, load the default layer (layerId 0)
    setTimeout(() => {
        addArcGISLayer(0);
        activeLayerId = 0;
    }, 200);

    if (typeof ResizeObserver !== 'undefined' && mapContainer) {
        const resizeObserver = new ResizeObserver(() => {
            if (map) {
                setTimeout(() => {
                    map.updateSize();
                }, 100);
            }
        });
        resizeObserver.observe(mapContainer);
        return () => resizeObserver.disconnect();
    }
});

	onDestroy(() => {
		if (map) {
			map.dispose();
		}
	});

	// Function to remove current ArcGIS layer
	function removeCurrentLayer() {
		if (map && currentArcGISLayer) {
			map.removeLayer(currentArcGISLayer);
			currentArcGISLayer = null;
		}
	}

	// Function to add ArcGIS layer
	function addArcGISLayer(layerId: number) {
		if (!map) return;

		// Remove current layer first
		removeCurrentLayer();

		// Create new ArcGIS Image layer with sublayer specification
		currentArcGISLayer = new ImageLayer({
			source: new ImageArcGISRest({
				url: arcgisBaseUrl, // Use the base MapServer URL
				params: {
					LAYERS: `show:${layerId}`, // Specify which sublayer to show
					FORMAT: 'PNG32',
					TRANSPARENT: true,
					DPI: 96
				}
			})
		});

		// Set layer properties
		currentArcGISLayer.set('id', `arcgis_${layerId}`);
		currentArcGISLayer.set('title', `Layer ${layerId}`);

		// Add to map
		map.addLayer(currentArcGISLayer);

		console.log('Added ArcGIS MapImageLayer sublayer:', layerId);
		console.log('Request URL will be:', arcgisBaseUrl);
	}

	// Alternative function to add ArcGIS layer with different parameter formats
	function addArcGISLayerAlternative(layerId: number) {
		if (!map) return;

		// Remove current layer first
		removeCurrentLayer();

		// Try different parameter formats for ArcGIS MapImageLayer
		const layerParams = {
			// Option 1: Standard LAYERS parameter
			LAYERS: `${layerId}`,
			// Option 2: Alternative format
			// 'LAYERS': `show:${layerId}`,
			// Option 3: Multiple layers format
			// 'LAYERS': `show:${layerId}`,

			FORMAT: 'PNG32',
			TRANSPARENT: true,
			DPI: 96,
			BBOXSR: 3857,
			IMAGESR: 3857,
			F: 'image'
		};

		currentArcGISLayer = new ImageLayer({
			source: new ImageArcGISRest({
				url: arcgisBaseUrl,
				params: layerParams
			})
		});

		currentArcGISLayer.set('id', `arcgis_${layerId}`);
		map.addLayer(currentArcGISLayer);

		console.log('Added ArcGIS MapImageLayer with params:', layerParams);
	}

	// Get current chart data based on active layer
	let currentChartData = $derived(activeLayerId !== null ? layerChartData[activeLayerId] : null);
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
						is one of the most climate-sensitive mountain systems in the world. Known as the "Third
						Pole" for its vast ice reserves, the HKH plays a critical role in regulating Asia's
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
			</div>
		</div>

		<!-- Chart Section -->
		<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-semibold text-slate-700">Demographics Analytics</h3>
			<div class="rounded-lg bg-slate-50/50 p-4">
				{#if currentChartData}
					<div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
						<Chart
							chartData={currentChartData.chart_data}
							title={currentChartData.title}
							subtitle="Hindu Kush Himalaya Region Demographic Data"
							chart_type={currentChartData.chart_type}
						/>
					</div>
				{:else}
					<div class="flex h-80 items-center justify-center">
						<div class="text-center text-slate-500">
							<p class="text-sm">Select a layer to view related charts</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Right Sidebar - Information Layers -->
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

			<!-- Information Layers List -->
			<div class="flex-1 overflow-y-auto">
				<div class="space-y-3">
					{#each informationLayers as layer}
						<button
							onclick={() => selectLayer(layer.id, layer.title)}
							class="w-full rounded-lg border p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-md {activeLayerId ===
							layer.id
								? 'border-green-300 bg-gradient-to-r from-green-50/90 to-emerald-50/90 shadow-md'
								: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80 hover:border-slate-300/70 hover:bg-slate-100/90'}"
						>
							<div class="flex items-start space-x-3 text-left">
								<div class="mt-1 flex-shrink-0">
									<!-- {#if activeLayerId === layer.id}
										<Eye class="h-5 w-5 text-green-600" />
									{:else}
										<EyeOff class="h-5 w-5 text-slate-400" />
									{/if} -->
								</div>
								<div class="flex-1">
									<h4
										class="text-sm font-medium {activeLayerId === layer.id
											? 'text-green-800'
											: 'text-slate-800'} mb-1"
									>
										{layer.title}
									</h4>
									<p class="text-xs leading-relaxed text-slate-600">
										Demographic layer for {layer.title.toLowerCase()}
									</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Questions Panel Toggle -->
			<div class="relative mt-6 flex min-h-0 flex-1 flex-col border-t border-slate-200/50 pt-6">
				<div class="absolute right-1 bottom-1 z-50 flex flex-col items-end">
					<!-- Questions Panel -->
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
							<h3 class="text-base font-bold text-slate-800">Additional Layers</h3>
						</div>

						<div class="flex-1 space-y-3 overflow-y-auto">
							{#each questionLayers as layer}
								<button
									class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {activeLayerId ===
									layer.id
										? 'border-blue-500 bg-blue-50 shadow-md'
										: 'border-slate-200/50 bg-white/50 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-sm'}"
									onclick={() => selectLayer(layer.id, layer.title)}
								>
									<div class="flex items-start space-x-2">
										<div class="mt-1 flex-shrink-0">
											{#if activeLayerId === layer.id}
												<CheckCircle class="h-4 w-4 text-blue-600" />
											{:else}
												<div
													class="h-4 w-4 rounded-full border-2 border-slate-300 group-hover:border-blue-400"
												></div>
											{/if}
										</div>
										<div class="flex-1">
											<p
												class="text-xs leading-relaxed font-medium {activeLayerId === layer.id
													? 'text-blue-700'
													: 'text-slate-600 group-hover:text-slate-800'}"
											>
												{layer.title}
											</p>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Toggle Button -->
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