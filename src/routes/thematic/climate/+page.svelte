<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import climate_1 from '$lib/assets/images/climate_1.png';
	import climate_2 from '$lib/assets/images/climate_2.png';
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
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		HelpCircle,
		Play,
		Pause,
		SkipBack,
		SkipForward,
		Calendar
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

	// Time slider state management
	let isTimeSliderVisible = $state(false);
	let isPlaying = $state(false);
	let currentTimeIndex = $state(0);
	let playbackSpeed = $state(1000); // milliseconds between frames
	let playInterval: number | null = null;

	// Time periods for climate data (can be customized based on your data)
	const timePeriods = [
		{ year: 1995, label: '1995', season: 'Annual' },
		{ year: 1996, label: '1996', season: 'Annual' },
		{ year: 1997, label: '1997', season: 'Annual' },
		{ year: 1998, label: '1998', season: 'Annual' },
		{ year: 1999, label: '1999', season: 'Annual' },
		{ year: 2000, label: '2000', season: 'Annual' },
		{ year: 2001, label: '2001', season: 'Annual' },
		{ year: 2002, label: '2002', season: 'Annual' },
		{ year: 2003, label: '2003', season: 'Annual' },
		{ year: 2004, label: '2004', season: 'Annual' },
		{ year: 2005, label: '2005', season: 'Annual' },
		{ year: 2006, label: '2006', season: 'Annual' },
		{ year: 2007, label: '2007', season: 'Annual' },
		{ year: 2008, label: '2008', season: 'Annual' },
		{ year: 2009, label: '2009', season: 'Annual' },
		{ year: 2010, label: '2010', season: 'Annual' },
		{ year: 2011, label: '2011', season: 'Annual' },
		{ year: 2012, label: '2012', season: 'Annual' },
		{ year: 2013, label: '2013', season: 'Annual' },
		{ year: 2014, label: '2014', season: 'Annual' },
		{ year: 2015, label: '2015', season: 'Annual' },
		{ year: 2016, label: '2016', season: 'Annual' },
		{ year: 2017, label: '2017', season: 'Annual' },
		{ year: 2018, label: '2018', season: 'Annual' },
		{ year: 2019, label: '2019', season: 'Annual' },
		{ year: 2020, label: '2020', season: 'Annual' },
		{ year: 2021, label: '2021', season: 'Annual' },
		{ year: 2022, label: '2022', season: 'Annual' },
		{ year: 2023, label: '2023', season: 'Annual' },
		{ year: 2024, label: '2024', season: 'Annual' }
	];

	// Time slider functions
	function toggleTimeSlider() {
		isTimeSliderVisible = !isTimeSliderVisible;
		if (!isTimeSliderVisible && isPlaying) {
			stopPlayback();
		}
	}

	function togglePlayback() {
		if (isPlaying) {
			stopPlayback();
		} else {
			startPlayback();
		}
	}

	function startPlayback() {
		if (playInterval) clearInterval(playInterval);

		isPlaying = true;
		playInterval = setInterval(() => {
			if (currentTimeIndex < timePeriods.length - 1) {
				currentTimeIndex++;
				updateMapForTime(currentTimeIndex);
			} else {
				// Loop back to start or stop
				currentTimeIndex = 0;
				updateMapForTime(currentTimeIndex);
				// Uncomment next line to stop at end instead of looping
				// stopPlayback();
			}
		}, playbackSpeed);
	}

	function stopPlayback() {
		if (playInterval) {
			clearInterval(playInterval);
			playInterval = null;
		}
		isPlaying = false;
	}

	function goToTime(index: number) {
		if (index >= 0 && index < timePeriods.length) {
			currentTimeIndex = index;
			updateMapForTime(index);
		}
	}

	function stepBackward() {
		if (currentTimeIndex > 0) {
			goToTime(currentTimeIndex - 1);
		}
	}

	function stepForward() {
		if (currentTimeIndex < timePeriods.length - 1) {
			goToTime(currentTimeIndex + 1);
		}
	}

	function updateMapForTime(timeIndex: number) {
		// This function would update the map layers based on the selected time
		// You can modify WMS parameters or switch between different temporal layers
		console.log('Updating map for time:', timePeriods[timeIndex]);

		// Example: Update WMS layer with time parameter
		if (map && selectedInformationLayer) {
			const layers = map.getLayers().getArray();
			layers.forEach((layer) => {
				if (layer.get('id')) {
					const source = (layer as TileLayer<any>).getSource();
					if (source && typeof (source as any).updateParams === 'function') {
						// Update WMS parameters with time
						(source as any).updateParams({
							...(source as any).getParams(),
							TIME: timePeriods[timeIndex].year.toString()
						});
					}
				}
			});
		}
	}

	// Function to handle trend analysis mode changes
	function updateMapForTrendMode(mode: 'overall' | 'significant') {
		console.log('Updating map for trend analysis mode:', mode);

		// Update map layers based on the selected trend analysis mode
		if (map && selectedInformationLayer === 'Annual Temperature Trend') {
			const layers = map.getLayers().getArray();
			layers.forEach((layer) => {
				if (layer.get('id')) {
					const source = (layer as TileLayer<any>).getSource();
					if (source && typeof (source as any).updateParams === 'function') {
						// Update WMS parameters with analysis mode
						(source as any).updateParams({
							...(source as any).getParams(),
							STYLES: mode === 'significant' ? 'significant_trend_style' : 'overall_trend_style'
						});
					}
				}
			});
		}
	}

	// Watch for trend analysis mode changes
	$effect(() => {
		updateMapForTrendMode(trendAnalysisMode);
	});

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

	// Cleanup on destroy
	onDestroy(() => {
		if (playInterval) {
			clearInterval(playInterval);
		}
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
					name: 'Annual Temperature Time Series',
					wms_url: 'https://example.com/geoserver/climate/wms',
					layer_name: 'climate:temp_anomaly_30y'
				},
				{
					name: 'Temperature Rise',
					wms_url: 'https://example.com/geoserver/climate/wms',
					layer_name: 'climate:temp_anomaly_30y'
				}
				// {
				// 	name: 'Temp Rise > 2.5°C',
				// 	wms_url: 'https://example.com/geoserver/climate/wms',
				// 	layer_name: 'climate:temp_anomaly_30y'
				// }
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

	const questions = [
		{
			id: 'question-1',
			question: 'What is the annual average temperature trend over the past 30 years?'
		},
		{
			id: 'question-2',
			question: 'Which areas have observed temperature rise more than 0.5 degrees in last decade?'
		},
		{
			id: 'question-3',
			question: 'Which areas have observed temperature rise more than 1.5 degrees in last decade?'
		},
		{
			id: 'question-4',
			question: 'Which areas have observed temperature rise more than 2.5 degrees in last decade?'
		}
	];
	const information_layers = [
		{
			id: 'map-indicator-1',
			title: 'Annual Temperature Trend'
		},
		{
			id: 'map-indicator-2',
			title: 'Temperature Rise'
		},
		{
			id: 'map-indicator-3',
			title: 'Annual Temperature Time Series'
		}
	];
	const map_indicators = [
		{
			map_data: [],
			control: '',
			chart_data: [],
			question: '',
			info_layer: ''
		}
	];
	// Extract questions for UI (now simpler)
	const climateQuestions = climateDataset.map((item) => ({
		id: item.id,
		question: item.question
	}));

	// Track selected question - default to first question
	let selectedQuestionId = $state('temp-trend-30y');

	// Track selected information layer (single selection)
	let selectedInformationLayer = $state<string | null>('Annual Temperature Trend');

	// Track radio button selection for trend analysis
	let trendAnalysisMode = $state<'overall' | 'significant'>('overall');

	// Track map data container collapse state
	let isMapDataCollapsed = $state(false);

	// Track left sidebar collapsed state
	let isLeftSidebarCollapsed = $state(false);

	// Layout states: 'default' | 'hide-left' | 'left-full'
	let layoutState = $state('default');

	// Track questions panel state
	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Get current dataset based on selected question
	let currentDataset = $derived(
		selectedQuestionId
			? climateDataset.find((item) => item.id === selectedQuestionId)
			: climateDataset[0]
	);

	// Extract current data from dataset
	let currentCharts = $derived(currentDataset?.charts || []);
	let currentMapData = $derived(currentDataset?.map_data);

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

		// Reset selected layer when question changes
		if (selectedInformationLayer) {
			removeWMSLayer(selectedInformationLayer);
			selectedInformationLayer = null;
		}
	}

	// Function to select information layer
	function selectInformationLayer(layerId: string) {
		// If clicking the same layer, deselect it
		if (selectedInformationLayer === layerId) {
			selectedInformationLayer = null;
			isTimeSliderVisible = false; // Hide controls when deselecting
			return;
		}

		// Find the corresponding map data for this information layer
		const layerData = currentMapData?.find((layer) => layer.name === layerId);
		if (layerData) {
			selectedInformationLayer = layerId;
			isTimeSliderVisible = false; // Reset control visibility when switching layers
			console.log('Information layer selected:', layerId);
		} else {
			console.error('Map data not found for information layer:', layerId);
		}
	}

	// Function to cycle through layout states
	function toggleLayoutState() {
		if (layoutState === 'default') {
			layoutState = 'hide-left';
		} else if (layoutState === 'hide-left') {
			layoutState = 'left-full';
		} else {
			layoutState = 'default';
		}
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
</script>

<!-- 3-Column Layout with Dynamic States -->
<div class="relative grid grid-cols-12 items-stretch gap-6">
	<!-- Floating Reopen Button - Only visible when left panel is hidden -->
	{#if layoutState === 'hide-left'}
		<button
			on:click={() => setLayoutState('default')}
			class="fixed top-1/2 left-0 z-50 -translate-y-1/2 rounded-r-lg border border-l-0 border-slate-300 bg-white p-3 text-slate-700 shadow-xl transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-2xl"
			title="Show Story Panel"
		>
			<ChevronRight class="h-5 w-5" />
		</button>
	{/if}
	<!-- Left Sidebar - Story + Questions -->
	<div
		class=" top-6 col-span-3 h-fit flex-1 space-y-6"
		class:hidden={layoutState === 'hide-left'}
		class:col-span-12={layoutState === 'left-full'}
	>
		<!-- Story Section -->
		<div class="rounded-2xl border border-white/20 bg-white/70 p-6">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
						<Cloud class="h-5 w-5 text-white" />
					</div>
					<h3
						class="{layoutState === 'left-full'
							? 'text-2xl'
							: 'text-lg'} font-bold text-slate-800 transition-all duration-300"
					>
						Climate Change in HKH
					</h3>
				</div>
				<div class="flex items-center space-x-2">
					{#if layoutState !== 'left-full'}
						<!-- Hide Left Panel Button -->
						<button
							on:click={() => setLayoutState('hide-left')}
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Hide Story Panel"
						>
							<ChevronLeft class="h-4 w-4" />
						</button>
						<!-- Expand Story Button -->
						<button
							on:click={() => setLayoutState('left-full')}
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Expand Story"
						>
							<ChevronRight class="h-4 w-4" />
						</button>
					{:else}
						<!-- Back to Default Button -->
						<button
							on:click={() => setLayoutState('default')}
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Back to Default"
						>
							<ChevronLeft class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>

			<div
				class="{layoutState === 'left-full'
					? 'space-y-6'
					: 'space-y-4'} transition-all duration-300"
			>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Historically, the climate of the HKH has experienced significant changes that are closely
					related to the rise and fall of regional cultures and civilizations. The region is one of
					the most climate-sensitive mountain systems in the world. Known as the “Third Pole” for
					its vast ice reserves, the HKH plays a critical role in regulating Asia’s climate and
					serves as the source of ten major river systems that sustain the livelihoods of over 1.6
					billion people downstream. However, the impacts of climate change are being felt here more
					intensely than the global average, with temperatures rising significantly faster than
					elsewhere.
				</p>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					In the future, even if global warming is kept to 1.5 °C, warming in the Hindu Kush
					Himalaya (HKH) region will likely be at least 0.3 °C higher, and in the northwest Himalaya
					and Karakoram at least 0.7 °C higher. Such large warming could trigger a multitude of
					biophysical and socio-economic impacts, such as biodiversity loss, increased glacial
					melting, and less predictable water availability—all of which will impact livelihoods and
					well-being in the HKH.
				</p>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Glaciers in the HKH are retreating at unprecedented rates, snow cover is diminishing, and
					permafrost is degrading, all of which are altering river flows and threatening water
					security.
				</p>

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Climate change is also amplifying the frequency and severity of extreme weather events,
					including floods, droughts, and landslides, which pose immediate risks to lives,
					infrastructure, and economies. The loss of cryospheric mass not only threatens long-term
					water availability but also increases the risk of glacial lake outburst floods (GLOFs)
					that can devastate downstream communities.
				</p>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					The impacts extend beyond the physical environment to agriculture, biodiversity, and
					cultural heritage. Shifts in seasonal patterns are affecting crop yields, while warming
					temperatures are pushing species to higher altitudes, disrupting delicate alpine
					ecosystems. Many communities in the HKH rely on climate-sensitive livelihoods such as
					farming, herding, and tourism, making them particularly vulnerable.
				</p>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Addressing climate change in the HKH requires urgent, coordinated, and region-wide action.
					This includes investing in climate-resilient infrastructure, expanding early warning
					systems, improving water management, and enhancing scientific monitoring of glaciers and
					weather patterns. Regional cooperation is essential for sharing data, aligning adaptation
					strategies, and managing shared water resources sustainably. Equally important is
					empowering local communities with knowledge, technology, and resources to adapt to
					changing conditions while preserving the environmental and cultural richness of the HKH.
				</p>
			</div>

			<!-- Images Section - Responsive Layout -->
			<div class="mt-6 {layoutState === 'left-full' ? 'space-y-6' : 'space-y-3'}">
				{#if layoutState === 'left-full'}
					<!-- Full Width Layout - One Image Per Row -->
					<div class="flex flex-col items-center gap-6">
						<div
							class="w-fit overflow-hidden rounded-xl border border-slate-200/50 bg-white/50 shadow-lg"
						>
							<img src={climate_1} alt="Himalayan glacial retreat" class="h-80 object-contain" />
							<div class="p-4">
								<p class="text-center text-sm leading-relaxed text-slate-700">
									<span
										>We see <span class="font-semibold text-slate-800"
											>less snow on the mountain peaks
										</span> in recent years
									</span>
								</p>
							</div>
						</div>
						<div
							class="w-fit overflow-hidden rounded-xl border border-slate-200/50 bg-white/50 shadow-lg"
						>
							<img src={climate_2} alt="Climate impacts" class="h-80 object-contain" />
							<div class="p-4">
								<p class="text-center text-sm leading-relaxed text-slate-700">
									<span>
										<span class="font-semibold text-slate-800"> Flooded street in Kathmandu </span> after
										a less than an hour heavy downpour</span
									>
								</p>
							</div>
						</div>
					</div>
				{:else}
					<!-- Default Layout - Stacked Images -->
					<div class="space-y-3">
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
				{/if}
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

							<!-- Dynamic Control Panel at Bottom -->
							{#if selectedInformationLayer === 'Annual Temperature Time Series'}
								{#if !isTimeSliderVisible}
									<!-- Time Control Toggle Button -->
									<button
										on:click={toggleTimeSlider}
										class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-2 rounded-full border border-white/30 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl"
										title="Show Time Controls"
									>
										<Calendar class="h-4 w-4" />
										<span>Time</span>
									</button>
								{:else}
									<!-- Expanded Time Slider Panel -->
									<div
										class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-3 rounded-full border border-white/30 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm"
									>
										<!-- Time Label -->
										<div class="flex items-center space-x-2">
											<Calendar class="h-4 w-4 text-indigo-600" />
											<span class="text-sm font-medium text-slate-700">Time</span>
										</div>

										<!-- Separator -->
										<div class="h-4 w-px bg-slate-300"></div>

										<!-- Step Backward -->
										<button
											on:click={stepBackward}
											disabled={currentTimeIndex === 0}
											class="rounded-full p-1.5 text-slate-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
											title="Previous Year"
										>
											<SkipBack class="h-3.5 w-3.5" />
										</button>

										<!-- Play/Pause -->
										<button
											on:click={togglePlayback}
											class="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-2 text-white shadow-sm transition-all duration-200 hover:from-indigo-600 hover:to-purple-600 hover:shadow-md"
											title={isPlaying ? 'Pause' : 'Play'}
										>
											{#if isPlaying}
												<Pause class="h-3.5 w-3.5" />
											{:else}
												<Play class="h-3.5 w-3.5" />
											{/if}
										</button>

										<!-- Step Forward -->
										<button
											on:click={stepForward}
											disabled={currentTimeIndex === timePeriods.length - 1}
											class="rounded-full p-1.5 text-slate-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
											title="Next Year"
										>
											<SkipForward class="h-3.5 w-3.5" />
										</button>

										<!-- Compact Time Slider -->
										<div class="flex items-center space-x-2">
											<span class="min-w-[2.5rem] text-xs font-medium text-indigo-600"
												>{timePeriods[currentTimeIndex].label}</span
											>
											<input
												type="range"
												min="0"
												max={timePeriods.length - 1}
												bind:value={currentTimeIndex}
												on:input={(e) => goToTime(parseInt((e.target as HTMLInputElement).value))}
												class="compact-slider w-32"
											/>
										</div>

										<!-- Close Button -->
										<button
											on:click={toggleTimeSlider}
											class="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
											title="Collapse"
										>
											<ChevronDown class="h-3.5 w-3.5" />
										</button>
									</div>
								{/if}
							{:else if selectedInformationLayer === 'Annual Temperature Trend'}
								{#if !isTimeSliderVisible}
									<!-- Analysis Control Toggle Button -->
									<button
										on:click={() => (isTimeSliderVisible = !isTimeSliderVisible)}
										class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-2 rounded-full border border-white/30 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl"
										title="Show Analysis Options"
									>
										<Layers class="h-4 w-4" />
										<span>Analysis</span>
									</button>
								{:else}
									<!-- Expanded Analysis Mode Radio Buttons Panel -->
									<div
										class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm"
									>
										<!-- Analysis Label -->
										<div class="flex items-center space-x-2">
											<Layers class="h-4 w-4 text-indigo-600" />
											<span class="text-sm font-medium text-slate-700">Analysis</span>
										</div>

										<!-- Separator -->
										<div class="h-4 w-px bg-slate-300"></div>

										<!-- Overall Option -->
										<label class="flex cursor-pointer items-center space-x-2">
											<input
												type="radio"
												bind:group={trendAnalysisMode}
												value="overall"
												class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
											/>
											<span class="text-sm font-medium text-slate-700">Overall</span>
										</label>

										<!-- Significant Option -->
										<label class="flex cursor-pointer items-center space-x-2">
											<input
												type="radio"
												bind:group={trendAnalysisMode}
												value="significant"
												class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
											/>
											<span class="text-sm font-medium text-slate-700">Significant</span>
										</label>

										<!-- Close Button -->
										<button
											on:click={() => (isTimeSliderVisible = false)}
											class="ml-2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
											title="Collapse"
										>
											<ChevronDown class="h-3.5 w-3.5" />
										</button>
									</div>
								{/if}
							{/if}
						</div>
					</div>

					<!-- Chart Section -->
					<div class="flex-1 rounded-xl bg-slate-50/30 p-6">
						<h3 class="mb-4 text-lg font-semibold text-slate-700">Climate Analytics</h3>
						<div class="rounded-lg bg-slate-50/50">
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

				<!-- Right part: Information Layer and Questions -->
				<div class="w-80 flex-shrink-0">
					<div
						class=" top-6 min-h-[calc(100vh-16rem)] flex-1 flex-col rounded-2xl border border-white/20 bg-white/70 pr-4 pl-4"
					>
						<!-- Information Layer Header -->
						<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
							<div class="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
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
											on:click={() => selectInformationLayer(layer.title)}
											class="w-full rounded-lg border p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-md {selectedInformationLayer ===
											layer.title
												? 'border-green-300 bg-gradient-to-r from-green-50/90 to-emerald-50/90 shadow-md'
												: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80 hover:border-slate-300/70 hover:bg-slate-100/90'}"
										>
											<div class="flex items-start space-x-3 text-left">
												<div class="flex-1">
													<h4
														class="text-sm font-medium {selectedInformationLayer === layer.title
															? 'text-green-800'
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
<div class="fixed right-6 bottom-6 z-50 flex flex-col items-end">
	<div
		class="questions-panel mb-4 flex h-80 w-60 origin-bottom-right transform flex-col rounded-lg bg-white/95 p-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
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

		<div class="max-h-60 flex-1 space-y-3 overflow-y-auto">
			{#each climateQuestions as questionItem, index}
				<button
					class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
					questionItem.id
						? 'border-blue-500 bg-blue-50 shadow-md'
						: 'border-slate-200/50 bg-white/50 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-sm'}"
					on:click={() => selectQuestion(questionItem.id, questionItem.question)}
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
		on:click={toggleQuestionsPanel}
		class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg transition-all duration-300 hover:scale-110"
		aria-label="Toggle questions panel"
	>
		<HelpCircle class="h-6 w-6" />
	</button>
</div>

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

	/* Compact Time Slider Styles */
	.compact-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(to right, #e2e8f0 0%, #cbd5e1 100%);
		outline: none;
		transition: all 0.3s ease;
	}

	.compact-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		cursor: pointer;
		border: 1px solid white;
		box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
		transition: all 0.2s ease;
	}

	.compact-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
	}

	.compact-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		cursor: pointer;
		border: 1px solid white;
		box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
		transition: all 0.2s ease;
	}

	.compact-slider::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
	}
</style>
