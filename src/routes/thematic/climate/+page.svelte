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
	import ImageLayer from 'ol/layer/Image';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import ImageWMS from 'ol/source/ImageWMS';
	import { defaults as defaultInteractions } from 'ol/interaction';
	import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
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
		ChevronsLeft,
		ChevronsRight,
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
	let playInterval: ReturnType<typeof setInterval> | null = null;

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
		console.log('Updating map for time:', timePeriods[timeIndex]);

		// Update map layers through the unified layer management system
		if (currentDataset?.control_type === 'time_slider') {
			updateMapLayers();
		}
	}

	// Watch for dataset or control state changes and update map layers accordingly
	$effect(() => {
		// This will trigger when currentDataset, trendAnalysisMode, temperatureRiseThreshold, or currentTimeIndex changes
		console.log('Dataset changed:', currentDataset?.id || 'null');
		updateMapLayers();
	});

	// Watch for trend analysis mode changes
	$effect(() => {
		if (currentDataset && currentDataset.control_type === 'radio') {
			updateMapLayers();
		}
	});

	// Watch for temperature rise threshold changes
	$effect(() => {
		if (currentDataset && currentDataset.control_type === 'temperature_threshold') {
			updateMapLayers();
		}
	});

	// Watch for time slider changes
	$effect(() => {
		if (currentDataset && currentDataset.control_type === 'time_slider') {
			updateMapLayers();
		}
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
				interactions: defaultInteractions({
					mouseWheelZoom: false
				}),
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
				// Load default layers after map is initialized
				setTimeout(() => {
					updateMapLayers();
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
		if (playInterval) {
			clearInterval(playInterval);
		}
		if (map) {
			map.dispose();
		}
	});

	// Helper function to generate time series layers
	function generateTimeSeriesLayers(startYear: number, endYear: number) {
		const layers: any = {};

		// Create different ArcGIS layers for different year ranges to simulate temporal data
		const layerConfigs = [
			{ years: [1995, 1999], layerIndex: 0, service: 'HKH/Landcover' },
			{ years: [2000, 2004], layerIndex: 5, service: 'HKH/Landcover' },
			{ years: [2005, 2009], layerIndex: 10, service: 'HKH/Landcover' },
			{ years: [2010, 2014], layerIndex: 15, service: 'HKH/Landcover' },
			{ years: [2015, 2019], layerIndex: 20, service: 'HKH/Landcover' },
			{ years: [2020, 2024], layerIndex: 21, service: 'HKH/Landcover' }
		];

		for (let year = startYear; year <= endYear; year++) {
			// Find which layer config this year belongs to
			const config =
				layerConfigs.find((c) => year >= c.years[0] && year <= c.years[1]) || layerConfigs[0];

			layers[year.toString()] = {
				id: `temp-time-series-${year}`,
				name: `Annual Temperature ${year}`,
				url: `https://geoapps.icimod.org/icimodarcgis/rest/services/${config.service}/MapServer`,
				layerIndex: config.layerIndex,
				mapserver: 'arcgis'
			};
		}
		return layers;
	}

	// Improved climate dataset structure for better map layer management
	const climateDataset = [
		{
			id: 'temp-trend-30y',
			title: 'Annual Temperature Trend Analysis',
			description: 'Temperature trend analysis with overall vs significant trend options',
			control_type: 'radio',
			control_options: ['overall', 'significant'],
			default_option: 'overall',
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
			map_layers: {
				overall: [
					{
						id: 'temp-trend-overall',
						name: 'Overall Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Landcover/MapServer',
						layerIndex: 21,
						mapserver: 'arcgis'
					}
				],
				significant: [
					{
						id: 'temp-trend-overall',
						name: 'Significant Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Landcover/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'temp-rise-decade',
			title: 'Regional Temperature Rise Analysis',
			description: 'Temperature rise analysis with different threshold options',
			control_type: 'temperature_threshold',
			control_options: ['0.5', '1.5', '2.5'],
			default_option: '1.5',
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
			map_layers: {
				'0.5': [
					{
						id: 'temp-trend-overall',
						name: 'Earthquake Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Earthquake/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				],
				'1.5': [
					{
						id: 'temp-planned-overall',
						name: 'Earthquake Planned Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/HydropowerPlant/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					},
					{
						id: 'temp-operational-overall',
						name: 'Earthquake Operational Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Earthquake/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					},
					{
						id: 'temp-construction-overall',
						name: 'Earthquake Construction Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Earthquake/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				'2.5': [
					{
						id: 'temp-fires-overall',
						name: 'Earthquake Fires Temperature Trend',
						url: 'https://geoapps.icimod.org/arcgis/rest/services/Nepal/NepalActiveFire/MapServer/',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'annual-temp-time-series',
			title: 'Annual Temperature Time Series',
			description: 'Time series analysis of annual temperature with temporal controls',
			control_type: 'time_slider',
			time_dimension: {
				start_year: 1995,
				end_year: 2024,
				step: 1,
				default_year: 2024,
				format: 'YYYY',
				animation_speed: 1000
			},
			charts: [
				{
					title: 'Annual Temperature Time Series',
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
								name: 'Annual Temperature (°C)',
								data: [
									4.7179, 4.7636, 3.9891, 5.3438, 5.5866, 4.8877, 5.418, 5.1678, 5.281, 5.2809,
									5.0343, 5.7049, 5.4111, 5.12, 5.6186, 5.8814, 5.2644, 4.9087, 5.378, 5.3068,
									5.5846, 6.3035, 6.0406, 5.7105, 5.3807, 5.6059, 6.0672, 6.0279, 5.9556, 6.4178
								]
							}
						]
					}
				}
			],
			map_layers: generateTimeSeriesLayers(1995, 2024)
		}
	];

	const questions = [
		{
			id: 'question-1',
			question: 'What is the annual average temperature trend over the past 30 years?',
			dataset_id: 'temp-trend-30y'
		},
		{
			id: 'question-2',
			question: 'Which areas have observed temperature rise more than 0.5 degrees in last decade?',
			dataset_id: 'temp-rise-decade'
		},
		{
			id: 'question-3',
			question: 'Which areas have observed temperature rise more than 1.5 degrees in last decade?',
			dataset_id: 'temp-rise-decade'
		},
		{
			id: 'question-4',
			question: 'Which areas have observed temperature rise more than 2.5 degrees in last decade?',
			dataset_id: 'temp-rise-decade'
		}
	];
	const information_layers = [
		{
			id: 'map-indicator-1',
			title: 'Annual Temperature Trend',
			dataset_id: 'temp-trend-30y'
		},
		{
			id: 'map-indicator-2',
			title: 'Temperature Rise',
			dataset_id: 'temp-rise-decade'
		},
		{
			id: 'map-indicator-3',
			title: 'Annual Temperature Time Series',
			dataset_id: 'annual-temp-time-series'
		}
	];
	// Track selected question - default to first question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection)
	let selectedInformationLayer = $state<string | null>(null);

	// Track radio button selection for trend analysis
	let trendAnalysisMode = $state<'overall' | 'significant'>('overall');

	// Track temperature rise threshold selection
	let temperatureRiseThreshold = $state<'0.5' | '1.5' | '2.5'>('1.5');

	// Layout states: 'default' | 'hide-left' | 'left-full'
	let layoutState = $state('default');

	// Track questions panel state
	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Get current dataset based on selected question or information layer
	let currentDataset = $derived.by(() => {
		// First priority: selected question
		if (selectedQuestionId) {
			const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
			if (selectedQuestion?.dataset_id) {
				return climateDataset.find((item) => item.id === selectedQuestion.dataset_id);
			}
		}

		// Second priority: selected information layer
		if (selectedInformationLayer) {
			const selectedLayer = information_layers.find(
				(layer) => layer.title === selectedInformationLayer
			);
			if (selectedLayer?.dataset_id) {
				return climateDataset.find((item) => item.id === selectedLayer.dataset_id);
			}
		}

		// Default: nothing selected, return null
		return null;
	});

	// Extract current data from dataset
	let currentCharts = $derived(currentDataset?.charts || []);
	let currentMapLayers = $derived(currentDataset?.map_layers);

	// Dynamic playback speed based on current dataset
	let playbackSpeed = $derived(currentDataset?.time_dimension?.animation_speed || 1000);

	// Dynamic time periods based on current dataset
	let timePeriods = $derived.by(() => {
		if (!currentDataset?.time_dimension) {
			// Default time periods for temperature data
			return Array.from({ length: 30 }, (_, i) => ({
				year: 1995 + i,
				label: (1995 + i).toString(),
				season: 'Annual'
			}));
		}

		const { start_year, end_year, step } = currentDataset.time_dimension;
		const periods = [];

		for (let year = start_year; year <= end_year; year += step) {
			periods.push({
				year: year,
				label: year.toString(),
				season: 'Annual'
			});
		}

		return periods;
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

	// Add layer to map based on layer configuration
	function addWMSLayer(layerConfig: any) {
		if (!map || !layerConfig) return;

		let layer;

		if (layerConfig.mapserver === 'arcgis') {
			// Create ArcGIS layer
			layer = new ImageLayer({
				visible: true,
				zIndex: 10,
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

	// Clear all climate data layers (keep base map)
	function clearClimateLayers() {
		if (!map) return;

		const layers = map.getLayers().getArray().slice(); // Create copy to avoid modification during iteration
		layers.forEach((layer) => {
			const layerId = layer.get('id');
			// Remove layers that have an ID (our custom layers), keep OSM base layer
			if (layerId && map) {
				map.removeLayer(layer);
			}
		});
	}

	// Update layers based on current dataset and control state
	function updateMapLayers() {
		if (!map) return;

		// Always clear existing climate layers first
		clearClimateLayers();

		// If no dataset is selected, stop here (layers are cleared)
		if (!currentDataset || !currentMapLayers) {
			console.log('No dataset selected - layers cleared');
			return;
		}

		// Get current control state and add appropriate layers
		if (currentDataset.control_type === 'radio') {
			// For radio controls, show layer based on selected mode
			const selectedLayers = currentMapLayers[trendAnalysisMode];
			if (selectedLayers) {
				if (Array.isArray(selectedLayers)) {
					addMultipleLayers(selectedLayers);
				} else {
					addWMSLayer(selectedLayers);
				}
			}
		} else if (currentDataset.control_type === 'temperature_threshold') {
			// For temperature threshold, show layer based on selected threshold
			const selectedLayers = currentMapLayers[temperatureRiseThreshold];
			if (selectedLayers) {
				if (Array.isArray(selectedLayers)) {
					addMultipleLayers(selectedLayers);
				} else {
					addWMSLayer(selectedLayers);
				}
			}
		} else if (currentDataset.control_type === 'time_slider') {
			// For time slider, show layer for current time period
			const currentYear = timePeriods[currentTimeIndex]?.year.toString() || '2024';
			const currentTimeLayer = currentMapLayers && (currentMapLayers as any)[currentYear];
			if (currentTimeLayer) {
				addWMSLayer(currentTimeLayer);
			}
		}
	}

	// Function to handle question selection
	function selectQuestion(questionId: string) {
		selectedQuestionId = questionId;
		// Clear information layer selection when selecting a question
		selectedInformationLayer = null;

		// Find the dataset and show appropriate controls
		const selectedQuestion = questions.find((q) => q.id === questionId);
		if (selectedQuestion?.dataset_id) {
			const dataset = climateDataset.find((item) => item.id === selectedQuestion.dataset_id);
			if (dataset?.control_type === 'time_slider') {
				isTimeSliderVisible = true;
			} else {
				isTimeSliderVisible = false;
			}

			// Set default control values based on dataset
			if (dataset?.control_type === 'radio' && dataset.default_option) {
				trendAnalysisMode = dataset.default_option as 'overall' | 'significant';
			} else if (dataset?.control_type === 'temperature_threshold' && dataset.default_option) {
				temperatureRiseThreshold = dataset.default_option as '0.5' | '1.5' | '2.5';
			}
		}

		console.log('Question selected:', questionId);
	}

	// Function to select information layer
	function selectInformationLayer(layerId: string) {
		// If clicking the same layer, deselect it
		if (selectedInformationLayer === layerId) {
			selectedInformationLayer = null;
			isTimeSliderVisible = false; // Hide controls when deselecting
			return;
		}

		// Simply select the layer to show appropriate controls
		selectedInformationLayer = layerId;
		// Clear question selection when selecting an information layer
		selectedQuestionId = '';

		// Find the dataset and set default control values
		const selectedLayer = information_layers.find((layer) => layer.title === layerId);
		if (selectedLayer?.dataset_id) {
			const dataset = climateDataset.find((item) => item.id === selectedLayer.dataset_id);

			// Show controls based on dataset type
			if (dataset?.control_type === 'time_slider') {
				isTimeSliderVisible = true;
			} else {
				isTimeSliderVisible = false;
			}

			// Set default control values based on dataset
			if (dataset?.control_type === 'radio' && dataset.default_option) {
				trendAnalysisMode = dataset.default_option as 'overall' | 'significant';
			} else if (dataset?.control_type === 'temperature_threshold' && dataset.default_option) {
				temperatureRiseThreshold = dataset.default_option as '0.5' | '1.5' | '2.5';
			}
		}

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
</script>

<!-- 3-Column Layout with Dynamic States -->
<div class="relative grid grid-cols-12 items-stretch gap-6">
	<!-- Floating Reopen Button - Only visible when left panel is hidden -->
	{#if layoutState === 'hide-left'}
		<button
			on:click={() => setLayoutState('default')}
			class="fixed top-[14rem] left-0 z-50 rounded-r-lg border border-l-0 border-slate-300 bg-white/50 p-1.5 text-slate-600 shadow-xl transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-2xl"
			title="Show Story Panel"
		>
			<ChevronsRight class="h-4 w-4" />
		</button>
	{/if}
	<!-- Left Sidebar - Story + Questions -->
	<div
		class="sticky top-6 col-span-3 h-fit max-h-[calc(100vh-16rem)] flex-1 space-y-6 overflow-y-auto"
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
							<ChevronsLeft class="h-4 w-4" />
						</button>
						<!-- Expand Story Button -->
						<button
							on:click={() => setLayoutState('left-full')}
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Expand Story"
						>
							<ChevronsRight class="h-4 w-4" />
						</button>
					{:else}
						<!-- Back to Default Button -->
						<button
							on:click={() => setLayoutState('default')}
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

				<!-- First Image - After first paragraph -->
				{#if layoutState === 'left-full'}
					<div class="flex justify-center">
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
					</div>
				{:else}
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
				{/if}

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

				<!-- Second Image - Before last paragraph -->
				{#if layoutState === 'left-full'}
					<div class="flex justify-center">
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
				{/if}

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
							{#if currentDataset && currentDataset.control_type === 'time_slider'}
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
							{:else if currentDataset && currentDataset.control_type === 'radio'}
								<!-- Always show expanded Analysis Mode Radio Buttons Panel -->
								<div
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm"
								>
									<!-- Analysis Label -->
									<div class="flex items-center space-x-2">
										<Layers class="h-4 w-4 text-indigo-600" />
										<span class="text-sm font-medium text-slate-700">Trend</span>
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
								</div>
							{:else if currentDataset && currentDataset.control_type === 'temperature_threshold'}
								<!-- Always show expanded Temperature Rise Threshold Panel -->
								<div
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm"
								>
									<!-- Temperature Rise Label -->
									<div class="flex items-center space-x-2">
										<div class="rounded-full bg-gradient-to-r from-red-500 to-orange-500 p-1">
											<div class="h-2 w-2 rounded-full bg-white"></div>
										</div>
										<span class="text-sm font-medium text-slate-700">Rise ≤</span>
									</div>

									<!-- Separator -->
									<div class="h-4 w-px bg-slate-300"></div>

									<!-- Temperature Threshold Options as Slider-like Radio Buttons -->
									<div class="flex items-center space-x-0.5 rounded-full bg-slate-100/80 p-1">
										<!-- 0.5°C Option -->
										<label class="relative cursor-pointer">
											<input
												type="radio"
												bind:group={temperatureRiseThreshold}
												value="0.5"
												class="peer sr-only"
											/>
											<div
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-green-600 peer-checked:hover:to-emerald-600 {temperatureRiseThreshold ===
												'0.5'
													? 'text-white'
													: 'text-slate-600'}"
											>
												0.5°C
											</div>
										</label>

										<!-- 1.5°C Option -->
										<label class="relative cursor-pointer">
											<input
												type="radio"
												bind:group={temperatureRiseThreshold}
												value="1.5"
												class="peer sr-only"
											/>
											<div
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-orange-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-yellow-600 peer-checked:hover:to-orange-600 {temperatureRiseThreshold ===
												'1.5'
													? 'text-white'
													: 'text-slate-600'}"
											>
												1.5°C
											</div>
										</label>

										<!-- 2.5°C Option -->
										<label class="relative cursor-pointer">
											<input
												type="radio"
												bind:group={temperatureRiseThreshold}
												value="2.5"
												class="peer sr-only"
											/>
											<div
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-red-600 peer-checked:hover:to-red-700 {temperatureRiseThreshold ===
												'2.5'
													? 'text-white'
													: 'text-slate-600'}"
											>
												2.5°C
											</div>
										</label>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Chart Section -->
					<div class="flex-1 rounded-xl bg-slate-50/30 p-6">
						<h3 class="mb-4 text-lg font-semibold text-slate-700">Climate Analytics</h3>
						<div class="rounded-lg bg-slate-50/50">
							{#if currentDataset && currentCharts && currentCharts.length > 0}
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
										<p class="text-sm">
											Select a question or information layer to view related charts
										</p>
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
<div class="fixed right-12 bottom-6 z-50 flex flex-col items-end">
	<div
		class="questions-panel mb-4 flex h-80 w-80 origin-bottom-right transform flex-col rounded-2xl border border-white/20 bg-white/95 px-4 py-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
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
			{#each questions as questionItem, index}
				<button
					class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
					questionItem.id
						? 'border-blue-500 bg-blue-50 shadow-md'
						: 'border-slate-200/50 bg-white/50 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-sm'}"
					on:click={() => selectQuestion(questionItem.id)}
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
		class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
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
