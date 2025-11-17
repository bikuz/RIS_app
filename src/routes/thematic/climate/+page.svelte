<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import XYZ from 'ol/source/XYZ';
	import { fromLonLat } from 'ol/proj';
	import TileWMS from 'ol/source/TileWMS';
	import ImageLayer from 'ol/layer/Image';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import ImageWMS from 'ol/source/ImageWMS';
	import { defaults as defaultInteractions } from 'ol/interaction';
	import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
	import 'ol/ol.css';
	import Chart from '$lib/components/Chart.svelte';
	import lightMap from '$lib/assets/images/basemaps/light-map.png';
	import darkMap from '$lib/assets/images/basemaps/dark-map.png';
	import osmMap from '$lib/assets/images/basemaps/osm-map.png';
	import satelliteMap from '$lib/assets/images/basemaps/satellite-map.png';
	import terrainMap from '$lib/assets/images/basemaps/terrain-map.png';
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
		Calendar,
		List,
		House,
		MapIcon
	} from '@lucide/svelte';
	import FullScreen from 'ol/control/FullScreen';
	import ScaleLine from 'ol/control/ScaleLine';
	import { defaults as defaultControls } from 'ol/control/defaults.js';

	let { currentTopic = 'climate', width = '100%', height = '400px' } = $props();

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates (optimized for full HKH view)
	const HKH_CENTER = [82.94924, 27.6382055]; // Longitude, Latitude - adjusted for better HKH coverage
	const HKH_ZOOM = 4.8; // Reduced zoom to show more of the HKH region

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

	// Time slider state management
	let isTimeSliderVisible = $state(false);
	let isPlaying = $state(false);
	let currentTimeIndex = $state(0);
	let playInterval: ReturnType<typeof setInterval> | null = null;

	// Track iframe loading state
	let isStoryMapLoading = $state(true);

	// Generate iframe key based on layout state to force reload on layout change
	let iframeKey = $state(0);

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

		// Note: Map layers will be updated automatically by the main effect
		// No need to call updateMapLayers() here as it would cause duplicate updates
	}

	// Single consolidated effect for all map layer updates
	$effect(() => {
		// This will trigger when any of these state variables change
		const dataset = currentDataset;
		const trendMode = trendAnalysisMode;
		const tempThreshold = temperatureRiseThreshold;
		const timeIndex = currentTimeIndex;
		const season = selectedSeason;

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

	// Track if we've already set the default for the current dataset
	let hasSetDefaultForDataset = $state<string | null>(null);

	// Separate effect ONLY for setting default time index when dataset changes
	$effect(() => {
		// Watch for dataset changes to set default time index
		if (currentDataset && currentDataset.control_type === 'time_slider') {
			const datasetId = currentDataset.id;
			const newDefaultIndex = defaultTimeIndex;

			// Only set default if this is a new dataset or we haven't set it for this dataset yet
			if (hasSetDefaultForDataset !== datasetId && newDefaultIndex >= 0) {
				console.log(
					'Setting time index to default:',
					newDefaultIndex,
					'for year:',
					timePeriods[newDefaultIndex]?.year
				);
				currentTimeIndex = newDefaultIndex;
				hasSetDefaultForDataset = datasetId;
			}
		} else {
			// Reset when switching away from time slider datasets
			hasSetDefaultForDataset = null;
		}
	});

	function initializeMap() {
		if (!mapContainer) return;

		// Small delay to ensure container has proper dimensions
		setTimeout(() => {
			// Create custom fullscreen control that includes our custom elements
			const fullScreenControl = new FullScreen({
				source: mapContainer.parentElement || mapContainer // Use the parent container that includes our custom controls, fallback to mapContainer
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
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (playInterval) {
			clearInterval(playInterval);
		}
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

	// Improved climate dataset structure for better map layer management
	const climateDataset = [
		// {
		// 	id: 'temp-trend-10y',
		// 	title: 'Overall Annual Temperature Trend Analysis of 10 Years',

		// 	description: 'Temperature trend analysis with overall vs significant trend options',
		// 	control_type: 'radio',
		// 	control_options: ['overall', 'significant'],
		// 	default_option: 'overall',
		// 	charts: [
		// 		{
		// 			title: 'Distribution of Annual Mean Temperature Trends (°C/decade)',
		// 			chart_type: 'column',
		// 			yAxisTitle: 'Pixel count',
		// 			chart_data: {
		// 				categories: [
		// 					// '-0.08 to -0.05',
		// 					// '-0.05 to -0.02',
		// 					// '-0.02 to 0.01',
		// 					// '0.01 to 0.03',
		// 					// '0.03 to 0.06',
		// 					// '0.06 to 0.09',
		// 					// '0.09 to 0.11',
		// 					// '0.11 to 0.14',
		// 					// '0.14 to 0.17',
		// 					// '0.17 to 0.19',
		// 					// '0.19 to 0.22',
		// 					// '0.22 to 0.25',
		// 					// '0.25 to 0.27',
		// 					// '0.27 to 0.30',
		// 					// '0.30 to 0.33',
		// 					// '0.33 to 0.35',
		// 					// '0.35 to 0.38',
		// 					// '0.38 to 0.41',
		// 					// '0.41 to 0.43',
		// 					// '0.43 to 0.46',
		// 					// '0.46 to 0.49',
		// 					// '0.49 to 0.52',
		// 					// '0.52 to 0.54',
		// 					// '0.54 to 0.57',
		// 					// '0.57 to 0.60',
		// 					// '0.60 to 0.62',
		// 					// '0.62 to 0.65',
		// 					// '0.65 to 0.68',
		// 					// '0.68 to 0.70',
		// 					// '0.70 to 0.73',
		// 					// '0.73 to 0.76',
		// 					// '0.76 to 0.78',
		// 					// '0.78 to 0.81',
		// 					// '0.81 to 0.84',
		// 					// '0.84 to 0.86',
		// 					// '0.86 to 0.89',
		// 					// '0.89 to 0.92',
		// 					// '0.92 to 0.95',
		// 					// '0.95 to 0.97',
		// 					// '0.97 to 1.00',
		// 					// '1.00 to 1.03',
		// 					// '1.03 to 1.05',
		// 					// '1.05 to 1.08',
		// 					// '1.08 to 1.11',
		// 					// '1.11 to 1.13',
		// 					// '1.13 to 1.16',
		// 					// '1.16 to 1.19',
		// 					// '1.19 to 1.21',
		// 					// '1.21 to 1.24',
		// 					// '1.24 to 1.27'
		// 					'-0.31 to -0.28',
		// 					'-0.28 to -0.25',
		// 					'-0.25 to -0.22',
		// 					'-0.22 to -0.19',
		// 					'-0.19 to -0.16',
		// 					'-0.16 to -0.13',
		// 					'-0.13 to -0.10',
		// 					'-0.10 to -0.07',
		// 					'-0.07 to -0.04',
		// 					'-0.04 to -0.02',
		// 					'-0.02 to 0.01',
		// 					'0.01 to 0.04',
		// 					'0.04 to 0.07',
		// 					'0.07 to 0.10',
		// 					'0.10 to 0.13',
		// 					'0.13 to 0.16',
		// 					'0.16 to 0.19',
		// 					'0.19 to 0.22',
		// 					'0.22 to 0.25',
		// 					'0.25 to 0.28',
		// 					'0.28 to 0.31',
		// 					'0.31 to 0.34',
		// 					'0.34 to 0.37',
		// 					'0.37 to 0.40',
		// 					'0.40 to 0.43',
		// 					'0.43 to 0.46',
		// 					'0.46 to 0.49',
		// 					'0.49 to 0.52',
		// 					'0.52 to 0.55',
		// 					'0.55 to 0.57',
		// 					'0.57 to 0.60',
		// 					'0.60 to 0.63',
		// 					'0.63 to 0.66',
		// 					'0.66 to 0.69',
		// 					'0.69 to 0.72',
		// 					'0.72 to 0.75',
		// 					'0.75 to 0.78',
		// 					'0.78 to 0.81',
		// 					'0.81 to 0.84',
		// 					'0.84 to 0.87',
		// 					'0.87 to 0.90',
		// 					'0.90 to 0.93',
		// 					'0.93 to 0.96',
		// 					'0.96 to 0.99',
		// 					'0.99 to 1.02',
		// 					'1.02 to 1.05',
		// 					'1.05 to 1.08',
		// 					'1.08 to 1.11',
		// 					'1.11 to 1.14',
		// 					'1.14 to 1.16'
		// 				],

		// 				plotOptions: {
		// 					column: {
		// 						pointPadding: 0,
		// 						groupPadding: 0,
		// 						borderWidth: 0,
		// 						grouping: false,
		// 						pointPlacement: 0
		// 					}
		// 				},
		// 				series: [
		// 					{
		// 						name: 'Overall trends',
		// 						data: [
		// 							// 1, 3, 4, 8, 13, 25, 15, 59, 170, 158, 272, 342, 288, 523, 475, 322, 464, 426, 296,
		// 							// 403, 389, 346, 216, 301, 255, 155, 197, 114, 82, 86, 61, 50, 55, 46, 22, 34, 25,
		// 							// 19, 8, 13, 6, 4, 3, 3, 1, 2, 2, 1, 2, 1
		// 							2,
		// 							1, 3, 1, 2, 9, 25, 57, 83, 113, 187, 298, 460, 638, 986, 1628, 2395, 2655, 2443,
		// 							2395, 2503, 2570, 2418, 2015, 1643, 1578, 1503, 1470, 1410, 1267, 1220, 979, 763,
		// 							679, 580, 498, 439, 383, 343, 276, 218, 172, 142, 115, 70, 42, 28, 14, 9, 10
		// 						],
		// 						color: '#3B82F6', // Modern blue
		// 						zIndex: 1
		// 					},
		// 					{
		// 						name: 'Significant trends',
		// 						data: [
		// 							// 0, 0, 0, 0, 0, 0, 0, 8, 73, 102, 174, 199, 201, 392, 384, 273, 421, 399, 284, 389,
		// 							// 378, 341, 211, 299, 251, 155, 195, 114, 82, 86, 61, 50, 55, 46, 22, 34, 25, 19, 8,
		// 							// 13, 6, 4, 3, 3, 1, 2, 2, 1, 2, 1
		// 							0,
		// 							0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 58, 364, 916, 1188, 1207, 1467, 1843, 2109,
		// 							2113, 1803, 1514, 1472, 1433, 1422, 1371, 1248, 1201, 969, 754, 672, 575, 495,
		// 							434, 377, 339, 272, 215, 165, 134, 113, 68, 38, 28, 14, 9, 10
		// 						],
		// 						color: '#EF4444', // Modern red
		// 						zIndex: 2
		// 					}
		// 				]
		// 			}
		// 		}
		// 	],
		// 	map_layers: {
		// 		overall: [
		// 			{
		// 				id: 'temp-trend-overall',
		// 				name: 'Overall Temperature Trend',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
		// 				layerIndex: 0,
		// 				mapserver: 'arcgis'
		// 			}
		// 		],
		// 		significant: [
		// 			{
		// 				id: 'temp-trend-significant',
		// 				name: 'Significant Temperature Trend',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
		// 				layerIndex: 5,
		// 				mapserver: 'arcgis'
		// 			}
		// 		]
		// 	}
		// },
		{
			id: 'temp-trend-30y',
			title: 'Annual Temperature Trend Analysis',
			description: 'Temperature trend analysis with overall vs significant trend options',
			control_type: 'threshold-control',
			control_options: ['0.5', '1.5', '2.0', '2.5'],
			default_option: '1.5',
			charts: [],
			map_layers: {
				'0.5': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				'1': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				'1.5': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				],
				'2': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 4,
						mapserver: 'arcgis'
					}
				],
				'2.5': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 5,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'temp-rise-decade',
			title: 'Regional Temperature Rise Analysis',
			description: 'Temperature rise analysis with different threshold options',
			control_type: 'threshold-control',
			control_options: ['0.5', '1.5', '2.0', '2.5'],
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
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				'1': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				'1.5': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				],
				'2': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
						layerIndex: 4,
						mapserver: 'arcgis'
					}
				],
				'2.5': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
						layerIndex: 5,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'annual-temp-anamoly-series',
			title: 'Time Series Temperature Anomaly',
			description: 'Time series analysis of annual temperature with temporal controls',
			control_type: 'time_slider',
			time_dimension: {
				start_year: 1995,
				end_year: 2024,
				step: 1,
				default_year: 2024,
				format: 'YYYY',
				animation_speed: 1500
			},

			charts: [
				{
					title: 'Temperature Anomalies (1995–2024)',
					chart_type: 'column',
					yAxisTitle: 'Temperature Anomaly (°C)',
					showLegend: false,
					chart_data: {
						categories: [
							1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
							2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
							2023, 2024
						],
						plotLines: [
							{
								color: '#666666',
								width: 1.3,
								value: 0, // baseline at 0°C
								zIndex: 5
							}
						],
						plotOptions: {
							column: {
								zones: [
									{
										value: 0, // values < 0
										color: '#3B82F6' // Modern blue for negative values
									},
									{
										color: '#EF4444' // Modern red for positive values
									}
								]
							}
						},
						series: [
							{
								name: 'Anomaly',
								data: [
									-0.51140684, -0.38253218, -1.2205691, 0.13093142, 0.44348592, -0.3516928,
									0.1318819, -0.048299875, 0.044649143, 0.046732113, -0.25427026, 0.49761465,
									0.26099268, -0.063117705, 0.46788964, 0.6890339, -0.09945077, -0.52361476,
									-0.023375463, -0.096968174, 0.24290203, 0.9733387, 0.5677613, 0.24127614,
									-0.15072405, 0.33430943, 0.874704, 0.80765766, 0.81826866, 1.3002433
								]
							}
						]
					}
				},
				{
					title: 'Running Mean Temperature',
					chart_type: 'line',
					yAxisTitle: 'Temperature Anomaly (°C)',
					chart_data: {
						categories: [
							1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
							2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
							2023, 2024
						],
						plotLines: [
							{
								color: '#666666',
								width: 1.3,
								value: 0, // baseline at 0°C
								zIndex: 5
							}
						],
						series: [
							{
								name: 'Mean Anomaly',
								data: [
									-0.51140684, -0.38253218, -1.2205691, 0.13093142, 0.44348592, -0.3516928,
									0.1318819, -0.048299875, 0.044649143, 0.046732113, -0.25427026, 0.49761465,
									0.26099268, -0.063117705, 0.46788964, 0.6890339, -0.09945077, -0.52361476,
									-0.023375463, -0.096968174, 0.24290203, 0.9733387, 0.5677613, 0.24127614,
									-0.15072405, 0.33430943, 0.874704, 0.80765766, 0.81826866, 1.3002433
								],
								color: '#3B82F6', // Modern blue
								marker: {
									enabled: false,
									radius: 3
								}
							},
							{
								name: '5-Year Running Mean',
								data: [
									null,
									null,
									-0.308018153956644,
									-0.276075346144498,
									-0.173192530620628,
									0.0612613164403081,
									0.0440048597614773,
									-0.035345909132098,
									-0.015861398379744,
									0.0572851629316529,
									0.119143675667591,
									0.0975903080321302,
									0.181821814394144,
									0.370482651079443,
									0.251069555152586,
									0.0941480639716305,
									0.102096510666347,
									-0.0108750494686828,
									-0.100101427144985,
									0.114456477097749,
									0.332731687283179,
									0.385662009338231,
									0.374910829049194,
									0.393192310017858,
									0.373465351843418,
									0.421444610593205,
									0.53684310629465,
									0.827036597281552,

									null,
									null
								],
								color: '#F59E0B', // Modern amber
								dashStyle: 'Dash',
								marker: {
									enabled: false
								}
							},
							{
								name: '10-Year Running Mean',
								data: [
									null,
									null,
									null,
									null,
									null,
									-0.171682031544371,
									-0.145968372262121,
									-0.0579536838444875,
									0.0902024960539495,
									0.0707975838968037,
									0.0732379526310229,
									0.17731062634985,
									0.154177359042119,
									0.106645869819611,
									0.0998434093492385,
									0.0854733824627305,
									0.135190611967229,
									0.182763016125167,
									0.213439875627404,
									0.243879260002289,
									0.182017889790256,
									0.146545441436437,
									0.243960914470583,
									0.377088148938192,
									0.46125255781644,
									0.600973713165373,

									null,
									null,
									null,
									null
								],
								color: '#8B5CF6', // Modern purple
								dashStyle: 'Dash',
								marker: {
									enabled: false
								}
							}
						]
					}
				}
			],
			map_layers: {
				'1995': {
					id: 'temp-time-series-1995',
					name: 'Temperature Anamoly 1995',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				},
				'1996': {
					id: 'temp-time-series-1996',
					name: 'Temperature Anamoly 1996',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				},
				'1997': {
					id: 'temp-time-series-1997',
					name: 'Temperature Anamoly 1997',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 2,
					mapserver: 'arcgis'
				},
				'1998': {
					id: 'temp-time-series-1998',
					name: 'Temperature Anamoly 1998',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 3,
					mapserver: 'arcgis'
				},
				'1999': {
					id: 'temp-time-series-1999',
					name: 'Temperature Anamoly 1999',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 4,
					mapserver: 'arcgis'
				},
				'2000': {
					id: 'temp-time-series-2000',
					name: 'Temperature Anamoly 2000',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				},
				'2001': {
					id: 'temp-time-series-2001',
					name: 'Temperature Anamoly 2001',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 6,
					mapserver: 'arcgis'
				},
				'2002': {
					id: 'temp-time-series-2002',
					name: 'Temperature Anamoly 2002',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 7,
					mapserver: 'arcgis'
				},
				'2003': {
					id: 'temp-time-series-2003',
					name: 'Temperature Anamoly 2003',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 8,
					mapserver: 'arcgis'
				},
				'2004': {
					id: 'temp-time-series-2004',
					name: 'Temperature Anamoly 2004',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 9,
					mapserver: 'arcgis'
				},
				'2005': {
					id: 'temp-time-series-2005',
					name: 'Temperature Anamoly 2005',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 10,
					mapserver: 'arcgis'
				},
				'2006': {
					id: 'temp-time-series-2006',
					name: 'Temperature Anamoly 2006',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 11,
					mapserver: 'arcgis'
				},
				'2007': {
					id: 'temp-time-series-2007',
					name: 'Temperature Anamoly 2007',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 12,
					mapserver: 'arcgis'
				},
				'2008': {
					id: 'temp-time-series-2008',
					name: 'Temperature Anamoly 2008',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 13,
					mapserver: 'arcgis'
				},
				'2009': {
					id: 'temp-time-series-2009',
					name: 'Temperature Anamoly 2009',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 14,
					mapserver: 'arcgis'
				},
				'2010': {
					id: 'temp-time-series-2010',
					name: 'Temperature Anamoly 2010',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 15, // 15 is the layer index for 2010
					mapserver: 'arcgis'
				},
				'2011': {
					id: 'temp-time-series-2011',
					name: 'Temperature Anamoly 2011',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 16, // 16 is the layer index for 2011
					mapserver: 'arcgis'
				},
				'2012': {
					id: 'temp-time-series-2012',
					name: 'Temperature Anamoly 2012',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 17, // 17 is the layer index for 2012
					mapserver: 'arcgis'
				},
				'2013': {
					id: 'temp-time-series-2013',
					name: 'Temperature Anamoly 2013',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 18,
					mapserver: 'arcgis'
				},
				'2014': {
					id: 'temp-time-series-2014',
					name: 'Temperature Anamoly 2014',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 19, // 19 is the layer index for 2014
					mapserver: 'arcgis'
				},
				'2015': {
					id: 'temp-time-series-2015',
					name: 'Temperature Anamoly 2015',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 20, // 20 is the layer index for 2015
					mapserver: 'arcgis'
				},
				'2016': {
					id: 'temp-time-series-2016',
					name: 'Temperature Anamoly 2016',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 21, // 21 is the layer index for 2016
					mapserver: 'arcgis'
				},
				'2017': {
					id: 'temp-time-series-2017',
					name: 'Temperature Anamoly 2017',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 22, // 22 is the layer index for 2017
					mapserver: 'arcgis'
				},
				'2018': {
					id: 'temp-time-series-2018',
					name: 'Temperature Anamoly 2018',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 23, // 23 is the layer index for 2018
					mapserver: 'arcgis'
				},
				'2019': {
					id: 'temp-time-series-2019',
					name: 'Temperature Anamoly 2019',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 24, // 24 is the layer index for 2019
					mapserver: 'arcgis'
				},
				'2020': {
					id: 'temp-time-series-2020',
					name: 'Temperature Anamoly 2020',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 25, // 25 is the layer index for 2020
					mapserver: 'arcgis'
				},
				'2021': {
					id: 'temp-time-series-2021',
					name: 'Temperature Anamoly 2021',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 26, // 26 is the layer index for 2021
					mapserver: 'arcgis'
				},
				'2022': {
					id: 'temp-time-series-2022',
					name: 'Temperature Anamoly 2022',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 27, // 27 is the layer index for 2022
					mapserver: 'arcgis'
				},
				'2023': {
					id: 'temp-time-series-2023',
					name: 'Temperature Anamoly 2023',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 28, // 28 is the layer index for 2023
					mapserver: 'arcgis'
				},
				'2024': {
					id: 'temp-time-series-2024',
					name: 'Temperature Anamoly 2024',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 29, // 29 is the layer index for 2024
					mapserver: 'arcgis'
				}
			}
		},
		{
			id: 'seasonal-temp-trend',
			title: 'Seasonal Temperature Trend Analysis',
			description:
				'Seasonal temperature trend analysis with overall vs significant trend options across different seasons',
			control_type: 'nested_radio', // New control type for nested selections
			control_options: {
				trend_analysis: ['overall', 'significant'],
				seasons: ['annual', 'spring', 'summer', 'autumn', 'winter']
			},
			default_option: {
				trend_analysis: 'overall',
				season: 'spring'
			},
			charts: [
				{
					title: 'Distribution of Annual Mean Temperature Trends (°C/decade)',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						categories: [
							// '-0.08 to -0.05',
							// '-0.05 to -0.02',
							// '-0.02 to 0.01',
							// '0.01 to 0.03',
							// '0.03 to 0.06',
							// '0.06 to 0.09',
							// '0.09 to 0.11',
							// '0.11 to 0.14',
							// '0.14 to 0.17',
							// '0.17 to 0.19',
							// '0.19 to 0.22',
							// '0.22 to 0.25',
							// '0.25 to 0.27',
							// '0.27 to 0.30',
							// '0.30 to 0.33',
							// '0.33 to 0.35',
							// '0.35 to 0.38',
							// '0.38 to 0.41',
							// '0.41 to 0.43',
							// '0.43 to 0.46',
							// '0.46 to 0.49',
							// '0.49 to 0.52',
							// '0.52 to 0.54',
							// '0.54 to 0.57',
							// '0.57 to 0.60',
							// '0.60 to 0.62',
							// '0.62 to 0.65',
							// '0.65 to 0.68',
							// '0.68 to 0.70',
							// '0.70 to 0.73',
							// '0.73 to 0.76',
							// '0.76 to 0.78',
							// '0.78 to 0.81',
							// '0.81 to 0.84',
							// '0.84 to 0.86',
							// '0.86 to 0.89',
							// '0.89 to 0.92',
							// '0.92 to 0.95',
							// '0.95 to 0.97',
							// '0.97 to 1.00',
							// '1.00 to 1.03',
							// '1.03 to 1.05',
							// '1.05 to 1.08',
							// '1.08 to 1.11',
							// '1.11 to 1.13',
							// '1.13 to 1.16',
							// '1.16 to 1.19',
							// '1.19 to 1.21',
							// '1.21 to 1.24',
							// '1.24 to 1.27'
							'-0.31 to -0.28',
							'-0.28 to -0.25',
							'-0.25 to -0.22',
							'-0.22 to -0.19',
							'-0.19 to -0.16',
							'-0.16 to -0.13',
							'-0.13 to -0.10',
							'-0.10 to -0.07',
							'-0.07 to -0.04',
							'-0.04 to -0.02',
							'-0.02 to 0.01',
							'0.01 to 0.04',
							'0.04 to 0.07',
							'0.07 to 0.10',
							'0.10 to 0.13',
							'0.13 to 0.16',
							'0.16 to 0.19',
							'0.19 to 0.22',
							'0.22 to 0.25',
							'0.25 to 0.28',
							'0.28 to 0.31',
							'0.31 to 0.34',
							'0.34 to 0.37',
							'0.37 to 0.40',
							'0.40 to 0.43',
							'0.43 to 0.46',
							'0.46 to 0.49',
							'0.49 to 0.52',
							'0.52 to 0.55',
							'0.55 to 0.57',
							'0.57 to 0.60',
							'0.60 to 0.63',
							'0.63 to 0.66',
							'0.66 to 0.69',
							'0.69 to 0.72',
							'0.72 to 0.75',
							'0.75 to 0.78',
							'0.78 to 0.81',
							'0.81 to 0.84',
							'0.84 to 0.87',
							'0.87 to 0.90',
							'0.90 to 0.93',
							'0.93 to 0.96',
							'0.96 to 0.99',
							'0.99 to 1.02',
							'1.02 to 1.05',
							'1.05 to 1.08',
							'1.08 to 1.11',
							'1.11 to 1.14',
							'1.14 to 1.16'
						],

						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall trends',
								data: [
									// 1, 3, 4, 8, 13, 25, 15, 59, 170, 158, 272, 342, 288, 523, 475, 322, 464, 426, 296,
									// 403, 389, 346, 216, 301, 255, 155, 197, 114, 82, 86, 61, 50, 55, 46, 22, 34, 25,
									// 19, 8, 13, 6, 4, 3, 3, 1, 2, 2, 1, 2, 1
									2,
									1, 3, 1, 2, 9, 25, 57, 83, 113, 187, 298, 460, 638, 986, 1628, 2395, 2655, 2443,
									2395, 2503, 2570, 2418, 2015, 1643, 1578, 1503, 1470, 1410, 1267, 1220, 979, 763,
									679, 580, 498, 439, 383, 343, 276, 218, 172, 142, 115, 70, 42, 28, 14, 9, 10
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									// 0, 0, 0, 0, 0, 0, 0, 8, 73, 102, 174, 199, 201, 392, 384, 273, 421, 399, 284, 389,
									// 378, 341, 211, 299, 251, 155, 195, 114, 82, 86, 61, 50, 55, 46, 22, 34, 25, 19, 8,
									// 13, 6, 4, 3, 3, 1, 2, 2, 1, 2, 1
									0,
									0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 58, 364, 916, 1188, 1207, 1467, 1843, 2109,
									2113, 1803, 1514, 1472, 1433, 1422, 1371, 1248, 1201, 969, 754, 672, 575, 495,
									434, 377, 339, 272, 215, 165, 134, 113, 68, 38, 28, 14, 9, 10
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},
				{
					title: 'Distribution of Spring Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					// xAxisConfig: {
					// 	type: 'linear',
					// 	min: -0.5,
					// 	max: 2.23,
					// 	title: {
					// 		text: 'Spring Temperature Trend (°C/decade)'
					// 	},
					// 	labels: {
					// 		formatter: function () {
					// 			return this.value.toFixed(1);
					// 		},
					// 		style: {
					// 			fontSize: '12px'
					// 		}
					// 	},
					// 	tickInterval: 0.5,
					// 	gridLineWidth: 1,
					// 	plotLines: [
					// 		{
					// 			color: '#666',
					// 			width: 2,
					// 			value: 0, // baseline at 0°C
					// 			zIndex: 4,
					// 			dashStyle: 'Dash'
					// 		}
					// 	]
					// },
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-0.57 to -0.53',
							'-0.53 to -0.50',
							'-0.50 to -0.46',
							'-0.46 to -0.42',
							'-0.42 to -0.38',
							'-0.38 to -0.35',
							'-0.35 to -0.31',
							'-0.31 to -0.27',
							'-0.27 to -0.23',
							'-0.23 to -0.19',
							'-0.19 to -0.16',
							'-0.16 to -0.12',
							'-0.12 to -0.08',
							'-0.08 to -0.04',
							'-0.04 to -0.01',
							'-0.01 to 0.03',
							'0.03 to 0.07',
							'0.07 to 0.11',
							'0.11 to 0.15',
							'0.15 to 0.18',
							'0.18 to 0.22',
							'0.22 to 0.26',
							'0.26 to 0.30',
							'0.30 to 0.33',
							'0.33 to 0.37',
							'0.37 to 0.41',
							'0.41 to 0.45',
							'0.45 to 0.49',
							'0.49 to 0.52',
							'0.52 to 0.56',
							'0.56 to 0.60',
							'0.60 to 0.64',
							'0.64 to 0.67',
							'0.67 to 0.71',
							'0.71 to 0.75',
							'0.75 to 0.79',
							'0.79 to 0.83',
							'0.83 to 0.86',
							'0.86 to 0.90',
							'0.90 to 0.94',
							'0.94 to 0.98',
							'0.98 to 1.01',
							'1.01 to 1.05',
							'1.05 to 1.09',
							'1.09 to 1.13',
							'1.13 to 1.17',
							'1.17 to 1.20',
							'1.20 to 1.24',
							'1.24 to 1.28',
							'1.28 to 1.32'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall spring trends',
								data: [
									2, 6, 6, 8, 19, 14, 50, 76, 140, 166, 259, 352, 473, 624, 909, 1224, 1670, 2166,
									2706, 2809, 2795, 2892, 2890, 2788, 2596, 1885, 1660, 1356, 1053, 976, 759, 736,
									621, 564, 536, 404, 279, 246, 201, 200, 149, 131, 98, 76, 32, 39, 46, 20, 15, 16
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 19, 79, 95, 204, 326,
									397, 472, 627, 548, 466, 490, 331, 306, 293, 330, 363, 325, 222, 220, 185, 194,
									144, 126, 95, 73, 32, 39, 46, 20, 15, 16
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},
				{
					title: 'Distribution of Summer Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					// xAxisConfig: {
					// 	type: 'linear',
					// 	min: -0.5,
					// 	max: 2.23,
					// 	title: {
					// 		text: 'Summer Temperature Trend (°C/decade)'
					// 	},
					// 	labels: {
					// 		formatter: function () {
					// 			return this.value.toFixed(1);
					// 		},
					// 		style: {
					// 			fontSize: '12px'
					// 		}
					// 	},
					// 	tickInterval: 0.5,
					// 	gridLineWidth: 1,
					// 	plotLines: [
					// 		{
					// 			color: '#666',
					// 			width: 2,
					// 			value: 0, // baseline at 0°C
					// 			zIndex: 4,
					// 			dashStyle: 'Dash'
					// 		}
					// 	]
					// },
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-0.37 to -0.34',
							'-0.34 to -0.30',
							'-0.30 to -0.26',
							'-0.26 to -0.23',
							'-0.23 to -0.19',
							'-0.19 to -0.16',
							'-0.16 to -0.12',
							'-0.12 to -0.09',
							'-0.09 to -0.05',
							'-0.05 to -0.01',
							'-0.01 to 0.02',
							'0.02 to 0.06',
							'0.06 to 0.09',
							'0.09 to 0.13',
							'0.13 to 0.16',
							'0.16 to 0.20',
							'0.20 to 0.24',
							'0.24 to 0.27',
							'0.27 to 0.31',
							'0.31 to 0.34',
							'0.34 to 0.38',
							'0.38 to 0.41',
							'0.41 to 0.45',
							'0.45 to 0.49',
							'0.49 to 0.52',
							'0.52 to 0.56',
							'0.56 to 0.59',
							'0.59 to 0.63',
							'0.63 to 0.66',
							'0.66 to 0.70',
							'0.70 to 0.74',
							'0.74 to 0.77',
							'0.77 to 0.81',
							'0.81 to 0.84',
							'0.84 to 0.88',
							'0.88 to 0.91',
							'0.91 to 0.95',
							'0.95 to 0.99',
							'0.99 to 1.02',
							'1.02 to 1.06',
							'1.06 to 1.09',
							'1.09 to 1.13',
							'1.13 to 1.17',
							'1.17 to 1.20',
							'1.20 to 1.24',
							'1.24 to 1.27',
							'1.27 to 1.31',
							'1.31 to 1.34',
							'1.34 to 1.38',
							'1.38 to 1.42'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall summer trends',
								data: [
									// 1, 2, 0, 6, 11, 29, 25, 47, 60, 132, 197, 302, 261, 538, 701, 518, 864, 626, 759,
									// 465, 526, 195, 192, 101, 71, 35, 25, 13, 8, 8, 16, 6, 3, 4, 3, 3, 3, 3, 0, 0, 0,
									// 0, 3, 1, 0, 0, 0, 0, 1, 1
									3,
									13, 16, 38, 69, 148, 192, 293, 372, 489, 561, 738, 999, 1610, 2272, 2875, 3400,
									4149, 4933, 5353, 4254, 2781, 1744, 1087, 564, 269, 155, 96, 53, 35, 24, 30, 32,
									19, 16, 8, 8, 7, 7, 3, 3, 6, 4, 1, 0, 5, 1, 2, 0, 1
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									// 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 62, 87, 99, 308, 492, 437, 764, 577, 720, 454, 508,
									// 185, 181, 96, 64, 35, 23, 13, 8, 8, 16, 6, 3, 4, 3, 3, 3, 3, 0, 0, 0, 0, 3, 1, 0,
									// 0, 0, 0, 1, 1
									0,
									2, 1, 5, 1, 0, 0, 0, 0, 0, 0, 0, 2, 88, 534, 1104, 1804, 2689, 3723, 4466, 3792,
									2523, 1639, 1038, 553, 265, 154, 94, 53, 35, 24, 30, 32, 19, 16, 8, 8, 7, 7, 3, 3,
									6, 4, 1, 0, 5, 1, 2, 0, 1
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},

				{
					title: 'Distribution of Autumn Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					// xAxisConfig: {
					// 	type: 'linear',
					// 	min: -0.39,
					// 	max: 1.4,
					// 	title: {
					// 		text: 'Autumn Temperature Trend (°C/decade)'
					// 	},
					// 	labels: {
					// 		formatter: function () {
					// 			return this.value.toFixed(1);
					// 		},
					// 		style: {
					// 			fontSize: '12px'
					// 		}
					// 	},
					// 	tickInterval: 0.5,
					// 	gridLineWidth: 1,
					// 	plotLines: [
					// 		{
					// 			color: '#666',
					// 			width: 2,
					// 			value: 0, // baseline at 0°C
					// 			zIndex: 4,
					// 			dashStyle: 'Dash'
					// 		}
					// 	]
					// },
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-0.23 - -0.20',
							'-0.20 - -0.16',
							'-0.16 - -0.13',
							'-0.13 - -0.10',
							'-0.10 - -0.06',
							'-0.06 - -0.03',
							'-0.03 - 0.01',
							'0.01 - 0.04',
							'0.04 - 0.07',
							'0.07 - 0.11',
							'0.11 - 0.14',
							'0.14 - 0.18',
							'0.18 - 0.21',
							'0.21 - 0.25',
							'0.25 - 0.28',
							'0.28 - 0.31',
							'0.31 - 0.35',
							'0.35 - 0.38',
							'0.38 - 0.42',
							'0.42 - 0.45',
							'0.45 - 0.48',
							'0.48 - 0.52',
							'0.52 - 0.55',
							'0.55 - 0.59',
							'0.59 - 0.62',
							'0.62 - 0.65',
							'0.65 - 0.69',
							'0.69 - 0.72',
							'0.72 - 0.76',
							'0.76 - 0.79',
							'0.79 - 0.82',
							'0.82 - 0.86',
							'0.86 - 0.89',
							'0.89 - 0.93',
							'0.93 - 0.96',
							'0.96 - 0.99',
							'0.99 - 1.03',
							'1.03 - 1.06',
							'1.06 - 1.10',
							'1.10 - 1.13',
							'1.13 - 1.16',
							'1.16 - 1.20',
							'1.20 - 1.23',
							'1.23 - 1.27',
							'1.27 - 1.30',
							'1.30 - 1.33',
							'1.33 - 1.37',
							'1.37 - 1.40',
							'1.40 - 1.44',
							'1.44 - 1.47'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall autumn trends',
								data: [
									2, 8, 28, 51, 130, 166, 247, 321, 446, 591, 845, 1184, 1220, 1416, 2095, 2813,
									2953, 2986, 2225, 1999, 1831, 1600, 1466, 1426, 1406, 1318, 1332, 1142, 951, 827,
									699, 643, 586, 560, 515, 418, 331, 247, 194, 179, 102, 68, 50, 55, 21, 18, 13, 6,
									6, 2
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 26, 140, 417, 1146, 1680, 1960, 1929, 1222, 969,
									743, 588, 494, 571, 614, 628, 683, 621, 510, 491, 427, 393, 364, 381, 367, 295,
									205, 146, 107, 102, 63, 50, 37, 49, 19, 18, 13, 6, 6, 2
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},
				{
					title: 'Distribution of Winter Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					// xAxisConfig: {
					// 	type: 'linear',
					// 	min: -0.5,
					// 	max: 2.23,
					// 	title: {
					// 		text: 'Temperature Change (°C/decade)'
					// 	},
					// 	labels: {
					// 		formatter: function () {
					// 			// Format the temperature values
					// 			return this.value.toFixed(2);
					// 		}
					// 	},
					// 	tickInterval: 0.5,
					// 	gridLineWidth: 1,
					// 	plotLines: [
					// 		{
					// 			color: '#666',
					// 			width: 1,
					// 			value: 0, // baseline at 0°C
					// 			zIndex: 4
					// 		}
					// 	]
					// },
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-0.47 to -0.41',
							'-0.41 to -0.35',
							'-0.35 to -0.29',
							'-0.29 to -0.22',
							'-0.22 to -0.16',
							'-0.16 to -0.10',
							'-0.10 to -0.04',
							'-0.04 to 0.02',
							'0.02 to 0.08',
							'0.08 to 0.14',
							'0.14 to 0.20',
							'0.20 to 0.26',
							'0.26 to 0.32',
							'0.32 to 0.38',
							'0.38 to 0.44',
							'0.44 to 0.50',
							'0.50 to 0.56',
							'0.56 to 0.62',
							'0.62 to 0.68',
							'0.68 to 0.74',
							'0.74 to 0.80',
							'0.80 to 0.86',
							'0.86 to 0.92',
							'0.92 to 0.98',
							'0.98 to 1.04',
							'1.04 to 1.10',
							'1.10 to 1.16',
							'1.16 to 1.23',
							'1.23 to 1.29',
							'1.29 to 1.35',
							'1.35 to 1.41',
							'1.41 to 1.47',
							'1.47 to 1.53',
							'1.53 to 1.59',
							'1.59 to 1.65',
							'1.65 to 1.71',
							'1.71 to 1.77',
							'1.77 to 1.83',
							'1.83 to 1.89',
							'1.89 to 1.95',
							'1.95 to 2.01',
							'2.01 to 2.07',
							'2.07 to 2.13',
							'2.13 to 2.19',
							'2.19 to 2.25',
							'2.25 to 2.31',
							'2.31 to 2.37',
							'2.37 to 2.43',
							'2.43 to 2.49',
							'2.49 to 2.55'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall winter trends',
								data: [
									// 5, 2, 8, 11, 21, 56, 49, 100, 152, 229, 278, 396, 607, 477, 639, 518, 556, 420,
									// 399, 240, 237, 184, 171, 135, 130, 137, 79, 84, 79, 73, 41, 44, 29, 38, 16, 24,
									// 23, 8, 17, 3, 10, 10, 12, 6, 5, 2, 1, 1, 1, 2
									3, 12, 23, 48, 113, 252, 402, 771, 1634, 3297, 3888, 3925, 3622, 3116, 2923, 2539,
									1886, 1480, 1402, 1163, 1004, 776, 696, 581, 510, 469, 448, 412, 421, 352, 275,
									237, 198, 163, 105, 88, 86, 76, 67, 56, 44, 36, 25, 30, 34, 18, 17, 9, 4, 2
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									// 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 5, 27, 69, 81, 50, 32, 21, 33, 42, 50, 44,
									// 48, 48, 40, 43, 43, 52, 27, 32, 20, 27, 11, 18, 13, 7, 10, 3, 5, 10, 10, 5, 3, 1,
									// 1, 0, 1, 1
									0,
									0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 40, 19, 52, 164, 143, 188, 251, 257, 271, 288,
									291, 239, 266, 257, 288, 314, 307, 278, 206, 182, 150, 129, 76, 70, 67, 59, 62,
									49, 31, 28, 21, 24, 32, 17, 17, 9, 4, 2
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				}

				// {
				// 	title: 'Overall Summer Temperature Trend',
				// 	chart_type: 'column',
				// 	yAxisTitle: 'Count',
				// 	xAxisConfig: {
				// 		type: 'linear',
				// 		min: -0.5,
				// 		max: 2.23,
				// 		title: {
				// 			text: 'Temperature Change (°C/decade)'
				// 		},
				// 		labels: {
				// 			formatter: function () {
				// 				// Format the temperature values
				// 				return this.value.toFixed(2);
				// 			}
				// 		},
				// 		tickInterval: 0.5,
				// 		gridLineWidth: 1,
				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		]
				// 	},
				// 	chart_data: {
				// 		// Remove categories since we're using numeric x-axis
				// 		// categories: [...],

				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		],
				// 		plotOptions: {
				// 			column: {
				// 				pointPadding: 0,
				// 				groupPadding: 0,
				// 				borderWidth: 0
				// 			}
				// 		},
				// 		series: [
				// 			{
				// 				name: 'Overall Summer Temperature Trend',
				// 				data: [
				// 					// Convert to [x, y] format where x is the temperature value
				// 					[-0.46, 1],
				// 					[-0.375, 2],
				// 					[-0.285, 15],
				// 					[-0.2, 34],
				// 					[-0.115, 59],
				// 					[-0.03, 112],
				// 					[0.055, 298],
				// 					[0.14, 424],
				// 					[0.225, 704],
				// 					[0.31, 950],
				// 					[0.395, 1145],
				// 					[0.48, 1125],
				// 					[0.565, 881],
				// 					[0.65, 503],
				// 					[0.735, 255],
				// 					[0.82, 120],
				// 					[0.905, 58],
				// 					[0.99, 16],
				// 					[1.075, 13],
				// 					[1.16, 22],
				// 					[1.245, 6],
				// 					[1.33, 7],
				// 					[1.415, 3],
				// 					[1.5, 5],
				// 					[1.585, 1],
				// 					[1.67, 0],
				// 					[1.755, 0],
				// 					[1.84, 3],
				// 					[1.925, 1],
				// 					[2.01, 0],
				// 					[2.095, 1],
				// 					[2.18, 2]
				// 				],
				// 				color: '#7cb5ec'
				// 			}
				// 		]
				// 	}
				// },
				// {
				// 	title: 'Significant Summer Temperature Trend',
				// 	chart_type: 'column',
				// 	yAxisTitle: 'Count',
				// 	xAxisConfig: {
				// 		type: 'linear',
				// 		min: -0.5,
				// 		max: 2.23,
				// 		title: {
				// 			text: 'Temperature Change (°C/decade)'
				// 		},
				// 		labels: {
				// 			formatter: function () {
				// 				// Format the temperature values
				// 				return this.value.toFixed(2);
				// 			}
				// 		},
				// 		tickInterval: 0.5,
				// 		gridLineWidth: 1,
				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		]
				// 	},
				// 	chart_data: {
				// 		// Remove categories since we're using numeric x-axis
				// 		// categories: [...],

				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		],
				// 		plotOptions: {
				// 			column: {
				// 				pointPadding: 0,
				// 				groupPadding: 0,
				// 				borderWidth: 0
				// 			}
				// 		},
				// 		series: [
				// 			{
				// 				name: 'Significant Summer Temperature Trend',
				// 				data: [
				// 					// Convert to [x, y] format where x is the temperature value
				// 					[-0.46, 48],
				// 					[-0.375, 87],
				// 					[-0.285, 132],
				// 					[-0.2, 384],
				// 					[-0.115, 546],
				// 					[-0.03, 798],
				// 					[0.055, 883],
				// 					[0.14, 785],
				// 					[0.225, 684],
				// 					[0.31, 349],
				// 					[0.395, 211],
				// 					[0.48, 117],
				// 					[0.565, 65],
				// 					[0.65, 26],
				// 					[0.735, 14],
				// 					[0.82, 10],
				// 					[0.905, 19],
				// 					[0.99, 8],
				// 					[1.075, 4],
				// 					[1.16, 6],
				// 					[1.245, 3],
				// 					[1.33, 3],
				// 					[1.415, 0],
				// 					[1.5, 0],
				// 					[1.585, 1],
				// 					[1.67, 2],
				// 					[1.755, 1],
				// 					[1.84, 1],
				// 					[1.925, 0],
				// 					[2.01, 0],
				// 					[2.095, 1],
				// 					[2.18, 2]
				// 				],
				// 				color: '#7cb5ec'
				// 			}
				// 		]
				// 	}
				// },

				// {
				// 	title: 'Overall Spring Temperature Trend',
				// 	chart_type: 'column',
				// 	yAxisTitle: 'Count',
				// 	xAxisConfig: {
				// 		type: 'linear',
				// 		min: -0.5,
				// 		max: 2.23,
				// 		title: {
				// 			text: 'Temperature Change (°C/decade)'
				// 		},
				// 		labels: {
				// 			formatter: function () {
				// 				// Format the temperature values
				// 				return this.value.toFixed(2);
				// 			}
				// 		},
				// 		tickInterval: 0.5,
				// 		gridLineWidth: 1,
				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		]
				// 	},
				// 	chart_data: {
				// 		// Remove categories since we're using numeric x-axis
				// 		// categories: [...],

				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		],
				// 		plotOptions: {
				// 			column: {
				// 				pointPadding: 0,
				// 				groupPadding: 0,
				// 				borderWidth: 0
				// 			}
				// 		},
				// 		series: [
				// 			{
				// 				name: 'Overall Spring Temperature Trend',
				// 				data: [
				// 					// Convert to [x, y] format where x is the temperature value
				// 					[-0.46, 6],
				// 					[-0.375, 7],
				// 					[-0.285, 14],
				// 					[-0.2, 24],
				// 					[-0.115, 61],
				// 					[-0.03, 83],
				// 					[0.055, 183],
				// 					[0.14, 372],
				// 					[0.225, 582],
				// 					[0.31, 821],
				// 					[0.395, 809],
				// 					[0.48, 772],
				// 					[0.565, 688],
				// 					[0.65, 605],
				// 					[0.735, 443],
				// 					[0.82, 298],
				// 					[0.905, 283],
				// 					[0.99, 198],
				// 					[1.075, 151],
				// 					[1.16, 109],
				// 					[1.245, 71],
				// 					[1.33, 45],
				// 					[1.415, 43],
				// 					[1.5, 37],
				// 					[1.585, 18],
				// 					[1.67, 16],
				// 					[1.755, 6],
				// 					[1.84, 5],
				// 					[1.925, 6],
				// 					[2.01, 5],
				// 					[2.095, 4],
				// 					[2.18, 1]
				// 				],
				// 				color: '#7cb5ec'
				// 			}
				// 		]
				// 	}
				// },
				// {
				// 	title: 'Significant Spring Temperature Trend',
				// 	chart_type: 'column',
				// 	yAxisTitle: 'Count',
				// 	xAxisConfig: {
				// 		type: 'linear',
				// 		min: -0.5,
				// 		max: 2.23,
				// 		title: {
				// 			text: 'Temperature Change (°C/decade)'
				// 		},
				// 		labels: {
				// 			formatter: function () {
				// 				// Format the temperature values
				// 				return this.value.toFixed(2);
				// 			}
				// 		},
				// 		tickInterval: 0.5,
				// 		gridLineWidth: 1,
				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		]
				// 	},
				// 	chart_data: {
				// 		// Remove categories since we're using numeric x-axis
				// 		// categories: [...],

				// 		plotLines: [
				// 			{
				// 				color: '#666',
				// 				width: 1,
				// 				value: 0, // baseline at 0°C
				// 				zIndex: 4
				// 			}
				// 		],
				// 		plotOptions: {
				// 			column: {
				// 				pointPadding: 0,
				// 				groupPadding: 0,
				// 				borderWidth: 0
				// 			}
				// 		},
				// 		series: [
				// 			{
				// 				name: 'Significant Spring Temperature Trend',
				// 				data: [
				// 					// Convert to [x, y] format where x is the temperature value
				// 					[-0.46, 5],
				// 					[-0.375, 26],
				// 					[-0.285, 50],
				// 					[-0.2, 81],
				// 					[-0.115, 127],
				// 					[-0.03, 175],
				// 					[0.055, 172],
				// 					[0.14, 176],
				// 					[0.225, 115],
				// 					[0.31, 122],
				// 					[0.395, 119],
				// 					[0.48, 104],
				// 					[0.565, 72],
				// 					[0.65, 78],
				// 					[0.735, 54],
				// 					[0.82, 41],
				// 					[0.905, 30],
				// 					[0.99, 26],
				// 					[1.075, 38],
				// 					[1.16, 22],
				// 					[1.245, 13],
				// 					[1.33, 13],
				// 					[1.415, 10],
				// 					[1.5, 3],
				// 					[1.585, 1],
				// 					[1.67, 7],
				// 					[1.755, 4],
				// 					[1.84, 4],
				// 					[1.925, 1],
				// 					[2.01, 3],
				// 					[2.095, 1],
				// 					[2.18, 1]
				// 				],
				// 				color: '#7cb5ec'
				// 			}
				// 		]
				// 	}
				// }
			],
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'annual-overall-annual',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 0,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-overall-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 2,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-overall-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 4,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-overall-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 6,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-overall-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 8,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'annual-overall-annual',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 1,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-significant-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 3,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-significant-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 5,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-significant-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 7,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-significant-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 9,
							mapserver: 'arcgis'
						}
					]
				}
			}
		},
		// {
		// 	id: 'ppt-trend-10y',
		// 	title: 'Overall Precipitation Trend Analysis of 10 Years',

		// 	description: 'Precipitation trend analysis with overall vs significant trend options',
		// 	control_type: 'radio',
		// 	control_options: ['overall', 'significant'],
		// 	default_option: 'overall',
		// 	charts: [
		// 		{
		// 			title: 'Distribution of Annual Mean Precipitation Trends (mm/decade)',
		// 			chart_type: 'column',
		// 			yAxisTitle: 'Pixel count',
		// 			chart_data: {
		// 				categories: [
		// 					'-336.56 to -325.8',
		// 					'-325.8 to -315.05',
		// 					'-315.05 to -304.3',
		// 					'-304.3 to -293.55',
		// 					'-293.55 to -282.79',
		// 					'-282.79 to -272.04',
		// 					'-272.04 to -261.29',
		// 					'-261.29 to -250.53',
		// 					'-250.53 to -239.78',
		// 					'-239.78 to -229.03',
		// 					'-229.03 to -218.27',
		// 					'-218.27 to -207.52',
		// 					'-207.52 to -196.77',
		// 					'-196.77 to -186.01',
		// 					'-186.01 to -175.26',
		// 					'-175.26 to -164.51',
		// 					'-164.51 to -153.75',
		// 					'-153.75 to -143.0',
		// 					'-143.0 to -132.25',
		// 					'-132.25 to -121.5',
		// 					'-121.5 to -110.74',
		// 					'-110.74 to -99.99',
		// 					'-99.99 to -89.24',
		// 					'-89.24 to -78.48',
		// 					'-78.48 to -67.73',
		// 					'-67.73 to -56.98',
		// 					'-56.98 to -46.22',
		// 					'-46.22 to -35.47',
		// 					'-35.47 to -24.72',
		// 					'-24.72 to -13.96',
		// 					'-13.96 to -3.21',
		// 					'-3.21 to 7.54',
		// 					'7.54 to 18.29',
		// 					'18.29 to 29.05',
		// 					'29.05 to 39.8',
		// 					'39.8 to 50.55',
		// 					'50.55 to 61.31',
		// 					'61.31 to 72.06',
		// 					'72.06 to 82.81',
		// 					'82.81 to 93.57',
		// 					'93.57 to 104.32',
		// 					'104.32 to 115.07',
		// 					'115.07 to 125.83',
		// 					'125.83 to 136.58',
		// 					'136.58 to 147.33',
		// 					'147.33 to 158.08',
		// 					'158.08 to 168.84',
		// 					'168.84 to 179.59',
		// 					'179.59 to 190.34',
		// 					'190.34 to 201.1'
		// 				],

		// 				plotOptions: {
		// 					column: {
		// 						pointPadding: 0,
		// 						groupPadding: 0,
		// 						borderWidth: 0,
		// 						grouping: false,
		// 						pointPlacement: 0
		// 					}
		// 				},
		// 				series: [
		// 					{
		// 						name: 'Overall trends',
		// 						data: [
		// 							3, 0, 0, 0, 1, 1, 1, 5, 9, 12, 20, 27, 40, 39, 51, 60, 76, 94, 114, 141, 154, 179,
		// 							255, 401, 549, 659, 899, 1259, 1380, 2014, 6787, 14960, 7537, 1203, 375, 180, 110,
		// 							68, 76, 41, 17, 18, 12, 9, 11, 14, 14, 4, 2, 7
		// 						],
		// 						color: '#3B82F6', // Modern blue
		// 						zIndex: 1
		// 					},
		// 					{
		// 						name: 'Significant trends',
		// 						data: [
		// 							3, 0, 0, 0, 1, 1, 1, 5, 9, 12, 20, 27, 39, 37, 50, 57, 69, 87, 104, 118, 119, 145,
		// 							207, 333, 445, 432, 514, 507, 352, 312, 31, 33, 1467, 355, 102, 69, 64, 38, 59,
		// 							36, 15, 14, 11, 8, 9, 12, 9, 4, 2, 7
		// 						],
		// 						color: '#EF4444', // Modern red
		// 						zIndex: 2
		// 					}
		// 				]
		// 			}
		// 		}
		// 	],
		// 	map_layers: {
		// 		overall: [
		// 			{
		// 				id: 'ppt-trend-overall',
		// 				name: 'Overall Precipitation Trend',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
		// 				layerIndex: 0,
		// 				mapserver: 'arcgis'
		// 			}
		// 		],
		// 		significant: [
		// 			{
		// 				id: 'ppt-trend-significant',
		// 				name: 'Significant Precipitation Trend',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
		// 				layerIndex: 5,
		// 				mapserver: 'arcgis'
		// 			}
		// 		]
		// 	}
		// },
		{
			id: 'seasonal-ppt-trend',
			title: 'Seasonal Precipitation Trend Analysis',
			description:
				'Seasonal precipitation trend analysis with overall vs significant trend options across different seasons',
			control_type: 'nested_radio', // New control type for nested selections
			control_options: {
				trend_analysis: ['overall', 'significant'],
				seasons: ['annual', 'spring', 'summer', 'autumn', 'winter']
			},
			default_option: {
				trend_analysis: 'overall',
				season: 'spring'
			},
			charts: [
				{
					title: 'Distribution of Annual Mean Precipitation Trends (mm/decade)',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						categories: [
							'-336.56 to -325.8',
							'-325.8 to -315.05',
							'-315.05 to -304.3',
							'-304.3 to -293.55',
							'-293.55 to -282.79',
							'-282.79 to -272.04',
							'-272.04 to -261.29',
							'-261.29 to -250.53',
							'-250.53 to -239.78',
							'-239.78 to -229.03',
							'-229.03 to -218.27',
							'-218.27 to -207.52',
							'-207.52 to -196.77',
							'-196.77 to -186.01',
							'-186.01 to -175.26',
							'-175.26 to -164.51',
							'-164.51 to -153.75',
							'-153.75 to -143.0',
							'-143.0 to -132.25',
							'-132.25 to -121.5',
							'-121.5 to -110.74',
							'-110.74 to -99.99',
							'-99.99 to -89.24',
							'-89.24 to -78.48',
							'-78.48 to -67.73',
							'-67.73 to -56.98',
							'-56.98 to -46.22',
							'-46.22 to -35.47',
							'-35.47 to -24.72',
							'-24.72 to -13.96',
							'-13.96 to -3.21',
							'-3.21 to 7.54',
							'7.54 to 18.29',
							'18.29 to 29.05',
							'29.05 to 39.8',
							'39.8 to 50.55',
							'50.55 to 61.31',
							'61.31 to 72.06',
							'72.06 to 82.81',
							'82.81 to 93.57',
							'93.57 to 104.32',
							'104.32 to 115.07',
							'115.07 to 125.83',
							'125.83 to 136.58',
							'136.58 to 147.33',
							'147.33 to 158.08',
							'158.08 to 168.84',
							'168.84 to 179.59',
							'179.59 to 190.34',
							'190.34 to 201.1'
						],

						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall trends',
								data: [
									3, 0, 0, 0, 1, 1, 1, 5, 9, 12, 20, 27, 40, 39, 51, 60, 76, 94, 114, 141, 154, 179,
									255, 401, 549, 659, 899, 1259, 1380, 2014, 6787, 14960, 7537, 1203, 375, 180, 110,
									68, 76, 41, 17, 18, 12, 9, 11, 14, 14, 4, 2, 7
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									3, 0, 0, 0, 1, 1, 1, 5, 9, 12, 20, 27, 39, 37, 50, 57, 69, 87, 104, 118, 119, 145,
									207, 333, 445, 432, 514, 507, 352, 312, 31, 33, 1467, 355, 102, 69, 64, 38, 59,
									36, 15, 14, 11, 8, 9, 12, 9, 4, 2, 7
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},
				{
					title: 'Distribution of Winter Precipitation Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-82.64 to -80.7',
							'-80.7 to -78.76',
							'-78.76 to -76.83',
							'-76.83 to -74.89',
							'-74.89 to -72.95',
							'-72.95 to -71.01',
							'-71.01 to -69.07',
							'-69.07 to -67.14',
							'-67.14 to -65.2',
							'-65.2 to -63.26',
							'-63.26 to -61.32',
							'-61.32 to -59.38',
							'-59.38 to -57.44',
							'-57.44 to -55.51',
							'-55.51 to -53.57',
							'-53.57 to -51.63',
							'-51.63 to -49.69',
							'-49.69 to -47.75',
							'-47.75 to -45.81',
							'-45.81 to -43.88',
							'-43.88 to -41.94',
							'-41.94 to -40.0',
							'-40.0 to -38.06',
							'-38.06 to -36.12',
							'-36.12 to -34.19',
							'-34.19 to -32.25',
							'-32.25 to -30.31',
							'-30.31 to -28.37',
							'-28.37 to -26.43',
							'-26.43 to -24.49',
							'-24.49 to -22.56',
							'-22.56 to -20.62',
							'-20.62 to -18.68',
							'-18.68 to -16.74',
							'-16.74 to -14.8',
							'-14.8 to -12.86',
							'-12.86 to -10.93',
							'-10.93 to -8.99',
							'-8.99 to -7.05',
							'-7.05 to -5.11',
							'-5.11 to -3.17',
							'-3.17 to -1.24',
							'-1.24 to 0.7',
							'0.7 to 2.64',
							'2.64 to 4.58',
							'4.58 to 6.52',
							'6.52 to 8.46',
							'8.46 to 10.39',
							'10.39 to 12.33',
							'12.33 to 14.27'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall winter trends',
								data: [
									1, 0, 0, 1, 1, 3, 3, 1, 1, 2, 3, 3, 3, 2, 2, 4, 2, 5, 4, 3, 3, 3, 13, 6, 11, 12,
									22, 26, 51, 47, 45, 65, 73, 91, 110, 205, 342, 562, 879, 1490, 2510, 6722, 20994,
									3739, 1177, 458, 113, 56, 15, 4
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									1, 0, 0, 1, 1, 3, 3, 1, 1, 2, 2, 3, 3, 2, 2, 3, 2, 5, 4, 2, 3, 3, 10, 5, 8, 7, 16,
									19, 34, 29, 35, 36, 36, 36, 42, 57, 73, 106, 125, 94, 103, 1260, 1029, 34, 5, 24,
									30, 37, 10, 0
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},

				{
					title: 'Distribution of Summer Precipitation Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-154.95 to -148.67',
							'-148.67 to -142.38',
							'-142.38 to -136.1',
							'-136.1 to -129.82',
							'-129.82 to -123.54',
							'-123.54 to -117.26',
							'-117.26 to -110.97',
							'-110.97 to -104.69',
							'-104.69 to -98.41',
							'-98.41 to -92.13',
							'-92.13 to -85.84',
							'-85.84 to -79.56',
							'-79.56 to -73.28',
							'-73.28 to -67.0',
							'-67.0 to -60.72',
							'-60.72 to -54.43',
							'-54.43 to -48.15',
							'-48.15 to -41.87',
							'-41.87 to -35.59',
							'-35.59 to -29.31',
							'-29.31 to -23.02',
							'-23.02 to -16.74',
							'-16.74 to -10.46',
							'-10.46 to -4.18',
							'-4.18 to 2.1',
							'2.1 to 8.39',
							'8.39 to 14.67',
							'14.67 to 20.95',
							'20.95 to 27.23',
							'27.23 to 33.52',
							'33.52 to 39.8',
							'39.8 to 46.08',
							'46.08 to 52.36',
							'52.36 to 58.64',
							'58.64 to 64.93',
							'64.93 to 71.21',
							'71.21 to 77.49',
							'77.49 to 83.77',
							'83.77 to 90.05',
							'90.05 to 96.34',
							'96.34 to 102.62',
							'102.62 to 108.9',
							'108.9 to 115.18',
							'115.18 to 121.46',
							'121.46 to 127.75',
							'127.75 to 134.03',
							'134.03 to 140.31',
							'140.31 to 146.59',
							'146.59 to 152.88',
							'152.88 to 159.16'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall summer trends',
								data: [
									3, 3, 3, 8, 10, 14, 27, 31, 51, 62, 84, 90, 118, 126, 134, 166, 197, 214, 376,
									589, 903, 1166, 2077, 5455, 15331, 8870, 2186, 551, 320, 196, 124, 120, 70, 53,
									35, 35, 16, 11, 7, 7, 9, 12, 6, 5, 5, 1, 3, 4, 1, 3
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									3, 3, 2, 6, 9, 13, 24, 27, 43, 46, 66, 64, 81, 76, 66, 73, 89, 88, 159, 240, 324,
									253, 322, 155, 521, 138, 297, 49, 38, 38, 25, 29, 20, 29, 23, 24, 12, 10, 6, 6, 9,
									12, 6, 5, 5, 1, 3, 4, 1, 3
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},

				{
					title: 'Distribution of Spring Precipitation Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-112.72 to -109.18',
							'-109.18 to -105.64',
							'-105.64 to -102.11',
							'-102.11 to -98.57',
							'-98.57 to -95.03',
							'-95.03 to -91.49',
							'-91.49 to -87.95',
							'-87.95 to -84.41',
							'-84.41 to -80.87',
							'-80.87 to -77.33',
							'-77.33 to -73.80',
							'-73.80 to -70.26',
							'-70.26 to -66.72',
							'-66.72 to -63.18',
							'-63.18 to -59.64',
							'-59.64 to -56.10',
							'-56.10 to -52.56',
							'-52.56 to -49.03',
							'-49.03 to -45.49',
							'-45.49 to -41.95',
							'-41.95 to -38.41',
							'-38.41 to -34.87',
							'-34.87 to -31.33',
							'-31.33 to -27.79',
							'-27.79 to -24.25',
							'-24.25 to -20.72',
							'-20.72 to -17.18',
							'-17.18 to -13.64',
							'-13.64 to -10.10',
							'-10.10 to -6.56',
							'-6.56 to -3.02',
							'-3.02 to 0.52',
							'0.52 to 4.06',
							'4.06 to 7.59',
							'7.59 to 11.13',
							'11.13 to 14.67',
							'14.67 to 18.21',
							'18.21 to 21.75',
							'21.75 to 25.29',
							'25.29 to 28.83',
							'28.83 to 32.36',
							'32.36 to 35.90',
							'35.90 to 39.44',
							'39.44 to 42.98',
							'42.98 to 46.52',
							'46.52 to 50.06',
							'50.06 to 53.60',
							'53.60 to 57.14',
							'57.14 to 60.67',
							'60.67 to 64.21'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall spring trends',
								data: [
									2, 1, 2, 3, 2, 3, 3, 9, 13, 16, 12, 19, 35, 54, 50, 83, 119, 158, 246, 283, 346,
									357, 367, 414, 526, 638, 971, 998, 1300, 1541, 2162, 6154, 16003, 4439, 1331, 554,
									281, 130, 97, 63, 44, 23, 14, 9, 4, 2, 3, 2, 1, 1
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									2, 1, 1, 0, 1, 2, 2, 8, 11, 16, 12, 18, 35, 50, 42, 67, 105, 147, 215, 241, 293,
									294, 281, 295, 345, 360, 478, 243, 179, 36, 20, 2, 1182, 1195, 375, 153, 74, 42,
									51, 38, 33, 19, 14, 8, 4, 2, 3, 2, 1, 1
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},

				{
					title: 'Distribution of Autumn Precipitation Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-79.82 to -76.52',
							'-76.52 to -73.23',
							'-73.23 to -69.93',
							'-69.93 to -66.63',
							'-66.63 to -63.34',
							'-63.34 to -60.04',
							'-60.04 to -56.75',
							'-56.75 to -53.45',
							'-53.45 to -50.16',
							'-50.16 to -46.86',
							'-46.86 to -43.57',
							'-43.57 to -40.27',
							'-40.27 to -36.98',
							'-36.98 to -33.68',
							'-33.68 to -30.39',
							'-30.39 to -27.09',
							'-27.09 to -23.79',
							'-23.79 to -20.50',
							'-20.50 to -17.20',
							'-17.20 to -13.91',
							'-13.91 to -10.61',
							'-10.61 to -7.32',
							'-7.32 to -4.02',
							'-4.02 to -0.73',
							'-0.73 to 2.57',
							'2.57 to 5.86',
							'5.86 to 9.16',
							'9.16 to 12.46',
							'12.46 to 15.75',
							'15.75 to 19.05',
							'19.05 to 22.34',
							'22.34 to 25.64',
							'25.64 to 28.93',
							'28.93 to 32.23',
							'32.23 to 35.52',
							'35.52 to 38.82',
							'38.82 to 42.11',
							'42.11 to 45.41',
							'45.41 to 48.71',
							'48.71 to 52.00',
							'52.00 to 55.30',
							'55.30 to 58.59',
							'58.59 to 61.89',
							'61.89 to 65.18',
							'65.18 to 68.48',
							'68.48 to 71.77',
							'71.77 to 75.07',
							'75.07 to 78.36',
							'78.36 to 81.66',
							'81.66 to 84.96'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall autumn trends',
								data: [
									3, 0, 1, 0, 3, 5, 3, 9, 14, 19, 28, 31, 40, 69, 142, 212, 273, 346, 403, 556, 813,
									947, 1863, 7574, 16433, 7051, 1441, 495, 304, 187, 134, 104, 113, 92, 61, 44, 27,
									11, 9, 6, 4, 3, 2, 3, 2, 1, 4, 2, 0, 1
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 1, 4, 2, 5, 13, 15, 21, 26, 25, 46, 95, 143, 168, 165, 127, 87, 55,
									50, 19, 1, 240, 401, 289, 79, 26, 18, 18, 24, 36, 50, 32, 25, 17, 7, 4, 4, 3, 2,
									2, 3, 2, 1, 4, 2, 0, 1
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				}
			],
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'ppt-trend-overall',
							name: 'Overall Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 0,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-ppt-overall-spring',
							name: 'Spring Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 1,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-ppt-overall-summer',
							name: 'Summer Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 2,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-ppt-overall-autumn',
							name: 'Autumn Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 3,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-ppt-overall-winter',
							name: 'Winter Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 4,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'ppt-trend-significant',
							name: 'Significant Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 5,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-ppt-significant-spring',
							name: 'Spring Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 6,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-ppt-significant-summer',
							name: 'Summer Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 7,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-ppt-significant-autumn',
							name: 'Autumn Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 8,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-ppt-significant-winter',
							name: 'Winter Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 9,
							mapserver: 'arcgis'
						}
					]
				}
			}
		},
		{
			id: 'annual-ppt-anamoly-series',
			title: 'Time Series Precipitation Anomaly',
			description: 'Time series analysis of annual precipitation with temporal controls',
			control_type: 'time_slider',
			time_dimension: {
				start_year: 1995,
				end_year: 2024,
				step: 1,
				default_year: 2024,
				format: 'YYYY',
				animation_speed: 1500
			},
			charts: [
				{
					title: 'Precipitation Anomaly',
					chart_type: 'line',
					yAxisTitle: 'Precipitation Anomaly (mm)',
					chart_data: {
						categories: [
							1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
							2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
							2023, 2024
						],
						plotLines: [
							{
								color: '#666666',
								width: 1.3,
								value: 0, // baseline at 0°C
								zIndex: 5
							}
						],
						series: [
							{
								name: 'Mean Precipitation',
								data: [
									24.5511685101995, 18.9006596074447, -4.72668972485906, 33.6474676647676,
									6.86541922907489, 5.04925710988533, -25.4773420519825, -15.2821837374832,
									2.6055394674323, -5.96491338575025, -15.7795865788213, -28.6942760050894,
									13.708876060378, 11.6958355183971, -18.9968976462839, 31.529948533203,
									-6.56430250948995, 3.10107354901662, -13.6267620971104, -29.5937963209858,
									-12.4088300710168, -6.32570270587295, 9.42941934187107, -0.224637491632263,
									-6.84436038785606, 15.3548195314752, -22.7561860242093, -11.5901441053363,
									-47.932695052158, 4.68074261728559
								],
								color: '#F59E0B', // Modern amber
								dashStyle: 'Dash',
								marker: {
									enabled: false
								}
							}
						]
					}
				}
			],
			map_layers: {
				'1995': {
					id: 'ppt-time-series-1995',
					name: 'Precipitation Anamoly 1995',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				},
				'1996': {
					id: 'ppt-time-series-1996',
					name: 'Precipitation Anamoly 1996',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				},
				'1997': {
					id: 'ppt-time-series-1997',
					name: 'Precipitation Anamoly 1997',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 2,
					mapserver: 'arcgis'
				},
				'1998': {
					id: 'ppt-time-series-1998',
					name: 'Precipitation Anamoly 1998',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 3,
					mapserver: 'arcgis'
				},
				'1999': {
					id: 'ppt-time-series-1999',
					name: 'Precipitation Anamoly 1999',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 4,
					mapserver: 'arcgis'
				},
				'2000': {
					id: 'ppt-time-series-2000',
					name: 'Precipitation Anamoly 2000',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				},
				'2001': {
					id: 'ppt-time-series-2001',
					name: 'Precipitation Anamoly 2001',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 6,
					mapserver: 'arcgis'
				},
				'2002': {
					id: 'ppt-time-series-2002',
					name: 'Precipitation Anamoly 2002',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 7,
					mapserver: 'arcgis'
				},
				'2003': {
					id: 'ppt-time-series-2003',
					name: 'Precipitation Anamoly 2003',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 8,
					mapserver: 'arcgis'
				},
				'2004': {
					id: 'ppt-time-series-2004',
					name: 'Precipitation Anamoly 2004',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 9,
					mapserver: 'arcgis'
				},
				'2005': {
					id: 'ppt-time-series-2005',
					name: 'Precipitation Anamoly 2005',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 10,
					mapserver: 'arcgis'
				},
				'2006': {
					id: 'ppt-time-series-2006',
					name: 'Precipitation Anamoly 2006',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 11,
					mapserver: 'arcgis'
				},
				'2007': {
					id: 'ppt-time-series-2007',
					name: 'Precipitation Anamoly 2007',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 12,
					mapserver: 'arcgis'
				},
				'2008': {
					id: 'ppt-time-series-2008',
					name: 'Precipitation Anamoly 2008',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 13,
					mapserver: 'arcgis'
				},
				'2009': {
					id: 'ppt-time-series-2009',
					name: 'Precipitation Anamoly 2009',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 14,
					mapserver: 'arcgis'
				},
				'2010': {
					id: 'ppt-time-series-2010',
					name: 'Precipitation Anamoly 2010',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 15, // 15 is the layer index for 2010
					mapserver: 'arcgis'
				},
				'2011': {
					id: 'ppt-time-series-2011',
					name: 'Precipitation Anamoly 2011',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 16, // 16 is the layer index for 2011
					mapserver: 'arcgis'
				},
				'2012': {
					id: 'ppt-time-series-2012',
					name: 'Precipitation Anamoly 2012',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 17, // 17 is the layer index for 2012
					mapserver: 'arcgis'
				},
				'2013': {
					id: 'ppt-time-series-2013',
					name: 'Precipitation Anamoly 2013',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 18,
					mapserver: 'arcgis'
				},
				'2014': {
					id: 'ppt-time-series-2014',
					name: 'Precipitation Anamoly 2014',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 19, // 19 is the layer index for 2014
					mapserver: 'arcgis'
				},
				'2015': {
					id: 'ppt-time-series-2015',
					name: 'Precipitation Anamoly 2015',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 20, // 20 is the layer index for 2015
					mapserver: 'arcgis'
				},
				'2016': {
					id: 'ppt-time-series-2016',
					name: 'Precipitation Anamoly 2016',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 21, // 21 is the layer index for 2016
					mapserver: 'arcgis'
				},
				'2017': {
					id: 'ppt-time-series-2017',
					name: 'Precipitation Anamoly 2017',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 22, // 22 is the layer index for 2017
					mapserver: 'arcgis'
				},
				'2018': {
					id: 'ppt-time-series-2018',
					name: 'Precipitation Anamoly 2018',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 23, // 23 is the layer index for 2018
					mapserver: 'arcgis'
				},
				'2019': {
					id: 'ppt-time-series-2019',
					name: 'Precipitation Anamoly 2019',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 24, // 24 is the layer index for 2019
					mapserver: 'arcgis'
				},
				'2020': {
					id: 'ppt-time-series-2020',
					name: 'Precipitation Anamoly 2020',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 25, // 25 is the layer index for 2020
					mapserver: 'arcgis'
				},
				'2021': {
					id: 'ppt-time-series-2021',
					name: 'Precipitation Anamoly 2021',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 26, // 26 is the layer index for 2021
					mapserver: 'arcgis'
				},
				'2022': {
					id: 'ppt-time-series-2022',
					name: 'Precipitation Anamoly 2022',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 27, // 27 is the layer index for 2022
					mapserver: 'arcgis'
				},
				'2023': {
					id: 'ppt-time-series-2023',
					name: 'Precipitation Anamoly 2023',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 28, // 28 is the layer index for 2023
					mapserver: 'arcgis'
				},
				'2024': {
					id: 'ppt-time-series-2024',
					name: 'Precipitation Anamoly 2024',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 29, // 29 is the layer index for 2024
					mapserver: 'arcgis'
				}
			}
		},
		{
			id: 'seasonal-snowfall-trend-10y',
			title: 'Seasonal Snowfall Trend Analysis of 10 Years',
			description:
				'Seasonal snowfall trend analysis with overall vs significant trend options across different seasons',
			control_type: 'nested_radio', // New control type for nested selections
			control_options: {
				trend_analysis: ['overall', 'significant'],
				seasons: ['annual', 'spring', 'summer', 'autumn', 'winter']
			},
			default_option: {
				trend_analysis: 'overall',
				season: 'spring'
			},
			charts: [
				{
					title: 'Distribution of Annual Mean Snowfall Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						categories: [
							'-16.82 to -16.46',
							'-16.46 to -16.11',
							'-16.11 to -15.75',
							'-15.75 to -15.39',
							'-15.39 to -15.04',
							'-15.04 to -14.68',
							'-14.68 to -14.33',
							'-14.33 to -13.97',
							'-13.97 to -13.62',
							'-13.62 to -13.26',
							'-13.26 to -12.91',
							'-12.91 to -12.55',
							'-12.55 to -12.20',
							'-12.20 to -11.84',
							'-11.84 to -11.49',
							'-11.49 to -11.13',
							'-11.13 to -10.78',
							'-10.78 to -10.42',
							'-10.42 to -10.07',
							'-10.07 to -9.71',
							'-9.71 to -9.36',
							'-9.36 to -9.00',
							'-9.00 to -8.65',
							'-8.65 to -8.29',
							'-8.29 to -7.94',
							'-7.94 to -7.58',
							'-7.58 to -7.23',
							'-7.23 to -6.87',
							'-6.87 to -6.52',
							'-6.52 to -6.16',
							'-6.16 to -5.81',
							'-5.81 to -5.45',
							'-5.45 to -5.10',
							'-5.10 to -4.74',
							'-4.74 to -4.39',
							'-4.39 to -4.03',
							'-4.03 to -3.68',
							'-3.68 to -3.32',
							'-3.32 to -2.96',
							'-2.96 to -2.61',
							'-2.61 to -2.25',
							'-2.25 to -1.90',
							'-1.90 to -1.54',
							'-1.54 to -1.19',
							'-1.19 to -0.83',
							'-0.83 to -0.48',
							'-0.48 to -0.12',
							'-0.12 to 0.23',
							'0.23 to 0.59',
							'0.59 to 0.94'
						],

						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall trends',
								data: [
									1, 0, 1, 2, 0, 1, 0, 0, 1, 0, 0, 1, 1, 2, 1, 3, 5, 8, 5, 4, 6, 10, 13, 17, 26, 33,
									24, 38, 45, 59, 69, 110, 137, 148, 178, 217, 314, 297, 371, 428, 564, 857, 1869,
									4321, 7256, 7319, 5025, 3053, 14, 4
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									1, 0, 1, 2, 0, 1, 0, 0, 1, 0, 0, 1, 1, 2, 1, 3, 5, 8, 5, 4, 6, 10, 11, 15, 22, 29,
									21, 25, 32, 44, 44, 81, 96, 98, 125, 124, 195, 180, 195, 229, 299, 443, 1167,
									2988, 3972, 2176, 1169, 619, 0, 0
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},
				{
					title: 'Distribution of Spring Snowfall Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-6.49 to -6.33',
							'-6.33 to -6.16',
							'-6.16 to -6.00',
							'-6.00 to -5.84',
							'-5.84 to -5.68',
							'-5.68 to -5.52',
							'-5.52 to -5.36',
							'-5.36 to -5.20',
							'-5.20 to -5.04',
							'-5.04 to -4.87',
							'-4.87 to -4.71',
							'-4.71 to -4.55',
							'-4.55 to -4.39',
							'-4.39 to -4.23',
							'-4.23 to -4.07',
							'-4.07 to -3.91',
							'-3.91 to -3.75',
							'-3.75 to -3.58',
							'-3.58 to -3.42',
							'-3.42 to -3.26',
							'-3.26 to -3.10',
							'-3.10 to -2.94',
							'-2.94 to -2.78',
							'-2.78 to -2.62',
							'-2.62 to -2.46',
							'-2.46 to -2.29',
							'-2.29 to -2.13',
							'-2.13 to -1.97',
							'-1.97 to -1.81',
							'-1.81 to -1.65',
							'-1.65 to -1.49',
							'-1.49 to -1.33',
							'-1.33 to -1.17',
							'-1.17 to -1.00',
							'-1.00 to -0.84',
							'-0.84 to -0.68',
							'-0.68 to -0.52',
							'-0.52 to -0.36',
							'-0.36 to -0.20',
							'-0.20 to -0.04',
							'-0.04 to 0.12',
							'0.12 to 0.29',
							'0.29 to 0.45',
							'0.45 to 0.61',
							'0.61 to 0.77',
							'0.77 to 0.93',
							'0.93 to 1.09',
							'1.09 to 1.25',
							'1.25 to 1.41',
							'1.41 to 1.58'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall spring trends',
								data: [
									2, 0, 3, 1, 2, 2, 2, 4, 2, 3, 4, 4, 5, 8, 7, 5, 6, 6, 14, 9, 14, 15, 21, 20, 18,
									33, 60, 72, 102, 156, 199, 230, 309, 413, 492, 585, 881, 1222, 2819, 8853, 10381,
									2572, 513, 187, 84, 35, 17, 6, 1, 4
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 4, 3, 1, 2, 1, 2, 2, 2, 2, 2, 0, 0, 1, 14,
									17, 27, 28, 34, 48, 62, 81, 59, 80, 136, 207, 219, 436, 280, 0, 1, 2, 8, 4, 4, 4,
									0, 1
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},
				{
					title: 'Distribution of Summer Snowfall Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-2.53 to -2.46',
							'-2.46 to -2.39',
							'-2.39 to -2.32',
							'-2.32 to -2.24',
							'-2.24 to -2.17',
							'-2.17 to -2.10',
							'-2.10 to -2.03',
							'-2.03 to -1.96',
							'-1.96 to -1.88',
							'-1.88 to -1.81',
							'-1.81 to -1.74',
							'-1.74 to -1.67',
							'-1.67 to -1.59',
							'-1.59 to -1.52',
							'-1.52 to -1.45',
							'-1.45 to -1.38',
							'-1.38 to -1.30',
							'-1.30 to -1.23',
							'-1.23 to -1.16',
							'-1.16 to -1.09',
							'-1.09 to -1.02',
							'-1.02 to -0.94',
							'-0.94 to -0.87',
							'-0.87 to -0.80',
							'-0.80 to -0.73',
							'-0.73 to -0.65',
							'-0.65 to -0.58',
							'-0.58 to -0.51',
							'-0.51 to -0.44',
							'-0.44 to -0.36',
							'-0.36 to -0.29',
							'-0.29 to -0.22',
							'-0.22 to -0.15',
							'-0.15 to -0.07',
							'-0.07 to 0.00',
							'0.00 to 0.07',
							'0.07 to 0.14',
							'0.14 to 0.21',
							'0.21 to 0.29',
							'0.29 to 0.36',
							'0.36 to 0.43',
							'0.43 to 0.50',
							'0.50 to 0.58',
							'0.58 to 0.65',
							'0.65 to 0.72',
							'0.72 to 0.79',
							'0.79 to 0.87',
							'0.87 to 0.94',
							'0.94 to 1.01',
							'1.01 to 1.08'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall summer trends',
								data: [
									1, 0, 1, 2, 0, 0, 2, 0, 0, 4, 2, 2, 2, 4, 7, 13, 22, 28, 38, 73, 101, 152, 284,
									399, 718, 863, 1186, 1335, 1407, 1410, 1265, 1360, 1438, 1949, 3419, 3620, 1025,
									453, 277, 165, 114, 86, 80, 62, 51, 23, 20, 12, 9, 6
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 3, 4, 11, 14, 20, 32, 54, 68, 111, 209,
									306, 551, 626, 768, 743, 620, 454, 274, 189, 140, 117, 146, 112, 10, 13, 6, 0, 5,
									13, 12, 19, 25, 13, 15, 10, 6, 6
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},

				{
					title: 'Distribution of Autumn Snowfall Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-4.64 to -4.53',
							'-4.53 to -4.43',
							'-4.43 to -4.32',
							'-4.32 to -4.21',
							'-4.21 to -4.10',
							'-4.10 to -4.00',
							'-4.00 to -3.89',
							'-3.89 to -3.78',
							'-3.78 to -3.67',
							'-3.67 to -3.57',
							'-3.57 to -3.46',
							'-3.46 to -3.35',
							'-3.35 to -3.24',
							'-3.24 to -3.13',
							'-3.13 to -3.03',
							'-3.03 to -2.92',
							'-2.92 to -2.81',
							'-2.81 to -2.70',
							'-2.70 to -2.60',
							'-2.60 to -2.49',
							'-2.49 to -2.38',
							'-2.38 to -2.27',
							'-2.27 to -2.16',
							'-2.16 to -2.06',
							'-2.06 to -1.95',
							'-1.95 to -1.84',
							'-1.84 to -1.73',
							'-1.73 to -1.63',
							'-1.63 to -1.52',
							'-1.52 to -1.41',
							'-1.41 to -1.30',
							'-1.30 to -1.20',
							'-1.20 to -1.09',
							'-1.09 to -0.98',
							'-0.98 to -0.87',
							'-0.87 to -0.76',
							'-0.76 to -0.66',
							'-0.66 to -0.55',
							'-0.55 to -0.44',
							'-0.44 to -0.33',
							'-0.33 to -0.23',
							'-0.23 to -0.12',
							'-0.12 to -0.01',
							'-0.01 to 0.10',
							'0.10 to 0.21',
							'0.21 to 0.31',
							'0.31 to 0.42',
							'0.42 to 0.53',
							'0.53 to 0.64',
							'0.64 to 0.74'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall autumn trends',
								data: [
									1, 0, 0, 0, 0, 0, 1, 1, 2, 0, 1, 2, 0, 0, 1, 0, 0, 1, 3, 1, 3, 5, 4, 12, 14, 12,
									21, 16, 38, 43, 58, 78, 114, 248, 381, 505, 728, 1218, 2224, 3567, 5202, 4808,
									5690, 3425, 509, 243, 91, 49, 18, 6
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									1, 0, 0, 0, 0, 0, 1, 1, 2, 0, 1, 1, 0, 0, 1, 0, 0, 1, 2, 1, 2, 4, 3, 10, 12, 11,
									18, 14, 37, 38, 52, 64, 92, 214, 360, 412, 545, 685, 1088, 984, 613, 377, 359,
									149, 4, 0, 0, 0, 0, 0
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				},
				{
					title: 'Distribution of Winter Snowfall Trend',
					chart_type: 'column',
					yAxisTitle: 'Pixel count',
					chart_data: {
						// Remove categories since we're using numeric x-axis
						categories: [
							'-3.57 to -3.50',
							'-3.50 to -3.42',
							'-3.42 to -3.34',
							'-3.34 to -3.26',
							'-3.26 to -3.18',
							'-3.18 to -3.10',
							'-3.10 to -3.02',
							'-3.02 to -2.94',
							'-2.94 to -2.87',
							'-2.87 to -2.79',
							'-2.79 to -2.71',
							'-2.71 to -2.63',
							'-2.63 to -2.55',
							'-2.55 to -2.47',
							'-2.47 to -2.39',
							'-2.39 to -2.31',
							'-2.31 to -2.23',
							'-2.23 to -2.16',
							'-2.16 to -2.08',
							'-2.08 to -2.00',
							'-2.00 to -1.92',
							'-1.92 to -1.84',
							'-1.84 to -1.76',
							'-1.76 to -1.68',
							'-1.68 to -1.60',
							'-1.60 to -1.53',
							'-1.53 to -1.45',
							'-1.45 to -1.37',
							'-1.37 to -1.29',
							'-1.29 to -1.21',
							'-1.21 to -1.13',
							'-1.13 to -1.05',
							'-1.05 to -0.97',
							'-0.97 to -0.90',
							'-0.90 to -0.82',
							'-0.82 to -0.74',
							'-0.74 to -0.66',
							'-0.66 to -0.58',
							'-0.58 to -0.50',
							'-0.50 to -0.42',
							'-0.42 to -0.34',
							'-0.34 to -0.27',
							'-0.27 to -0.19',
							'-0.19 to -0.11',
							'-0.11 to -0.03',
							'-0.03 to 0.05',
							'0.05 to 0.13',
							'0.13 to 0.21',
							'0.21 to 0.29',
							'0.29 to 0.36'
						],

						plotLines: [
							{
								color: '#666',
								width: 1,
								value: 0, // baseline at 0°C
								zIndex: 4
							}
						],
						plotOptions: {
							column: {
								pointPadding: 0,
								groupPadding: 0,
								borderWidth: 0,
								grouping: false,
								pointPlacement: 0
							}
						},
						series: [
							{
								name: 'Overall winter trends',
								data: [
									1, 0, 0, 1, 1, 0, 2, 1, 0, 1, 1, 1, 2, 1, 2, 4, 6, 3, 4, 6, 8, 25, 27, 35, 50, 61,
									58, 68, 121, 122, 136, 169, 194, 258, 260, 293, 292, 425, 569, 836, 1151, 1230,
									1535, 2124, 10745, 11904, 68, 17, 15, 7
								],
								color: '#3B82F6', // Modern blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									1, 0, 0, 1, 1, 0, 2, 1, 0, 1, 1, 1, 1, 0, 2, 4, 4, 3, 4, 6, 8, 25, 27, 33, 50, 57,
									54, 65, 116, 111, 123, 145, 170, 213, 203, 199, 209, 310, 376, 522, 650, 634, 591,
									531, 1423, 252, 0, 0, 0, 0
								],
								color: '#EF4444', // Modern red
								zIndex: 2
							}
						]
					}
				}
			],
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'seasonal-overall-annual',
							name: 'Annual Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 0,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-overall-spring',
							name: 'Spring Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 1,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-overall-summer',
							name: 'Summer Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 3,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-overall-autumn',
							name: 'Autumn Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 2,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-overall-winter',
							name: 'Winter Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 4,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'seasonal-significant-annual',
							name: 'Annual Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 5,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-significant-spring',
							name: 'Spring Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 6,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-significant-summer',
							name: 'Summer Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 7,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-significant-autumn',
							name: 'Autumn Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 8,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-significant-winter',
							name: 'Winter Snowfall Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
							layerIndex: 9,
							mapserver: 'arcgis'
						}
					]
				}
			}
		},
		{
			id: 'min-temp-trend-10y',
			title: 'Annual Minimum Temperature Trend Analysis of 10 Years',
			control_type: 'nested_radio', // New control type for nested selections
			control_options: {
				trend_analysis: ['overall', 'significant'],
				seasons: ['annual', 'spring', 'summer', 'autumn', 'winter']
			},
			default_option: {
				trend_analysis: 'overall',
				season: 'spring'
			},
			charts: [],
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'min-temp-trend-overall',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 0,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'min-temp-trend-overall-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 2,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'min-temp-trend-overall-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 4,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'min-temp-trend-overall-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 6,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'min-temp-trend-overall-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 8,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'min-temp-trend-significant',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 1,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'min-temp-trend-significant-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 3,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'min-temp-trend-significant-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 5,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'min-temp-trend-significant-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 7,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'min-temp-trend-significant-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 9,
							mapserver: 'arcgis'
						}
					]
				}
			}
		},
		{
			id: 'max-temp-trend-10y',
			title: 'Annual Maximum Temperature Trend Analysis of 10 Years',
			control_type: 'nested_radio', // New control type for nested selections
			control_options: {
				trend_analysis: ['overall', 'significant'],
				seasons: ['annual', 'spring', 'summer', 'autumn', 'winter']
			},
			default_option: {
				trend_analysis: 'overall',
				season: 'spring'
			},
			charts: [],
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'max-temp-trend-overall',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 10,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'max-temp-trend-overall-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 12,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'max-temp-trend-overall-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 14,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'max-temp-trend-overall-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 16,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'max-temp-trend-overall-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 18,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'max-temp-trend-significant',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 11,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'max-temp-trend-significant-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 13,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'max-temp-trend-significant-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 15,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'max-temp-trend-significant-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 17,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'max-temp-trend-significant-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 19,
							mapserver: 'arcgis'
						}
					]
				}
			}
		}
	];

	const questions = [
		{
			id: 'question-1',
			question: 'Which areas have observed temperature rise  in last 30 years??',
			dataset_id: 'temp-trend-30y'
		}
		// {
		// 	id: 'question-2',
		// 	question: 'Which areas have observed temperature rise  in last 30 years?',
		// 	dataset_id: 'temp-rise-decade'
		// },
		// {
		// 	id: 'question-3',
		// 	question: 'Which areas have observed temperature rise more than 1.5 degrees in last decade?',
		// 	dataset_id: 'temp-rise-decade'
		// },
		// {
		// 	id: 'question-4',
		// 	question: 'Which areas have observed temperature rise more than 2.5 degrees in last decade?',
		// 	dataset_id: 'temp-rise-decade'
		// },
		// {
		// 	id: 'question-5',
		// 	question: 'What is the annual temperature anamoly trend over the past 30 years?',
		// 	dataset_id: 'annual-temp-anamoly-series'
		// }
	];
	const information_layers = [
		// {
		// 	id: 'map-indicator-1',
		// 	title: 'Annual Temperature Trend',
		// 	dataset_id: 'temp-trend-10y',
		// 	info: 'The Annual Mean Temperature Trend shows the spatial pattern of temperature change across the HKH region from 1995 to 2024. Each pixel indicates the rate of change in annual mean temperature per decade, derived using Sen-Median trend analysis and tested for significance with the Mann-Kendall (MK) test. The “Overall” layer shows trends for all pixels, while the “Significant” layer includes only those significant at the 95% confidence level (p < 0.05).',
		// 	source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		// },
		{
			id: 'map-indicator-2',
			title: 'Temperature Trend',
			dataset_id: 'seasonal-temp-trend',
			info: 'It represents  the spatial pattern of mean temperature trend for each climatic season: Spring (March-April-May), Summer (June-July-August), Autumn (September-October-November), and Winter (December-January-February)over the years(1995-2024).Each pixel on the map represents the rate of seasonal temperature change per decade, derived using Sen-Median trend analysis and Mann-Kendall (MK) test.The "Overall" results show the calculated trend for every pixel across the region, while the "Significant" represent only trends that have passed the Mann-Kendall significance test with a 95% confidence level (p < 0.05)',
			source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		},
		{
			id: 'map-indicator-3',
			title: 'Annual Temperature Anomaly',
			dataset_id: 'annual-temp-anamoly-series',
			info: 'Annual Temperature Anamoly represents the timeseries map of temperature anamoly from 1995 to 2024. The anamoly value is calculated by subtracting the long-term baseline value from each years mean temperature, with the baseline defined as the average temperature over the 34-year period from 1991 to 2024.',
			source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		},
		{
			id: 'map-indicator-4',
			title: 'Minimum Temperature Trend',
			dataset_id: 'min-temp-trend-10y',
			info: 'The temperature trend represents the spatial pattern of minimum annual and seasonal (Spring, Summer, Autumn, Winter) temperature trends from 1995 to 2024.Each pixel represents the rate of temperature change per decade, derived using Sen-Median trend analysis and the Mann-Kendall (MK) test. The "Overall" results show the calculated trend for every pixel across the region, while the "Significant" represent only trends that have passed the Mann-Kendall significance test with a 95% confidence level (p < 0.05)',
			source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		},
		{
			id: 'map-indicator-5',
			title: 'Maximum Temperature Trend',
			dataset_id: 'max-temp-trend-10y',
			info: 'The temperature trend represents the spatial pattern of maximum annual and seasonal (Spring, Summer, Autumn, Winter) temperature trends from 1995 to 2024.Each pixel represents the rate of temperature change per decade, derived using Sen-Median trend analysis and the Mann-Kendall (MK) test. The "Overall" results show the calculated trend for every pixel across the region, while the "Significant" represent only trends that have passed the Mann-Kendall significance test with a 95% confidence level (p < 0.05)',
			source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		},
		{
			id: 'map-indicator-5',
			title: 'Precipitation Trend',
			dataset_id: 'seasonal-ppt-trend',
			info: 'It Represents  the spatial pattern of precipitation trend for each climatic season: Spring (March-April-May), Summer (June-July-August), Autumn (September-October-November), and Winter (December-January-February)over the years(1995-2024).Each pixel on the map represents the rate of seasonal precipitation change per decade, derived using Sen-Median trend analysis and Mann-Kendall (MK) test.The "Overall" results show the calculated trend for every pixel across the region, while the "Significant" represent only trends that have passed the Mann-Kendall significance test with a 95% confidence level (p < 0.05)',
			source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		},
		{
			id: 'map-indicator-6',
			title: 'Annual Precipitation Anomaly',
			dataset_id: 'annual-ppt-anamoly-series',
			info: 'Annual Precipitation Anamoly represents the timeseries map of precipitation anamoly from 1995 to 2024. The anamoly value is calculated by subtracting the long-term baseline value from each years total precipitation , with the baseline value defined as the average precipitation over the 34-year period from 1991 to 2024.',
			source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		},
		{
			id: 'map-indicator-7',
			title: 'Snowfall Trend',
			dataset_id: 'seasonal-snowfall-trend-10y',
			info: 'The Snowfall Trend represents the spatial pattern of annual and seasonal (Spring, Summer, Autumn, Winter) snowfall trends from 1995 to 2024.Each pixel represents the rate of snowfall change per decade, derived using Sen-Median trend analysis and the Mann-Kendall (MK) test. The ""Overall"" results show the calculated trend for every pixel across the region, while the ""Significant"" represent only trends that have passed the Mann-Kendall significance test with a 95% confidence level (p < 0.05)',
			source: 'ERA5-Land ( https://cds.climate.copernicus.eu)'
		}
	];
	// Track selected question - default to first question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection)
	let selectedInformationLayer = $state<string | null>('Seasonal Temperature Trend');

	// Track expanded layer for accordion - default closed
	let expandedLayer = $state<string | null>(null);

	// Track radio button selection for trend analysis
	// Trend analysis mode - dynamic based on dataset control_options
	let trendAnalysisMode = $state<string>('overall');

	// Track temperature rise threshold selection
	let temperatureRiseThreshold = $state<'0.5' | '1' | '1.5' | '2' | '2.5'>('1.5');

	// Track seasonal selection for nested radio controls - dynamic based on dataset control_options
	let selectedSeason = $state<string>('spring');

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

	// Legend state management
	let legendData = $state<
		Record<
			string,
			{ name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }
		>
	>({});
	let legendCollapsed = $state(false);

	// Track questions panel state
	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Add new state variables for layers panel
	let layersPanelOpen = $state(false);
	let activeBaseLayers = $state<Record<number, boolean>>({});

	// Basemap switcher state
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('light');
	let baseMapLayer: TileLayer<any> | null = null;

	// Define base layers from HKH/Outline service
	const baseLayers = [
		{
			id: 0,
			name: 'Outline',
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer'
		}
	];

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

		// {
		// 	id: 'terrain',
		// 	name: 'Terrain',
		// 	url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
		// 	attribution: '© OpenStreetMap contributors, SRTM',
		// 	image: terrainMap
		// }
		// {
		// 	id: 'voyager',
		// 	name: 'Voyager',
		// 	url: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
		// 	attribution: '© OpenStreetMap contributors, © CARTO'
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
				// Apply special styling or configuration for layerId 0 (Outline)
				layer = new ImageLayer({
					source: new ImageArcGISRest({
						url: layerInfo.url,
						params: {
							LAYERS: `show:${layerId}`,
							FORMAT: 'PNG32',
							TRANSPARENT: true
						}
					}),
					zIndex: 10, // Higher z-index for outline to ensure visibility
					opacity: 0.7 // Slightly higher opacity for better visibility
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
					zIndex: 5 // Higher than climate layers but lower than outline
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

		// Update legend after changing layers
		fetchLegendData();
	}

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
			return Array.from({ length: 25 }, (_, i) => ({
				year: 2000 + i,
				label: (2000 + i).toString(),
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

	// Calculate default time index based on dataset's default_year
	let defaultTimeIndex = $derived.by(() => {
		if (!currentDataset?.time_dimension?.default_year || !timePeriods.length) {
			return 0;
		}

		const defaultYear = currentDataset.time_dimension.default_year;
		const index = timePeriods.findIndex((period) => period.year === defaultYear);
		return index !== -1 ? index : 0;
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

	// Function to fetch ArcGIS legend
	async function fetchArcGISLegend(serviceUrl: string, layerId: number) {
		try {
			const legendUrl = `${serviceUrl}/legend?f=json`;
			const response = await fetch(legendUrl);
			const data = await response.json();

			const layerLegend = data.layers.find((l: any) => l.layerId === layerId);
			if (layerLegend) {
				return {
					name: layerLegend.layerName,
					items: layerLegend.legend.map((item: any) => ({
						label: item.label,
						imageData: `data:image/png;base64,${item.imageData}`
					}))
				};
			}
		} catch (error) {
			console.error('Error fetching ArcGIS legend:', error);
		}
		return null;
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
				opacity: 0.7, // Reduced opacity for better visibility
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
				opacity: 0.8, // Reduced opacity for better visibility
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

			// Get all layers from the map (including base layers)
			if (map) {
				const layers = map.getLayers().getArray();

				for (const layer of layers) {
					// Type guard to check if layer has getSource method
					if ('getSource' in layer && typeof layer.getSource === 'function') {
						const source = (layer as any).getSource();

						if (source instanceof ImageArcGISRest) {
							// Handle layerId 0 explicitly, without using || that treats 0 as falsy
							let layerId = (layer as any).get('layerId');
							if (layerId === undefined || layerId === null) {
								layerId = (layer as any).get('baseLayerId');
							}

							const serviceUrl = source.getUrl();

							console.log('Found ArcGIS layer - ID:', layerId, 'URL:', serviceUrl);

							if (layerId !== undefined && layerId !== null && serviceUrl) {
								const legendKey = `${serviceUrl}_${layerId}`;

								if (!legendData[legendKey]) {
									console.log('Fetching legend for layer:', layerId);
									const legend = await fetchArcGISLegend(serviceUrl, layerId);
									if (legend) {
										legendData[legendKey] = legend;
										console.log('Legend fetched successfully for layer:', layerId);
									} else {
										console.log('No legend data returned for layer:', layerId);
									}
								} else {
									legendData[legendKey] = legendData[legendKey];
									console.log('Using cached legend for layer:', layerId);
								}
							}
						}
					}
				}
			}

			// Also fetch legend for climate data layers if dataset is selected
			if (currentDataset && currentMapLayers) {
				console.log('Fetching legend data for dataset:', currentDataset.id);

				// Get current layers based on control type
				let layersToFetch: any[] = [];

				if (currentDataset.control_type === 'radio') {
					const selectedLayers = (currentMapLayers as any)[trendAnalysisMode];
					layersToFetch = Array.isArray(selectedLayers) ? selectedLayers : [selectedLayers];
				} else if (currentDataset.control_type === 'threshold-control') {
					const selectedLayers = currentMapLayers[temperatureRiseThreshold];
					layersToFetch = Array.isArray(selectedLayers) ? selectedLayers : [selectedLayers];
				} else if (currentDataset.control_type === 'time_slider') {
					const currentYear = timePeriods[currentTimeIndex]?.year.toString() || '2024';
					const currentTimeLayer = (currentMapLayers as any)[currentYear];
					if (currentTimeLayer) {
						layersToFetch = [currentTimeLayer];
					}
				} else if (currentDataset.control_type === 'nested_radio') {
					const trendLayers = (currentMapLayers as any)[trendAnalysisMode];
					if (trendLayers && trendLayers[selectedSeason]) {
						const selectedLayers = trendLayers[selectedSeason];
						layersToFetch = Array.isArray(selectedLayers) ? selectedLayers : [selectedLayers];
					}
				}

				// Fetch legend for each climate layer
				for (const layer of layersToFetch) {
					if (!layer) continue;

					// Use a consistent key for time slider datasets to avoid multiple legends
					let uniqueKey: string;
					if (currentDataset.control_type === 'time_slider') {
						uniqueKey = `${currentDataset.id}_timeslider`; // Single consistent key for time slider
					} else {
						uniqueKey = `${layer.url}_${layer.layerIndex}`;
					}

					if (layer.mapserver === 'arcgis') {
						try {
							const legendUrl = `${layer.url}/legend?f=json`;
							const response = await fetch(legendUrl);
							const data = await response.json();

							const targetLayerId = parseInt(layer.layerIndex);
							const layerLegend = data.layers?.find((l: any) => l.layerId === targetLayerId);

							if (layerLegend) {
								// For time slider, use a generic name without the year based on dataset type
								let legendName = layer.name;
								if (currentDataset.control_type === 'time_slider') {
									if (currentDataset.id.includes('temp')) {
										legendName = 'Temperature Anomaly';
									} else if (currentDataset.id.includes('ppt')) {
										legendName = 'Precipitation Anomaly';
									} else {
										legendName = 'Climate Anomaly';
									}
								}

								legendData[uniqueKey] = {
									name: legendName,
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

						// For time slider, use a generic name without the year based on dataset type
						let legendName = layer.name;
						if (currentDataset.control_type === 'time_slider') {
							if (currentDataset.id.includes('temp')) {
								legendName = 'Temperature Anomaly';
							} else if (currentDataset.id.includes('ppt')) {
								legendName = 'Precipitation Anomaly';
							} else {
								legendName = 'Climate Anomaly';
							}
						}

						legendData[uniqueKey] = {
							name: legendName,
							items: [
								{
									label: legendName,
									imageUrl: legendUrl
								}
							]
						};
					}
				}
			}

			console.log('Legend data updated:', Object.keys(legendData));
		}, 300); // 300ms debounce delay
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

		console.log(
			'Updating map layers for dataset:',
			currentDataset.id,
			'control_type:',
			currentDataset.control_type
		);

		// Get current control state and add appropriate layers
		if (currentDataset.control_type === 'radio') {
			// For radio controls, show layer based on selected mode
			console.log('Radio control - trendAnalysisMode:', trendAnalysisMode);
			const selectedLayers = (currentMapLayers as any)[trendAnalysisMode];
			console.log('Selected layers for', trendAnalysisMode, ':', selectedLayers);
			if (selectedLayers) {
				if (Array.isArray(selectedLayers)) {
					addMultipleLayers(selectedLayers);
				} else {
					addWMSLayer(selectedLayers);
				}
			}
		} else if (currentDataset.control_type === 'threshold-control') {
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
		} else if (currentDataset.control_type === 'nested_radio') {
			// For nested radio controls, show layer based on both trend analysis and season
			const trendLayers = (currentMapLayers as any)[trendAnalysisMode];
			if (trendLayers && trendLayers[selectedSeason]) {
				const selectedLayers = trendLayers[selectedSeason];
				if (Array.isArray(selectedLayers)) {
					addMultipleLayers(selectedLayers);
				} else {
					addWMSLayer(selectedLayers);
				}
			}
		}

		// Fetch legend data after updating layers
		fetchLegendData();
	}

	// Function to handle question selection
	function selectQuestion(questionId: string) {
		// Stop playback if currently playing
		if (isPlaying) {
			stopPlayback();
		}

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
				trendAnalysisMode = dataset.default_option as string;
			} else if (dataset?.control_type === 'threshold-control' && dataset.default_option) {
				temperatureRiseThreshold = dataset.default_option as '0.5' | '1' | '1.5' | '2' | '2.5';
			} else if (dataset?.control_type === 'nested_radio') {
				// Use default_option if provided, otherwise use first available option from control_options
				const controlOpts = dataset.control_options as any;
				if (controlOpts && typeof controlOpts === 'object' && 'trend_analysis' in controlOpts) {
					if (dataset.default_option) {
						const defaultOpt = dataset.default_option as any;
						if (defaultOpt.trend_analysis) {
							trendAnalysisMode = defaultOpt.trend_analysis;
						} else if (
							Array.isArray(controlOpts.trend_analysis) &&
							controlOpts.trend_analysis.length > 0
						) {
							trendAnalysisMode = controlOpts.trend_analysis[0];
						}
						if (defaultOpt.season) {
							selectedSeason = defaultOpt.season;
						} else if (Array.isArray(controlOpts.seasons) && controlOpts.seasons.length > 0) {
							selectedSeason = controlOpts.seasons[0];
						}
					} else {
						// Use first available option from control_options
						if (
							Array.isArray(controlOpts.trend_analysis) &&
							controlOpts.trend_analysis.length > 0
						) {
							trendAnalysisMode = controlOpts.trend_analysis[0];
						}
						if (Array.isArray(controlOpts.seasons) && controlOpts.seasons.length > 0) {
							selectedSeason = controlOpts.seasons[0];
						}
					}
				}
			} else if (dataset?.control_type === 'time_slider' && dataset.time_dimension?.default_year) {
				// Set time index to match default year - this will be handled by the effect watcher
				console.log(
					'Time slider dataset selected, default year:',
					dataset.time_dimension.default_year
				);
			}
		}

		console.log('Question selected:', questionId);
	}

	// Function to select information layer
	// Function to toggle layer expansion
	function toggleLayerExpansion(layerId: string) {
		if (expandedLayer === layerId) {
			expandedLayer = null;
		} else {
			expandedLayer = layerId;
		}
	}

	function selectInformationLayer(layerId: string) {
		// Stop playback if currently playing
		if (isPlaying) {
			stopPlayback();
		}

		// If clicking the same layer that's already selected, keep it selected
		if (selectedInformationLayer === layerId) {
			// Layer is already selected
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
				trendAnalysisMode = dataset.default_option as string;
			} else if (dataset?.control_type === 'threshold-control' && dataset.default_option) {
				temperatureRiseThreshold = dataset.default_option as '0.5' | '1.5' | '2.5';
			} else if (dataset?.control_type === 'nested_radio') {
				// Use default_option if provided, otherwise use first available option from control_options
				const controlOpts = dataset.control_options as any;
				if (controlOpts && typeof controlOpts === 'object' && 'trend_analysis' in controlOpts) {
					if (dataset.default_option) {
						const defaultOpt = dataset.default_option as any;
						if (defaultOpt.trend_analysis) {
							trendAnalysisMode = defaultOpt.trend_analysis;
						} else if (
							Array.isArray(controlOpts.trend_analysis) &&
							controlOpts.trend_analysis.length > 0
						) {
							trendAnalysisMode = controlOpts.trend_analysis[0];
						}
						if (defaultOpt.season) {
							selectedSeason = defaultOpt.season;
						} else if (Array.isArray(controlOpts.seasons) && controlOpts.seasons.length > 0) {
							selectedSeason = controlOpts.seasons[0];
						}
					} else {
						// Use first available option from control_options
						if (
							Array.isArray(controlOpts.trend_analysis) &&
							controlOpts.trend_analysis.length > 0
						) {
							trendAnalysisMode = controlOpts.trend_analysis[0];
						}
						if (Array.isArray(controlOpts.seasons) && controlOpts.seasons.length > 0) {
							selectedSeason = controlOpts.seasons[0];
						}
					}
				}
			} else if (dataset?.control_type === 'time_slider' && dataset.time_dimension?.default_year) {
				// Set time index to match default year - this will be handled by the effect watcher
				console.log(
					'Time slider dataset selected, default year:',
					dataset.time_dimension.default_year
				);
			}
		}

		console.log('Information layer selected:', layerId);
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
</script>

<!-- 3-Column Layout with Dynamic States -->
<div class="relative grid grid-cols-12 items-stretch gap-4 lg:gap-6">
	<!-- Floating Reopen Button - Only visible when left panel is hidden -->
	{#if layoutState === 'hide-left'}
		<button
			onclick={() => setLayoutState('default')}
			class="fixed top-[14rem] left-0 z-50 rounded-r-lg border border-l-0 border-slate-300 bg-white/50 p-2 text-slate-600 shadow-xl transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-2xl active:bg-slate-100 lg:p-1.5"
			title="Show Story Panel"
		>
			<ChevronsRight class="h-5 w-5 lg:h-4 lg:w-4" />
		</button>
	{/if}
	<!-- Left Sidebar - Story + Questions -->

	<div
		class="sticky top-9 col-span-12 h-[90vh] min-h-[400px] flex-1 overflow-hidden rounded-xl border border-slate-200/30 lg:col-span-3 lg:h-[60vh] lg:max-h-[800px] lg:min-h-[500px]"
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
								class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"
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
					src="https://storymaps.arcgis.com/stories/591c56e9ae254c649df92c33c07cffce"
					width="100%"
					height="100%"
					style="border:none;"
					allowfullscreen
					class="h-full w-full"
					title="ArcGIS StoryMap - Climate"
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
					class="order-2 flex min-w-0 flex-col gap-4 lg:order-1 lg:gap-6 {layoutState ===
					'hide-left'
						? 'flex-1'
						: 'flex-1'}"
				>
					<!-- Map Section -->
					<div
						class="relative h-[50vh] min-h-[400px] overflow-hidden rounded-xl border border-slate-200/30 lg:h-[60vh] lg:max-h-[800px] lg:min-h-[500px]"
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
								<House class="h-3.5 w-3.5 text-slate-800" />
							</button>

							<!-- Basemap Switcher Button -->
							<button
								class="absolute top-10 right-2 z-20 rounded border border-slate-200/50 bg-white p-1 shadow hover:bg-gray-100 focus:outline focus:outline-1 focus:outline-black"
								onclick={() => (basemapPanelOpen = !basemapPanelOpen)}
								title="Change Basemap"
								aria-label="Change Basemap"
							>
								<MapIcon class="h-3.5 w-3.5 text-slate-800" />
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
													checked={!!activeBaseLayers[layerInfo.id]}
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
							{#if currentDataset && currentDataset.control_type === 'time_slider'}
								{#if !isTimeSliderVisible}
									<!-- Time Control Toggle Button -->
									<button
										onclick={toggleTimeSlider}
										class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-2 rounded-full border border-white/30 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl {isFullscreen
											? 'z-[9999]'
											: 'z-10'}"
										title="Show Time Controls"
									>
										<Calendar class="h-3.5 w-3.5" />
										<span>Time</span>
									</button>
								{:else}
									<!-- Expanded Time Slider Panel -->
									<div
										class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-3 rounded-full border border-white/30 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm {isFullscreen
											? 'z-[9999]'
											: 'z-10'}"
									>
										<!-- Time Label -->
										<!-- <div class="flex items-center space-x-2">
											<Calendar class="h-3.5 w-3.5 text-blue-600" />
											<span class="text-sm font-medium text-slate-700">Time</span>
										</div> -->

										<!-- Separator -->
										<!-- <div class="h-4 w-px bg-slate-300"></div> -->

										<!-- Step Backward -->
										<button
											onclick={stepBackward}
											disabled={currentTimeIndex === 0}
											class="rounded-full p-1.5 text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
											title="Previous Year"
										>
											<SkipBack class="h-3.5 w-3.5" />
										</button>

										<!-- Play/Pause -->
										<button
											onclick={togglePlayback}
											class="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-2 text-white shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-cyan-600 hover:shadow-md"
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
											onclick={stepForward}
											disabled={currentTimeIndex === timePeriods.length - 1}
											class="rounded-full p-1.5 text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
											title="Next Year"
										>
											<SkipForward class="h-3.5 w-3.5" />
										</button>

										<!-- Compact Time Slider -->
										<div class="flex items-center space-x-2">
											<span class="min-w-[2.5rem] text-xs font-medium text-blue-600"
												>{timePeriods[currentTimeIndex].label}</span
											>
											<input
												type="range"
												min="0"
												max={timePeriods.length - 1}
												bind:value={currentTimeIndex}
												oninput={(e) => goToTime(parseInt((e.target as HTMLInputElement).value))}
												class="compact-slider w-32"
											/>
										</div>

										<!-- Close Button -->
										<button
											onclick={toggleTimeSlider}
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
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm {isFullscreen
										? 'z-[9999]'
										: 'z-10'}"
								>
									<!-- Analysis Label -->
									<!-- <div class="flex items-center space-x-2">
										<Layers class="h-3.5 w-3.5 text-blue-600" />
										<span class="text-sm font-medium text-slate-700">Trend</span>
									</div> -->

									<!-- Separator -->
									<!-- <div class="h-4 w-px bg-slate-300"></div> -->

									<!-- Overall Option -->
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											bind:group={trendAnalysisMode}
											value="overall"
											class="h-3.5 w-3.5 border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm font-medium text-slate-700">Overall</span>
									</label>

									<!-- Significant Option -->
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											bind:group={trendAnalysisMode}
											value="significant"
											class="h-3.5 w-3.5 border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm font-medium text-slate-700">Significant</span>
									</label>
								</div>
							{:else if currentDataset && currentDataset.control_type === 'nested_radio'}
								<!-- Always show expanded Nested Radio Controls Panel (Trend Analysis + Seasons) -->
								<div
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-4 py-1 shadow-xl backdrop-blur-sm {isFullscreen
										? 'z-[9999]'
										: 'z-10'}"
								>
									<!-- Trend Analysis Section -->
									<div class="flex items-center space-x-2">
										{#if currentDataset.control_options && typeof currentDataset.control_options === 'object' && 'trend_analysis' in currentDataset.control_options}
											{#each (currentDataset.control_options as any).trend_analysis as option}
												<label class="flex cursor-pointer items-center space-x-1">
													<input
														type="radio"
														bind:group={trendAnalysisMode}
														value={option}
														class="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
													/>
													<span class="text-xs font-medium text-slate-700 capitalize">{option}</span
													>
												</label>
											{/each}
										{/if}
									</div>

									<!-- Separator -->
									<div class="h-4 w-px bg-slate-300"></div>

									<!-- Seasonal Selection Section -->
									<div class="flex items-center space-x-2">
										<!-- Season Options as Toggle Buttons -->
										{#if currentDataset.control_options && typeof currentDataset.control_options === 'object' && 'seasons' in currentDataset.control_options}
											<div class="flex items-center space-x-0.5 rounded-full bg-slate-100/80 p-0.5">
												{#each (currentDataset.control_options as any).seasons as seasonOption}
													<label class="relative cursor-pointer">
														<input
															type="radio"
															bind:group={selectedSeason}
															value={seasonOption}
															class="peer sr-only"
														/>
														<div
															class="rounded-full px-2 py-1 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {selectedSeason ===
															seasonOption
																? 'text-white'
																: 'text-slate-600'}"
														>
															{seasonOption.charAt(0).toUpperCase() + seasonOption.slice(1)}
														</div>
													</label>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							{:else if currentDataset && currentDataset.control_type === 'threshold-control'}
								<!-- Always show expanded Temperature Rise Threshold Panel -->
								<div
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm {isFullscreen
										? 'z-[9999]'
										: 'z-10'}"
								>
									<!-- Temperature Rise Label -->
									<div class="flex items-center space-x-2">
										<div class="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-1">
											<div class="h-2 w-2 rounded-full bg-white"></div>
										</div>
										<span class="text-sm font-medium text-slate-700">Temperature Rise > </span>
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
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {temperatureRiseThreshold ===
												'0.5'
													? 'text-white'
													: 'text-slate-600'}"
											>
												0.5°C
											</div>
										</label>

										<!-- 1°C Option -->
										<label class="relative cursor-pointer">
											<input
												type="radio"
												bind:group={temperatureRiseThreshold}
												value="1"
												class="peer sr-only"
											/>
											<div
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {temperatureRiseThreshold ===
												'1'
													? 'text-white'
													: 'text-slate-600'}"
											>
												1°C
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
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {temperatureRiseThreshold ===
												'1.5'
													? 'text-white'
													: 'text-slate-600'}"
											>
												1.5°C
											</div>
										</label>

										<!-- 2°C Option -->
										<label class="relative cursor-pointer">
											<input
												type="radio"
												bind:group={temperatureRiseThreshold}
												value="2"
												class="peer sr-only"
											/>
											<div
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {temperatureRiseThreshold ===
												'2'
													? 'text-white'
													: 'text-slate-600'}"
											>
												2°C
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
												class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {temperatureRiseThreshold ===
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

							<!-- Legend Panel - Bottom Right -->
							{#if currentDataset && Object.keys(legendData).length > 0}
								<div class="absolute right-4 bottom-4 {isFullscreen ? 'z-[9999]' : 'z-10'}">
									<!-- Legend Toggle Button -->
									<button
										class="mb-2 flex w-full items-center justify-between rounded-lg border border-white/30 bg-white/95 p-2 text-sm shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl"
										onclick={() => (legendCollapsed = !legendCollapsed)}
									>
										<div class="flex items-center space-x-2">
											<List class="h-3.5 w-3.5 text-blue-600" />
											{#if !legendCollapsed}
												<span class="font-medium text-slate-700">Legend</span>
											{/if}
										</div>
										<!-- <svg
											class="h-3.5 w-3.5 transform text-slate-600 transition-transform duration-300 {legendCollapsed
												? 'rotate-180'
												: ''}"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg> -->
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
						<!-- <h3 class="mb-4 text-lg font-semibold text-slate-700">Climate Analytics</h3> -->
						<div class="rounded-lg bg-slate-50/50">
							{#if currentDataset && currentCharts && currentCharts.length > 0}
								<div class="space-y-6">
									{#each currentCharts as chart, index}
										<div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
											<Chart
												chartData={chart.chart_data}
												title={chart.title}
												subtitle={(chart as any).subtitle}
												chart_type={chart.chart_type}
												yAxisTitle={(chart as any).yAxisTitle || 'Value'}
												plotOptions={(chart.chart_data as any).plotOptions || {}}
												showLegend={(chart as any).showLegend}
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

				<!-- Right part: Information Layer and Questions - Shows first on mobile/tablet -->
				<div class="order-1 w-full flex-shrink-0 lg:order-2 lg:w-75">
					<div
						class=" top-6 min-h-[calc(100vh-16rem)] flex-1 flex-col rounded-2xl border border-white/20 bg-white/70 pr-4 pl-4"
					>
						<!-- Information Layer Header -->
						<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
							<div class="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
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
												? 'border-blue-300 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 shadow-md'
												: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80'}"
										>
											<button
												onclick={() => selectInformationLayer(layer.title)}
												class="flex w-full items-start space-x-2 p-4 text-left transition-all duration-200 hover:opacity-80"
											>
												<h4
													class="flex-1 text-sm font-medium {selectedInformationLayer ===
													layer.title
														? 'text-blue-800'
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
					<div class="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
						<Info class="h-3.5 w-3.5 text-white" />
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
							onclick={() => selectQuestion(questionItem.id)}
						>
							<div class="flex items-start space-x-2">
								<div class="mt-1 flex-shrink-0">
									{#if selectedQuestionId === questionItem.id}
										<CheckCircle class="h-3.5 w-3.5 text-blue-600" />
									{:else}
										<div
											class="h-3.5 w-3.5 rounded-full border-2 border-slate-300 group-hover:border-blue-400"
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
		{/if}

		<button
			onclick={toggleQuestionsPanel}
			class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
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

	/* Move OpenLayers attribution to left side */
	:global(.ol-attribution) {
		right: auto !important;
		left: 0.5em !important;
		text-align: left !important;
		flex-flow: row !important;
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
