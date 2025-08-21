<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import climate_1 from '$lib/assets/images/climate_1.png';
	import climate_2 from '$lib/assets/images/climate_2.png';
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
		List
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

			map = new Map({
				target: mapContainer,
				controls: defaultControls().extend([
					fullScreenControl,
					new ScaleLine({ units: 'metric', bar: true })
				]),
				interactions: defaultInteractions({
					mouseWheelZoom: false
				}),
				layers: [
					new TileLayer({
						// source: new OSM()
						// source: new XYZ({
						// 	url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
						// })

						source: new XYZ({
							url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
							// attributions: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ'
						})
					})
				],
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
		{
			id: 'temp-trend-10y',
			title: 'Overall Annual Temperature Trend Analysis of 10 Years',
			description: 'Temperature trend analysis with overall vs significant trend options',
			control_type: 'radio',
			control_options: ['overall', 'significant'],
			default_option: 'overall',
			charts: [
				{
					title: 'Annual Mean Temperature Trends (°C/decade)',
					chart_type: 'column',
					yAxisTitle: 'count',
					// xAxisConfig: {
					// 	type: 'linear',
					// 	min: -0.06,
					// 	max: 1.26,
					// 	title: {
					// 		text: 'Temperature Change (°C/decade)'
					// 	},
					// 	labels: {
					// 		formatter: function (this: { value: number }) {
					// 			// Format the temperature values
					// 			return this.value.toFixed(2);
					// 		}
					// 	},
					// 	tickInterval: 0.1,
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
						categories: [
							'-0.08 to -0.05',
							'-0.05 to -0.02',
							'-0.02 to 0.01',
							'0.01 to 0.03',
							'0.03 to 0.06',
							'0.06 to 0.09',
							'0.09 to 0.11',
							'0.11 to 0.14',
							'0.14 to 0.17',
							'0.17 to 0.19',
							'0.19 to 0.22',
							'0.22 to 0.25',
							'0.25 to 0.27',
							'0.27 to 0.30',
							'0.30 to 0.33',
							'0.33 to 0.35',
							'0.35 to 0.38',
							'0.38 to 0.41',
							'0.41 to 0.43',
							'0.43 to 0.46',
							'0.46 to 0.49',
							'0.49 to 0.52',
							'0.52 to 0.54',
							'0.54 to 0.57',
							'0.57 to 0.60',
							'0.60 to 0.62',
							'0.62 to 0.65',
							'0.65 to 0.68',
							'0.68 to 0.70',
							'0.70 to 0.73',
							'0.73 to 0.76',
							'0.76 to 0.78',
							'0.78 to 0.81',
							'0.81 to 0.84',
							'0.84 to 0.86',
							'0.86 to 0.89',
							'0.89 to 0.92',
							'0.92 to 0.95',
							'0.95 to 0.97',
							'0.97 to 1.00',
							'1.00 to 1.03',
							'1.03 to 1.05',
							'1.05 to 1.08',
							'1.08 to 1.11',
							'1.11 to 1.13',
							'1.13 to 1.16',
							'1.16 to 1.19',
							'1.19 to 1.21',
							'1.21 to 1.24',
							'1.24 to 1.27'
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
									1, 3, 4, 8, 13, 25, 15, 59, 170, 158, 272, 342, 288, 523, 475, 322, 464, 426, 296,
									403, 389, 346, 216, 301, 255, 155, 197, 114, 82, 86, 61, 50, 55, 46, 22, 34, 25,
									19, 8, 13, 6, 4, 3, 3, 1, 2, 2, 1, 2, 1
								],
								color: 'rgba(173, 216, 230, 0.8)', // Light blue like in your reference
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 0, 0, 0, 8, 73, 102, 174, 199, 201, 392, 384, 273, 421, 399, 284, 389,
									378, 341, 211, 299, 251, 155, 195, 114, 82, 86, 61, 50, 55, 46, 22, 34, 25, 19, 8,
									13, 6, 4, 3, 3, 1, 2, 2, 1, 2, 1
								],
								color: 'rgba(255, 99, 71, 0.8)', // Reddish color like in your reference
								zIndex: 2
							}
						]
					}
				}
				// {
				// 	title: 'Significant Annual Mean Temperature Trend',
				// 	chart_type: 'column',
				// 	yAxisTitle: 'Count',
				// 	chart_data: {
				// 		categories: [
				// 			'0.12–0.16',
				// 			'0.16–0.19',
				// 			'0.19–0.23',
				// 			'0.23–0.26',
				// 			'0.26–0.30',
				// 			'0.30–0.34',
				// 			'0.34–0.37',
				// 			'0.37–0.41',
				// 			'0.41–0.44',
				// 			'0.44–0.48',
				// 			'0.48–0.52',
				// 			'0.52–0.55',
				// 			'0.55–0.59',
				// 			'0.59–0.62',
				// 			'0.62–0.66',
				// 			'0.66–0.69',
				// 			'0.69–0.73',
				// 			'0.73–0.77',
				// 			'0.77–0.80',
				// 			'0.80–0.84',
				// 			'0.84–0.87',
				// 			'0.87–0.91',
				// 			'0.91–0.95',
				// 			'0.95–0.98',
				// 			'0.98–1.02',
				// 			'1.02–1.05',
				// 			'1.05–1.09',
				// 			'1.09–1.12',
				// 			'1.12–1.16',
				// 			'1.16–1.20',
				// 			'1.20–1.23',
				// 			'1.23–1.27'
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
				// 				name: 'Significant trend',
				// 				data: [
				// 					40, 156, 216, 285, 454, 457, 507, 477, 505, 460, 407, 369, 352, 265, 209, 138,
				// 					114, 72, 79, 57, 40, 37, 23, 15, 11, 9, 4, 3, 2, 3, 2, 1
				// 				],
				// 				color: '#7cb5ec'
				// 			}
				// 		]
				// 	}
				// }
			],
			map_layers: {
				overall: [
					{
						id: 'temp-trend-overall',
						name: 'Overall Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				],
				significant: [
					{
						id: 'temp-trend-significant',
						name: 'Significant Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 5,
						mapserver: 'arcgis'
					}
				]
			}
		},
		{
			id: 'temp-trend-30y',
			title: 'Annual Temperature Trend Analysis',
			description: 'Temperature trend analysis with overall vs significant trend options',
			control_type: 'temperature_threshold',
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
			control_type: 'temperature_threshold',
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
										color: '#4C4CFF'
									},
									{
										color: '#FF4C4C' // values >= 0
									}
								]
							}
						},
						series: [
							{
								name: 'Anomaly',
								data: [
									-0.5494, -0.4961, -1.305, 0.0726, 0.3329, -0.38, 0.1546, -0.1055, 0.0281, 0.0185,
									-0.2289, 0.4456, 0.1589, -0.1417, 0.3663, 0.63, 0.0042, -0.3543, 0.1069, 0.0474,
									0.3258, 1.0569, 0.7923, 0.45, 0.112, 0.3581, 0.8142, 0.7695, 0.6875, 1.1673
								]
							}
						]
					}
				},
				{
					title: 'Temperature Anomalies - Line Chart with Running Means',
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
								name: 'Anomaly',
								data: [
									-0.5494, -0.4961, -1.305, 0.0726, 0.3329, -0.38, 0.1546, -0.1055, 0.0281, 0.0185,
									-0.2289, 0.4456, 0.1589, -0.1417, 0.3663, 0.63, 0.0042, -0.3543, 0.1069, 0.0474,
									0.3258, 1.0569, 0.7923, 0.45, 0.112, 0.3581, 0.8142, 0.7695, 0.6875, 1.1673
								],
								color: '#AA4643',
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
									-0.389,
									-0.3551,
									-0.225,
									0.0149,
									0.006,
									-0.0569,
									-0.0266,
									0.0316,
									0.0844,
									0.0505,
									0.12,
									0.2918,
									0.2035,
									0.1009,
									0.1506,
									0.0868,
									0.026,
									0.2365,
									0.4659,
									0.5345,
									0.5474,
									0.5539,
									0.5053,
									0.5008,
									0.5483,
									0.7593,
									null,
									null
								],
								color: '#FFA000',
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
									-0.2229,
									-0.1909,
									-0.0967,
									0.0497,
									0.0282,
									0.0316,
									0.1326,
									0.1175,
									0.0927,
									0.1005,
									0.1034,
									0.1589,
									0.22,
									0.2834,
									0.3425,
									0.3171,
									0.2899,
									0.3709,
									0.4833,
									0.5414,
									0.6534,
									null,
									null,
									null,
									null
								],
								color: '#4C4CFF',
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
				seasons: ['spring', 'summer', 'autumn', 'winter']
			},
			default_option: {
				trend_analysis: 'overall',
				season: 'spring'
			},
			charts: [
				{
					title: 'Winter Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Count',
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
							'-0.50 to -0.45',
							'-0.45 to -0.39',
							'-0.39 to -0.34',
							'-0.34 to -0.28',
							'-0.28 to -0.23',
							'-0.23 to -0.17',
							'-0.17 to -0.12',
							'-0.12 to -0.06',
							'-0.06 to -0.01',
							'-0.01 to 0.05',
							'0.05 to 0.10',
							'0.10 to 0.15',
							'0.15 to 0.21',
							'0.21 to 0.26',
							'0.26 to 0.32',
							'0.32 to 0.37',
							'0.37 to 0.43',
							'0.43 to 0.48',
							'0.48 to 0.54',
							'0.54 to 0.59',
							'0.59 to 0.65',
							'0.65 to 0.70',
							'0.70 to 0.76',
							'0.76 to 0.81',
							'0.81 to 0.86',
							'0.86 to 0.92',
							'0.92 to 0.97',
							'0.97 to 1.03',
							'1.03 to 1.08',
							'1.08 to 1.14',
							'1.14 to 1.19',
							'1.19 to 1.25',
							'1.25 to 1.30',
							'1.30 to 1.36',
							'1.36 to 1.41',
							'1.41 to 1.46',
							'1.46 to 1.52',
							'1.52 to 1.57',
							'1.57 to 1.63',
							'1.63 to 1.68',
							'1.68 to 1.74',
							'1.74 to 1.79',
							'1.79 to 1.85',
							'1.85 to 1.90',
							'1.90 to 1.96',
							'1.96 to 2.01',
							'2.01 to 2.07',
							'2.07 to 2.12',
							'2.12 to 2.17',
							'2.17 to 2.23'
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
									5, 2, 8, 11, 21, 56, 49, 100, 152, 229, 278, 396, 607, 477, 639, 518, 556, 420,
									399, 240, 237, 184, 171, 135, 130, 137, 79, 84, 79, 73, 41, 44, 29, 38, 16, 24,
									23, 8, 17, 3, 10, 10, 12, 6, 5, 2, 1, 1, 1, 2
								],
								color: 'rgba(173, 216, 230, 0.8)', // Light blue
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 5, 27, 69, 81, 50, 32, 21, 33, 42, 50, 44,
									48, 48, 40, 43, 43, 52, 27, 32, 20, 27, 11, 18, 13, 7, 10, 3, 5, 10, 10, 5, 3, 1,
									1, 0, 1, 1
								],
								color: 'rgba(255, 99, 71, 0.85)', // Coral/reddish
								zIndex: 2
							}
						]
					}
				},

				// {
				// 	title: 'Overall Winter Temperature Trend',
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
				// 			formatter: function (this: { value: number }) {
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
				// 				name: 'Overall Winter Temperature Trend',
				// 				data: [
				// 					// Convert to [x, y] format where x is the temperature value
				// 					[-0.46, 7],
				// 					[-0.375, 11],
				// 					[-0.285, 23],
				// 					[-0.2, 68],
				// 					[-0.115, 122],
				// 					[-0.03, 239],
				// 					[0.055, 420],
				// 					[0.14, 730],
				// 					[0.225, 861],
				// 					[0.31, 859],
				// 					[0.395, 844],
				// 					[0.48, 628],
				// 					[0.565, 435],
				// 					[0.65, 311],
				// 					[0.735, 251],
				// 					[0.82, 225],
				// 					[0.905, 172],
				// 					[0.99, 126],
				// 					[1.075, 117],
				// 					[1.16, 75],
				// 					[1.245, 55],
				// 					[1.33, 51],
				// 					[1.415, 36],
				// 					[1.5, 26],
				// 					[1.585, 22],
				// 					[1.67, 5],
				// 					[1.755, 20],
				// 					[1.84, 13],
				// 					[1.925, 8],
				// 					[2.01, 2],
				// 					[2.095, 2],
				// 					[2.18, 2]
				// 				],
				// 				color: '#7cb5ec'
				// 			}
				// 		]
				// 	}
				// },
				// {
				// 	title: 'Significant Winter Temperature Trend',
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
				// 				name: 'Significant Winter Temperature Trend',
				// 				data: [
				// 					// Convert to [x, y] format
				// 					[-0.46, 1],
				// 					[-0.375, 0],
				// 					[-0.285, 0],
				// 					[-0.2, 0],
				// 					[-0.115, 0],
				// 					[-0.03, 0],
				// 					[0.055, 20],
				// 					[0.14, 110],
				// 					[0.225, 89],
				// 					[0.31, 45],
				// 					[0.395, 34],
				// 					[0.48, 64],
				// 					[0.565, 64],
				// 					[0.65, 76],
				// 					[0.735, 64],
				// 					[0.82, 59],
				// 					[0.905, 59],
				// 					[0.99, 62],
				// 					[1.075, 42],
				// 					[1.16, 33],
				// 					[1.245, 24],
				// 					[1.33, 26],
				// 					[1.415, 12],
				// 					[1.5, 11],
				// 					[1.585, 6],
				// 					[1.67, 13],
				// 					[1.755, 12],
				// 					[1.84, 4],
				// 					[1.925, 2],
				// 					[2.01, 0],
				// 					[2.095, 2]
				// 				],
				// 				color: '#7cb5ec'
				// 			}
				// 		]
				// 	}
				// },

				{
					title: 'Summer Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Count',
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
							'-0.22 to -0.18',
							'-0.18 to -0.15',
							'-0.15 to -0.11',
							'-0.11 to -0.07',
							'-0.07 to -0.04',
							'-0.04 to 0',
							'0 to 0.03',
							'0.03 to 0.07',
							'0.07 to 0.1',
							'0.1 to 0.14',
							'0.14 to 0.17',
							'0.17 to 0.21',
							'0.21 to 0.24',
							'0.24 to 0.28',
							'0.28 to 0.32',
							'0.32 to 0.35',
							'0.35 to 0.39',
							'0.39 to 0.42',
							'0.42 to 0.46',
							'0.46 to 0.49',
							'0.49 to 0.53',
							'0.53 to 0.56',
							'0.56 to 0.6',
							'0.6 to 0.63',
							'0.63 to 0.67',
							'0.67 to 0.7',
							'0.7 to 0.74',
							'0.74 to 0.78',
							'0.78 to 0.81',
							'0.81 to 0.85',
							'0.85 to 0.88',
							'0.88 to 0.92',
							'0.92 to 0.95',
							'0.95 to 0.99',
							'0.99 to 1.02',
							'1.02 to 1.06',
							'1.06 to 1.09',
							'1.09 to 1.13',
							'1.13 to 1.17',
							'1.17 to 1.2',
							'1.2 to 1.24',
							'1.24 to 1.27',
							'1.27 to 1.31',
							'1.31 to 1.34',
							'1.34 to 1.38',
							'1.38 to 1.41',
							'1.41 to 1.45',
							'1.45 to 1.48',
							'1.48 to 1.52',
							'1.52 to 1.55'
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
									1, 2, 0, 6, 11, 29, 25, 47, 60, 132, 197, 302, 261, 538, 701, 518, 864, 626, 759,
									465, 526, 195, 192, 101, 71, 35, 25, 13, 8, 8, 16, 6, 3, 4, 3, 3, 3, 3, 0, 0, 0,
									0, 3, 1, 0, 0, 0, 0, 1, 1
								],
								color: 'rgba(173, 216, 230, 0.8)',
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 62, 87, 99, 308, 492, 437, 764, 577, 720, 454, 508,
									185, 181, 96, 64, 35, 23, 13, 8, 8, 16, 6, 3, 4, 3, 3, 3, 3, 0, 0, 0, 0, 3, 1, 0,
									0, 0, 0, 1, 1
								],
								color: 'rgba(255, 99, 71, 0.85)',
								zIndex: 2
							}
						]
					}
				},

				{
					title: 'Spring Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Count',
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
							'-0.42 to -0.38',
							'-0.38 to -0.34',
							'-0.34 to -0.30',
							'-0.30 to -0.26',
							'-0.26 to -0.22',
							'-0.22 to -0.18',
							'-0.18 to -0.14',
							'-0.14 to -0.10',
							'-0.10 to -0.06',
							'-0.06 to -0.01',
							'-0.01 to 0.03',
							'0.03 to 0.07',
							'0.07 to 0.11',
							'0.11 to 0.15',
							'0.15 to 0.19',
							'0.19 to 0.23',
							'0.23 to 0.27',
							'0.27 to 0.31',
							'0.31 to 0.35',
							'0.35 to 0.39',
							'0.39 to 0.43',
							'0.43 to 0.47',
							'0.47 to 0.51',
							'0.51 to 0.55',
							'0.55 to 0.59',
							'0.59 to 0.63',
							'0.63 to 0.67',
							'0.67 to 0.71',
							'0.71 to 0.75',
							'0.75 to 0.79',
							'0.79 to 0.83',
							'0.83 to 0.87',
							'0.87 to 0.92',
							'0.92 to 0.96',
							'0.96 to 1.00',
							'1.00 to 1.04',
							'1.04 to 1.08',
							'1.08 to 1.12',
							'1.12 to 1.16',
							'1.16 to 1.20',
							'1.20 to 1.24',
							'1.24 to 1.28',
							'1.28 to 1.32',
							'1.32 to 1.36',
							'1.36 to 1.40',
							'1.40 to 1.44',
							'1.44 to 1.48',
							'1.48 to 1.52',
							'1.52 to 1.56',
							'1.56 to 1.60'
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
									4, 2, 5, 8, 10, 16, 29, 40, 49, 100, 154, 221, 312, 392, 518, 523, 509, 465, 497,
									422, 420, 366, 317, 188, 191, 187, 150, 130, 112, 80, 80, 49, 45, 27, 24, 32, 24,
									16, 9, 9, 10, 3, 1, 5, 4, 5, 1, 1, 3, 0
								],
								color: 'rgba(173, 216, 230, 0.8)',
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 9, 22, 44, 55, 109, 130, 157, 155, 150,
									95, 106, 109, 105, 95, 81, 60, 68, 46, 43, 26, 24, 32, 24, 16, 9, 9, 10, 3, 1, 5,
									4, 5, 1, 1, 3, 0
								],
								color: 'rgba(255, 99, 71, 0.85)',
								zIndex: 2
							}
						]
					}
				},

				{
					title: 'Autumn Temperature Trend',
					chart_type: 'column',
					yAxisTitle: 'Count',
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
							'-0.42 to -0.38',
							'-0.38 to -0.34',
							'-0.34 to -0.30',
							'-0.30 to -0.26',
							'-0.26 to -0.22',
							'-0.22 to -0.18',
							'-0.18 to -0.14',
							'-0.14 to -0.10',
							'-0.10 to -0.06',
							'-0.06 to -0.01',
							'-0.01 to 0.03',
							'0.03 to 0.07',
							'0.07 to 0.11',
							'0.11 to 0.15',
							'0.15 to 0.19',
							'0.19 to 0.23',
							'0.23 to 0.27',
							'0.27 to 0.31',
							'0.31 to 0.35',
							'0.35 to 0.39',
							'0.39 to 0.43',
							'0.43 to 0.47',
							'0.47 to 0.51',
							'0.51 to 0.55',
							'0.55 to 0.59',
							'0.59 to 0.63',
							'0.63 to 0.67',
							'0.67 to 0.71',
							'0.71 to 0.75',
							'0.75 to 0.79',
							'0.79 to 0.83',
							'0.83 to 0.87',
							'0.87 to 0.92',
							'0.92 to 0.96',
							'0.96 to 1.00',
							'1.00 to 1.04',
							'1.04 to 1.08',
							'1.08 to 1.12',
							'1.12 to 1.16',
							'1.16 to 1.20',
							'1.20 to 1.24',
							'1.24 to 1.28',
							'1.28 to 1.32',
							'1.32 to 1.36',
							'1.36 to 1.40',
							'1.40 to 1.44',
							'1.44 to 1.48',
							'1.48 to 1.52',
							'1.52 to 1.56',
							'1.56 to 1.60'
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
									4, 2, 5, 8, 10, 16, 29, 40, 49, 100, 154, 221, 312, 392, 518, 523, 509, 465, 497,
									422, 420, 366, 317, 188, 191, 187, 150, 130, 112, 80, 80, 49, 45, 27, 24, 32, 24,
									16, 9, 9, 10, 3, 1, 5, 4, 5, 1, 1, 3, 0
								],
								color: 'rgba(173, 216, 230, 0.8)',
								zIndex: 1
							},
							{
								name: 'Significant trends',
								data: [
									0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 9, 22, 44, 55, 109, 130, 157, 155, 150,
									95, 106, 109, 105, 95, 81, 60, 68, 46, 43, 26, 24, 32, 24, 16, 9, 9, 10, 3, 1, 5,
									4, 5, 1, 1, 3, 0
								],
								color: 'rgba(255, 99, 71, 0.85)',
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
					spring: [
						{
							id: 'seasonal-overall-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 1,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-overall-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 2,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-overall-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 3,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-overall-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 4,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					spring: [
						{
							id: 'seasonal-significant-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 8,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-significant-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 7,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-significant-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 9,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-significant-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 6,
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
		{
			id: 'map-indicator-1',
			title: 'Annual Temperature Trend',
			dataset_id: 'temp-trend-10y'
		},
		{
			id: 'map-indicator-2',
			title: 'Seasonal Temperature Trend',
			dataset_id: 'seasonal-temp-trend'
		},
		{
			id: 'map-indicator-3',
			title: 'Annual Temperature Anomaly',
			dataset_id: 'annual-temp-anamoly-series'
		}
	];
	// Track selected question - default to first question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection)
	let selectedInformationLayer = $state<string | null>('Annual Temperature Trend');

	// Track radio button selection for trend analysis
	let trendAnalysisMode = $state<'overall' | 'significant'>('overall');

	// Track temperature rise threshold selection
	let temperatureRiseThreshold = $state<'0.5' | '1' | '1.5' | '2' | '2.5'>('1.5');

	// Track seasonal selection for nested radio controls
	let selectedSeason = $state<'spring' | 'summer' | 'autumn' | 'winter'>('spring');

	// Layout states: 'default' | 'hide-left' | 'left-full'
	let layoutState = $state('default');

	// Legend state management
	let legendData = $state<
		Record<
			string,
			{ name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }
		>
	>({});
	let legendCollapsed = $state(false);

	// Track questions panel state
	let isQuestionsPanelOpen = $state(true);
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

			if (!currentDataset || !currentMapLayers) {
				return;
			}

			console.log('Fetching legend data for dataset:', currentDataset.id);

			// Get current layers based on control type
			let layersToFetch: any[] = [];

			if (currentDataset.control_type === 'radio') {
				const selectedLayers = currentMapLayers[trendAnalysisMode];
				layersToFetch = Array.isArray(selectedLayers) ? selectedLayers : [selectedLayers];
			} else if (currentDataset.control_type === 'temperature_threshold') {
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

			// Fetch legend for each layer
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
							// For time slider, use a generic name without the year
							const legendName =
								currentDataset.control_type === 'time_slider' ? 'Temperature Anomaly' : layer.name;

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

					// For time slider, use a generic name without the year
					const legendName =
						currentDataset.control_type === 'time_slider' ? 'Temperature Anomaly' : layer.name;

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
			const selectedLayers = currentMapLayers[trendAnalysisMode];
			console.log('Selected layers for', trendAnalysisMode, ':', selectedLayers);
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
				trendAnalysisMode = dataset.default_option as 'overall' | 'significant';
			} else if (dataset?.control_type === 'temperature_threshold' && dataset.default_option) {
				temperatureRiseThreshold = dataset.default_option as '0.5' | '1' | '1.5' | '2' | '2.5';
			} else if (dataset?.control_type === 'nested_radio' && dataset.default_option) {
				trendAnalysisMode = (dataset.default_option as any).trend_analysis as
					| 'overall'
					| 'significant';
				selectedSeason = (dataset.default_option as any).season as
					| 'spring'
					| 'summer'
					| 'autumn'
					| 'winter';
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
	function selectInformationLayer(layerId: string) {
		// Stop playback if currently playing
		if (isPlaying) {
			stopPlayback();
		}

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
			} else if (dataset?.control_type === 'nested_radio' && dataset.default_option) {
				trendAnalysisMode = (dataset.default_option as any).trend_analysis as
					| 'overall'
					| 'significant';
				selectedSeason = (dataset.default_option as any).season as
					| 'spring'
					| 'summer'
					| 'autumn'
					| 'winter';
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
		<div class="rounded-2xl border border-white/20 bg-white/100 p-6">
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
						: 'text-sm leading-relaxed'} text-slate-700 transition-all duration-300"
				>
					Historically, the climate of the HKH has experienced significant changes that are closely
					related to the rise and fall of regional cultures and civilizations. The region is one of
					the most climate-sensitive mountain systems in the world. Known as the "Third Pole" for
					its vast ice reserves, the HKH plays a critical role in regulating Asia's climate and
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
										class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-2 rounded-full border border-white/30 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl {isFullscreen
											? 'z-[9999]'
											: 'z-10'}"
										title="Show Time Controls"
									>
										<Calendar class="h-4 w-4" />
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
											<Calendar class="h-4 w-4 text-blue-600" />
											<span class="text-sm font-medium text-slate-700">Time</span>
										</div> -->

										<!-- Separator -->
										<!-- <div class="h-4 w-px bg-slate-300"></div> -->

										<!-- Step Backward -->
										<button
											on:click={stepBackward}
											disabled={currentTimeIndex === 0}
											class="rounded-full p-1.5 text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
											title="Previous Year"
										>
											<SkipBack class="h-3.5 w-3.5" />
										</button>

										<!-- Play/Pause -->
										<button
											on:click={togglePlayback}
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
											on:click={stepForward}
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
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-full border border-white/30 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm {isFullscreen
										? 'z-[9999]'
										: 'z-10'}"
								>
									<!-- Analysis Label -->
									<!-- <div class="flex items-center space-x-2">
										<Layers class="h-4 w-4 text-blue-600" />
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
											class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm font-medium text-slate-700">Overall</span>
									</label>

									<!-- Significant Option -->
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											bind:group={trendAnalysisMode}
											value="significant"
											class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm font-medium text-slate-700">Significant</span>
									</label>
								</div>
							{:else if currentDataset && currentDataset.control_type === 'nested_radio'}
								<!-- Always show expanded Nested Radio Controls Panel (Trend Analysis + Seasons) -->
								<div
									class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-6 rounded-full border border-white/30 bg-white/95 px-6 py-1 shadow-xl backdrop-blur-sm {isFullscreen
										? 'z-[9999]'
										: 'z-10'}"
								>
									<!-- Trend Analysis Section -->
									<div class="flex items-center space-x-3">
										<!-- <div class="flex items-center space-x-2">
											<Layers class="h-4 w-4 text-blue-600" />
											<span class="text-sm font-medium text-slate-700">Trend</span>
										</div> -->

										<!-- Overall Option -->
										<label class="flex cursor-pointer items-center space-x-1.5">
											<input
												type="radio"
												bind:group={trendAnalysisMode}
												value="overall"
												class="h-3.5 w-3.5 border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<span class="text-xs font-medium text-slate-700">Overall</span>
										</label>

										<!-- Significant Option -->
										<label class="flex cursor-pointer items-center space-x-1.5">
											<input
												type="radio"
												bind:group={trendAnalysisMode}
												value="significant"
												class="h-3.5 w-3.5 border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<span class="text-xs font-medium text-slate-700">Significant</span>
										</label>
									</div>

									<!-- Separator -->
									<div class="h-5 w-px bg-slate-300"></div>

									<!-- Seasonal Selection Section -->
									<div class="flex items-center space-x-3">
										<!-- <div class="flex items-center space-x-2">
											<Calendar class="h-4 w-4 text-green-600" />
											<span class="text-sm font-medium text-slate-700">Season</span>
										</div> -->

										<!-- Season Options as Toggle Buttons -->
										<div class="flex items-center space-x-0.5 rounded-full bg-slate-100/80 p-1">
											<!-- Spring Option -->
											<label class="relative cursor-pointer">
												<input
													type="radio"
													bind:group={selectedSeason}
													value="spring"
													class="peer sr-only"
												/>
												<div
													class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {selectedSeason ===
													'spring'
														? 'text-white'
														: 'text-slate-600'}"
												>
													Spring
												</div>
											</label>

											<!-- Summer Option -->
											<label class="relative cursor-pointer">
												<input
													type="radio"
													bind:group={selectedSeason}
													value="summer"
													class="peer sr-only"
												/>
												<div
													class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {selectedSeason ===
													'summer'
														? 'text-white'
														: 'text-slate-600'}"
												>
													Summer
												</div>
											</label>

											<!-- Autumn Option -->
											<label class="relative cursor-pointer">
												<input
													type="radio"
													bind:group={selectedSeason}
													value="autumn"
													class="peer sr-only"
												/>
												<div
													class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {selectedSeason ===
													'autumn'
														? 'text-white'
														: 'text-slate-600'}"
												>
													Autumn
												</div>
											</label>

											<!-- Winter Option -->
											<label class="relative cursor-pointer">
												<input
													type="radio"
													bind:group={selectedSeason}
													value="winter"
													class="peer sr-only"
												/>
												<div
													class="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 peer-checked:text-white peer-checked:shadow-sm hover:bg-slate-200/60 peer-checked:hover:from-blue-600 peer-checked:hover:to-cyan-600 {selectedSeason ===
													'winter'
														? 'text-white'
														: 'text-slate-600'}"
												>
													Winter
												</div>
											</label>
										</div>
									</div>
								</div>
							{:else if currentDataset && currentDataset.control_type === 'temperature_threshold'}
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
										on:click={() => (legendCollapsed = !legendCollapsed)}
									>
										<div class="flex items-center space-x-2">
											<List class="h-4 w-4 text-blue-600" />
											{#if !legendCollapsed}
												<span class="font-medium text-slate-700">Legend</span>
											{/if}
										</div>
										<!-- <svg
											class="h-4 w-4 transform text-slate-600 transition-transform duration-300 {legendCollapsed
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
												subtitle="Hindu Kush Himalaya Region Climate Data"
												chart_type={chart.chart_type}
												yAxisTitle={chart.yAxisTitle || 'Value'}
												plotOptions={chart.chart_data.plotOptions || {}}
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
										<button
											on:click={() => selectInformationLayer(layer.title)}
											class="w-full rounded-lg border p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-md {selectedInformationLayer ===
											layer.title
												? 'border-blue-300 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 shadow-md'
												: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80 hover:border-slate-300/70 hover:bg-slate-100/90'}"
										>
											<div class="flex items-start space-x-3 text-left">
												<div class="flex-1">
													<h4
														class="text-sm font-medium {selectedInformationLayer === layer.title
															? 'text-blue-800'
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
		<div
			class="questions-panel mb-4 flex h-80 w-80 origin-bottom-right transform flex-col rounded-2xl border border-white/20 bg-white/95 px-4 py-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
			class:scale-0={!isQuestionsPanelOpen}
			class:scale-100={isQuestionsPanelOpen}
			class:opacity-0={!isQuestionsPanelOpen}
			class:opacity-100={isQuestionsPanelOpen}
			class:pointer-events-none={!isQuestionsPanelOpen}
		>
			<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
				<div class="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
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
