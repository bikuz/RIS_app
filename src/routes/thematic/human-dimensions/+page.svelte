<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import demogr_1 from '$lib/assets/images/Demography_1.png';
	import demogr_2 from '$lib/assets/images/Demography_2.png';
	import { getTopicName, getTopicIcon, getTopicColor } from '$lib/data/themeData.js';
	const topic = 'human-dimensions';
	const TopicIcon = getTopicIcon(topic);
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import ImageLayer from 'ol/layer/Image';
	import OSM from 'ol/source/OSM';
	import XYZ from 'ol/source/XYZ';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import { fromLonLat } from 'ol/proj';
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
		House,
		Cloud,
		Users,
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
		Minimize2,
		Maximize2,
		HelpCircle,
		Play,
		Pause,
		SkipBack,
		SkipForward,
		Calendar,
		List,
		MapIcon
	} from '@lucide/svelte';
	import FullScreen from 'ol/control/FullScreen';
	import ScaleLine from 'ol/control/ScaleLine';
	import { defaults as defaultControls } from 'ol/control/defaults.js';

	// let { currentTopic = 'demography', width = '100%', height = '400px' } = $props();

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates (optimized for full HKH view)
	const HKH_CENTER = [82.94924, 27.6382055]; // Longitude, Latitude - adjusted for better HKH coverage
	const HKH_ZOOM = 4.8; // Reduced zoom to show more of the HKH region

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

	// ArcGIS MapServer configuration
	const ARCGIS_MAPSERVER_URL =
		'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer';

	const BASELAYERS_URL =
		'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer';

	// Time slider state management
	// let isTimeSliderVisible = $state(false);
	// let isPlaying = $state(false);
	// let currentTimeIndex = $state(0);
	// let playbackSpeed = $state(1000); // milliseconds between frames
	// let playInterval: number | null = null;

	// Time periods for climate data (can be customized based on your data)
	// const timePeriods = [
	// 	{ year: 1995, label: '1995', season: 'Annual' },
	// 	{ year: 1996, label: '1996', season: 'Annual' },
	// 	{ year: 1997, label: '1997', season: 'Annual' },
	// 	{ year: 1998, label: '1998', season: 'Annual' },
	// 	{ year: 1999, label: '1999', season: 'Annual' },
	// 	{ year: 2000, label: '2000', season: 'Annual' },
	// 	{ year: 2001, label: '2001', season: 'Annual' },
	// 	{ year: 2002, label: '2002', season: 'Annual' },
	// 	{ year: 2003, label: '2003', season: 'Annual' },
	// 	{ year: 2004, label: '2004', season: 'Annual' },
	// 	{ year: 2005, label: '2005', season: 'Annual' },
	// 	{ year: 2006, label: '2006', season: 'Annual' },
	// 	{ year: 2007, label: '2007', season: 'Annual' },
	// 	{ year: 2008, label: '2008', season: 'Annual' },
	// 	{ year: 2009, label: '2009', season: 'Annual' },
	// 	{ year: 2010, label: '2010', season: 'Annual' },
	// 	{ year: 2011, label: '2011', season: 'Annual' },
	// 	{ year: 2012, label: '2012', season: 'Annual' },
	// 	{ year: 2013, label: '2013', season: 'Annual' },
	// 	{ year: 2014, label: '2014', season: 'Annual' },
	// 	{ year: 2015, label: '2015', season: 'Annual' },
	// 	{ year: 2016, label: '2016', season: 'Annual' },
	// 	{ year: 2017, label: '2017', season: 'Annual' },
	// 	{ year: 2018, label: '2018', season: 'Annual' },
	// 	{ year: 2019, label: '2019', season: 'Annual' },
	// 	{ year: 2020, label: '2020', season: 'Annual' },
	// 	{ year: 2021, label: '2021', season: 'Annual' },
	// 	{ year: 2022, label: '2022', season: 'Annual' },
	// 	{ year: 2023, label: '2023', season: 'Annual' },
	// 	{ year: 2024, label: '2024', season: 'Annual' }
	// ];

	// // Time slider functions
	// function toggleTimeSlider() {
	// 	isTimeSliderVisible = !isTimeSliderVisible;
	// 	if (!isTimeSliderVisible && isPlaying) {
	// 		stopPlayback();
	// 	}
	// }

	// function togglePlayback() {
	// 	if (isPlaying) {
	// 		stopPlayback();
	// 	} else {
	// 		startPlayback();
	// 	}
	// }

	// function startPlayback() {
	// 	if (playInterval) clearInterval(playInterval);

	// 	isPlaying = true;
	// 	playInterval = setInterval(() => {
	// 		if (currentTimeIndex < timePeriods.length - 1) {
	// 			currentTimeIndex++;
	// 			updateMapForTime(currentTimeIndex);
	// 		} else {
	// 			// Loop back to start or stop
	// 			currentTimeIndex = 0;
	// 			updateMapForTime(currentTimeIndex);
	// 			// Uncomment next line to stop at end instead of looping
	// 			// stopPlayback();
	// 		}
	// 	}, playbackSpeed);
	// }

	// function stopPlayback() {
	// 	if (playInterval) {
	// 		clearInterval(playInterval);
	// 		playInterval = null;
	// 	}
	// 	isPlaying = false;
	// }

	// function goToTime(index: number) {
	// 	if (index >= 0 && index < timePeriods.length) {
	// 		currentTimeIndex = index;
	// 		updateMapForTime(index);
	// 	}
	// }

	// function stepBackward() {
	// 	if (currentTimeIndex > 0) {
	// 		goToTime(currentTimeIndex - 1);
	// 	}
	// }

	// function stepForward() {
	// 	if (currentTimeIndex < timePeriods.length - 1) {
	// 		goToTime(currentTimeIndex + 1);
	// 	}
	// }

	// function updateMapForTime(timeIndex: number) {
	// 	// This function would update the map layers based on the selected time
	// 	// You can modify ArcGIS parameters or switch between different temporal layers
	// 	console.log('Updating map for time:', timePeriods[timeIndex]);

	// 	// Example: Update ArcGIS layer with time parameter if needed
	// 	if (map && selectedInformationLayer) {
	// 		const layers = map.getLayers().getArray();
	// 		layers.forEach((layer) => {
	// 			if (layer.get('layerId') !== undefined) {
	// 				const source = (layer as ImageLayer<any>).getSource();
	// 				if (source && source instanceof ImageArcGISRest) {
	// 					// Update ArcGIS parameters with time if your service supports it
	// 					const currentParams = source.getParams();
	// 					source.updateParams({
	// 						...currentParams
	// 						// Add time parameter if your ArcGIS service supports temporal data
	// 						// time: timePeriods[timeIndex].year.toString()
	// 					});
	// 				}
	// 			}
	// 		});
	// 	}
	// }

	// // Function to handle trend analysis mode changes
	// function updateMapForTrendMode(mode: 'overall' | 'significant') {
	// 	console.log('Updating map for trend analysis mode:', mode);
	// 	// Implementation for trend mode changes if needed
	// }

	// // Watch for trend analysis mode changes
	// $effect(() => {
	// 	updateMapForTrendMode(trendAnalysisMode);
	// });

	// // Function to handle temperature rise threshold changes
	// function updateMapForTemperatureRise(threshold: '0.5' | '1.5' | '2.5') {
	// 	console.log('Updating map for temperature rise threshold:', threshold);
	// 	// Implementation for temperature threshold changes if needed
	// }

	// // Watch for temperature rise threshold changes
	// $effect(() => {
	// 	updateMapForTemperatureRise(temperatureRiseThreshold);
	// });

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

			// Add default layer (Population 2025 - Layer 0) when map initializes
			addArcGISLayer(0, 'Population 2025');

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

		// Cleanup resize listener even if ResizeObserver is not available
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Cleanup on destroy
	onDestroy(() => {
		// if (playInterval) {
		// 	clearInterval(playInterval);
		// }
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

	// Updated demographic dataset with ArcGIS layers
	const demographicDataset = [
		{
			id: 'population-2025',
			charts: [
				// {
				// 	title: 'Population Distribution',
				// 	chart_type: 'column',
				// 	chart_data: {
				// 		categories: ['2015', '2020', '2025', '2030'],
				// 		series: [
				// 			{
				// 				name: 'Population (millions)',
				// 				data: [207.357006, 221.147189, 233.29593, 246.467761],
				// 				color: '#5f87c1'
				// 			}
				// 		]
				// 	}
				// }
			],
			map_data: {
				name: 'Population Trends across HKH',
				layer_id: 0,
				description: 'Population density distribution (people/sq km)'
			},
			control_type: 'none'
		},
		{
			id: 'sex-ratio-2025',
			// charts: [
			// 	{
			// 		title: 'Population Distribution',
			// 		chart_type: 'column',
			// 		chart_data: {
			// 			categories: ['2015', '2020', '2025', '2030'],
			// 			series: [
			// 				{
			// 					name: 'Population (millions)',
			// 					data: [207.357006, 221.147189, 233.295930, 246.467761]
			// 				}
			// 			]
			// 		}
			// 	}
			// ],
			map_data: {
				name: 'Sex Ratio 2025',
				layer_id: 1,
				description: 'Sex ratio (males per 100 females) across HKH region for 2025'
			},
			control_type: 'none'
		},
		{
			id: 'aged-75-proportion',
			// charts: [
			// 	{
			// 		title: 'Population Distribution',
			// 		chart_type: 'column',
			// 		chart_data: {
			// 			categories: ['2015', '2020', '2025', '2030'],
			// 			series: [
			// 				{
			// 					name: 'Population (millions)',
			// 					data: [207.357006, 221.147189, 233.295930, 246.467761]
			// 				}
			// 			]
			// 		}
			// 	}
			// ],
			map_data: {
				name: 'Proportion of Age >=75',
				layer_id: 2,
				description: 'Proportion of population aged 75 years and above'
			},
			control_type: 'none'
		},
		{
			id: 'child-woman-ratio-2025',
			// charts: [
			// 	{
			// 		title: 'Population Distribution',
			// 		chart_type: 'column',
			// 		chart_data: {
			// 			categories: ['2015', '2020', '2025', '2030'],
			// 			series: [
			// 				{
			// 					name: 'Population (millions)',
			// 					data: [207.357006, 221.147189, 233.295930, 246.467761]
			// 				}
			// 			]
			// 		}
			// 	}
			// ],
			map_data: {
				name: 'Child Woman Ratio 2025',
				layer_id: 3,
				description: 'Number of children (0-4) per 1000 women (15-49 years)'
			},
			control_type: 'none'
		},
		{
			id: 'child-dependency-ratio-2025',
			// charts: [
			// 	{
			// 		title: 'Population Distribution',
			// 		chart_type: 'column',
			// 		chart_data: {
			// 			categories: ['2015', '2020', '2025', '2030'],
			// 			series: [
			// 				{
			// 					name: 'Population (millions)',
			// 					data: [207.357006, 221.147189, 233.295930, 246.467761]
			// 				}
			// 			]
			// 		}
			// 	}
			// ],
			map_data: {
				name: 'Child Dependency Ratio 2025',
				layer_id: 4,
				description: 'Ratio of children (0-14) to working age population (15-64)'
			},
			control_type: 'none'
		},
		{
			id: 'age-dependency-ratio-2025',
			// charts: [
			// 	{
			// 		title: 'Population Distribution',
			// 		chart_type: 'column',
			// 		chart_data: {
			// 			categories: ['2015', '2020', '2025', '2030'],
			// 			series: [
			// 				{
			// 					name: 'Population (millions)',
			// 					data: [207.357006, 221.147189, 233.295930, 246.467761]
			// 				}
			// 			]
			// 		}
			// 	}
			// ],
			map_data: {
				name: 'Age Dependency Ratio 2025',
				layer_id: 5,
				description: 'Ratio of dependents (0-14 and 65+) to working age population (15-64)'
			},
			control_type: 'none'
		},
		{
			id: 'total-dependency-ratio-2025',
			// charts: [
			// 	{
			// 		title: 'Population Distribution',
			// 		chart_type: 'column',
			// 		chart_data: {
			// 			categories: ['2015', '2020', '2025', '2030'],
			// 			series: [
			// 				{
			// 					name: 'Population (millions)',
			// 					data: [207.357006, 221.147189, 233.295930, 246.467761]
			// 				}
			// 			]
			// 		}
			// 	}
			// ],
			map_data: {
				name: 'Total Dependency Ratio 2025',
				layer_id: 6,
				description: 'Ratio of total dependent population'
			},
			control_type: 'none'
		},
		{
			id: 'impervious_surface',

			map_data: {
				name: 'Impervious Surface',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_HumanDimensions/MapServer',
				layer_id: 0,
				description: 'Impervious Surface'
			},
			control_type: 'none'
		},

		{
			id: 'urban-center',
			// charts: [
			// 	{
			// 		title: 'Population Distribution',
			// 		chart_type: 'column',
			// 		chart_data: {
			// 			categories: ['2015', '2020', '2025', '2030'],
			// 			series: [
			// 				{
			// 					name: 'Population (millions)',
			// 					data: [207.357006, 221.147189, 233.295930, 246.467761]
			// 				}
			// 			]
			// 		}
			// 	}
			// ],
			map_data: {
				name: 'Urban Center Location',
				layer_id: 8,
				description: 'Location of Urban Center'
			},
			control_type: 'none'
		},
		{
			id: 'night-light',
			map_data: {
				name: 'Night Light',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
				layer_id: 7,
				description: 'Night Light Data'
			},
			control_type: 'none'
		}
	];

	// Updated questions
	const questions = [
		{
			id: 'question-1',
			question: 'Show me the locations of urban center in HKH Region.',
			dataset_id: 'urban-center'
		}
	];

	// Updated information layers
	const information_layers = [
		{
			id: 'info-layer-1',
			title: 'Population 2025',
			dataset_id: 'population-2025',
			info: 'The map represents the spatial distribution of population across the HKH region.The dataset is obtained from WorldPop Global Project Population Data, providing population counts per 1km × 1km grid square.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-2',
			title: 'Sex Ratio',
			dataset_id: 'sex-ratio-2025',
			info: 'The map represents the spatial distribution of the sex ratio across HKH region.The ratio is calculated using the formula (Total Male Count / Total Female Count) × 100, with each pixel representing the number of males per 100 females.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-3',
			title: 'Proportion of Population Age >=75',
			dataset_id: 'aged-75-proportion',
			info: 'The map represents spatial distribution of the elderly population as a percentage of the total population across the region.The proportion is calculated using the formula (Population Aged >=75 Years / Total Population of All Ages) × 100.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-4',
			title: 'Child-Woman Ratio',
			dataset_id: 'child-woman-ratio-2025',
			info: 'The map represents spatial distribution of Child-Woman Ratio across HKH region.The ratio is calculated using the formula (Children Aged 0-4 Years / Women Aged 15-49) × 1000 with each pixel representing the number of young children per 1,000 women of childbearing age.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-5',
			title: 'Child-Dependency Ratio',
			dataset_id: 'child-dependency-ratio-2025',
			info: 'The map represents the number of young dependents per 100 working-age individuals in 1 km² area. . The ratio is calculated  using the formula (Population Aged 0-14 Years / Working-Age Population (15-64)) × 100.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-6',
			title: 'Age Dependency Ratio',
			dataset_id: 'age-dependency-ratio-2025',
			info: 'The map represents the number of elderly dependents per 100 working-age individuals in 1 km² area.  .The ratio is calculated using gridded population data with the formula (Population Aged ≥60 Years / Working-Age Population (15-64)) × 100. ',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-7',
			title: 'Total Dependency Ratio',
			dataset_id: 'total-dependency-ratio-2025',
			info: 'The map represents the total number of young and elderly dependents per 100 working-age individuals in 1 km² area. The ratio is calculated using the formula: [(Population Aged 0-14 + Population Aged ≥60) / Working-Age Population (15-64)] × 100. ',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-8',
			title: 'Impervious Surface',
			dataset_id: 'impervious_surface',
			info: 'Impervious Surface',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-9',
			title: 'Night Light',
			dataset_id: 'night-light',
			info: 'Night Light Data',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		}
	];

	// Track selected question - default to first question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection) - default to Population 2025
	let selectedInformationLayer = $state<string | null>('Population 2025');

	// Track expanded layer for accordion - default closed
	let expandedLayer = $state<string | null>(null);

	// Track radio button selection for trend analysis
	let trendAnalysisMode = $state<'overall' | 'significant'>('overall');

	// Track temperature rise threshold selection
	let temperatureRiseThreshold = $state<'0.5' | '1.5' | '2.5'>('1.5');

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
	let activeBaseLayers = $state({});

	// Basemap switcher state
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('dark-gray');
	let baseMapLayer: TileLayer<any> | null = null;

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

		// Update legend after changing layers
		updateLegend();
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
				return demographicDataset.find((item) => item.id === selectedQuestion.dataset_id);
			}
		}

		// Second priority: selected information layer
		if (selectedInformationLayer) {
			const selectedLayer = information_layers.find(
				(layer) => layer.title === selectedInformationLayer
			);
			if (selectedLayer?.dataset_id) {
				return demographicDataset.find((item) => item.id === selectedLayer.dataset_id);
			}
		}

		// Default: first dataset
		return demographicDataset[0];
	});

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

	// Get layer by layer ID from map
	const getLayerByLayerId = (layerId: number): any | null => {
		if (!map) return null;
		const layers = map.getLayers().getArray();
		for (const layer of layers) {
			if (layer.get('layerId') === layerId) {
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

	// Update legend when layers change
	async function updateLegend() {
		const newLegendData = {};

		// Get all layers from the map
		if (map) {
			const layers = map.getLayers().getArray();

			for (const layer of layers) {
				const source = layer.getSource();

				if (source instanceof ImageArcGISRest) {
					// Handle layerId 0 explicitly, without using || that treats 0 as falsy
					let layerId = layer.get('layerId');
					if (layerId === undefined || layerId === null) {
						layerId = layer.get('baseLayerId');
					}

					const serviceUrl = source.getUrl();

					console.log('Found ArcGIS layer - ID:', layerId, 'URL:', serviceUrl);

					if (layerId !== undefined && layerId !== null && serviceUrl) {
						const legendKey = `${serviceUrl}_${layerId}`;

						if (!legendData[legendKey]) {
							console.log('Fetching legend for layer:', layerId);
							const legend = await fetchArcGISLegend(serviceUrl, layerId);
							if (legend) {
								newLegendData[legendKey] = legend;
								console.log('Legend fetched successfully for layer:', layerId);
							} else {
								console.log('No legend data returned for layer:', layerId);
							}
						} else {
							newLegendData[legendKey] = legendData[legendKey];
							console.log('Using cached legend for layer:', layerId);
						}
					}
				}
			}
		}

		legendData = newLegendData;
		console.log('Final legend data:', legendData); // Debug log
	}

	// Modified addArcGISLayer to update legend
	async function addArcGISLayer(layerId: number, layerName: string, url?: string) {
		if (!map) return;
		removeAllDemographicLayers();

		// Use provided url if available, otherwise fall back to global default
		const serviceUrl = url || ARCGIS_MAPSERVER_URL;

		const arcgisLayer = new ImageLayer({
			source: new ImageArcGISRest({
				url: serviceUrl,
				params: {
					LAYERS: `show:${layerId}`,
					FORMAT: 'PNG32',
					TRANSPARENT: true
				}
			}),
			zIndex: 2
		});

		arcgisLayer.set('layerId', layerId);
		arcgisLayer.set('layerName', layerName);
		arcgisLayer.set('serviceUrl', serviceUrl);
		map.addLayer(arcgisLayer);

		console.log('Added layer - ID:', layerId, 'Name:', layerName, 'URL:', serviceUrl); // Debug log

		// Add a small delay to ensure the layer is fully loaded before updating legend
		setTimeout(async () => {
			await updateLegend();
			console.log('Legend update completed'); // Debug log
		}, 100);
	}

	// Remove all demographic layers from map
	function removeAllDemographicLayers() {
		if (!map) return;

		const layers = map.getLayers().getArray();
		const layersToRemove: any[] = [];

		// Find all demographic layers (those with layerId property)
		layers.forEach((layer) => {
			if (layer.get('layerId') !== undefined) {
				layersToRemove.push(layer);
			}
		});

		// Remove all found demographic layers
		layersToRemove.forEach((layer) => {
			map!.removeLayer(layer);
			console.log('Removed layer:', layer.get('layerName'));
		});
	}

	function selectQuestion(questionId: string) {
		selectedQuestionId = questionId;
		selectedInformationLayer = null; // clear info layer selection

		const selectedQuestion = questions.find((q) => q.id === questionId);
		if (selectedQuestion?.dataset_id) {
			const dataset = demographicDataset.find((item) => item.id === selectedQuestion.dataset_id);
			if (dataset?.map_data) {
				addArcGISLayer(
					dataset.map_data.layer_id,
					dataset.map_data.name,
					dataset.map_data.url // only passed if exists
				);
			}
		}

		console.log('Question selected:', questionId);
	}

	// Function to select information layer
	function selectInformationLayer(layerId: string) {
		selectedInformationLayer = layerId;
		selectedQuestionId = ''; // clear question selection

		const selectedLayer = information_layers.find((layer) => layer.title === layerId);
		if (selectedLayer?.dataset_id) {
			const dataset = demographicDataset.find((item) => item.id === selectedLayer.dataset_id);
			if (dataset?.map_data) {
				addArcGISLayer(
					dataset.map_data.layer_id,
					dataset.map_data.name,
					dataset.map_data.url // only passed if exists
				);
			}
		}

		console.log('Information layer selected:', layerId);
	}

	// Function to toggle layer expansion
	function toggleLayerExpansion(layerId: string) {
		if (expandedLayer === layerId) {
			expandedLayer = null;
		} else {
			expandedLayer = layerId;
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
			onclick={() => setLayoutState('default')}
			class="fixed top-[15rem] left-0 z-50 rounded-r-lg border border-l-0 border-slate-300 bg-white/90 p-2 text-slate-600 shadow-xl transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-2xl active:bg-slate-100 lg:p-1.5"
			title="Show Story Panel"
		>
			<ChevronsRight class="h-5 w-5 lg:h-4 lg:w-4" />
		</button>
	{/if}
	<!-- Left Sidebar - Story + Questions -->

	<div
		class="sticky top-6 col-span-12 h-fit max-h-[calc(100vh-8rem)] flex-1 space-y-4 overflow-y-auto lg:col-span-3 lg:max-h-[calc(100vh-12rem)] lg:space-y-6"
		class:hidden={layoutState === 'hide-left'}
		class:lg:col-span-12={layoutState === 'left-full'}
	>
		<!-- Story Section -->
		<div class="rounded-2xl border border-white/20 bg-white/70 p-4 lg:p-6">
			<div class="mb-4 flex items-center justify-between lg:mb-6">
				<div class="flex items-center space-x-2 lg:space-x-3">
					<div class="rounded-lg bg-gradient-to-r {getTopicColor(topic)} p-1.5 lg:p-2">
						<TopicIcon class="h-4 w-4 text-white lg:h-5 lg:w-5" />
					</div>
					<h3
						class="{layoutState === 'left-full'
							? 'text-xl lg:text-2xl'
							: 'text-base lg:text-lg'} font-bold text-slate-800 transition-all duration-300"
					>
						Human Dimensions Status in HKH
					</h3>
				</div>
				<div class="flex items-center space-x-1 lg:space-x-2">
					{#if layoutState !== 'left-full'}
						<!-- Hide Left Panel Button - Show Map -->
						<button
							onclick={() => setLayoutState('hide-left')}
							class="rounded-lg border border-slate-200 bg-white/50 p-2 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 active:bg-slate-100 lg:p-1.5"
							title="Show Map"
						>
							<ChevronsLeft class="h-4 w-4" />
						</button>
						<!-- Expand Story Button - Desktop only -->
						<button
							onclick={() => setLayoutState('left-full')}
							class="hidden rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 lg:block"
							title="Expand Story"
						>
							<ChevronsRight class="h-4 w-4" />
						</button>
					{:else}
						<!-- Back to Default Button -->
						<button
							onclick={() => setLayoutState('default')}
							class="rounded-lg border border-slate-200 bg-white/50 p-2 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 active:bg-slate-100 lg:p-1.5"
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
					The Hindu Kush Himalaya (HKH) region is home to over 270 million people, with demographic
					patterns that reflect diverse cultural, economic, and environmental conditions across
					eight countries. The region exhibits significant variations in population density, age
					structure, and gender ratios that are influenced by factors including altitude,
					accessibility, economic opportunities, and cultural practices.
				</p>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Population distribution in the HKH shows marked disparities, with most people concentrated
					in accessible valleys and lower elevation areas. The demographic profile reveals varying
					dependency ratios across different sub-regions, reflecting differences in fertility rates,
					mortality patterns, and migration trends that have significant implications for social
					services and economic development.
				</p>

				<!-- Images Section - Responsive Layout -->
				<div class="mt-6 {layoutState === 'left-full' ? 'space-y-6' : 'space-y-3'}">
					{#if layoutState === 'left-full'}
						<!-- Full Width Layout -->
						<div class="flex flex-wrap justify-center gap-6">
							<div
								class="w-full overflow-hidden rounded-xl border border-slate-200/50 bg-white/50 shadow-lg sm:w-auto"
							>
								<img
									src={demogr_2}
									alt="HKH demographic diversity"
									class="mx-auto h-80 object-contain"
								/>
							</div>

							<div
								class="w-full overflow-hidden rounded-xl border border-slate-200/50 bg-white/50 shadow-lg sm:w-auto"
							>
								<img src={demogr_1} alt="Population centers" class="mx-auto h-80 object-contain" />
							</div>

							<div class="mt-4 w-full text-center">
								<p class="text-sm leading-relaxed text-slate-700">
									<span class="font-semibold text-slate-800">Mountain communities</span>
								</p>
							</div>
						</div>
					{:else}
						<!-- Default Layout - Stacked Images -->
						<div class="space-y-3">
							<div class="overflow-hidden rounded-lg border border-slate-200/50 bg-white/50">
								<img
									src={demogr_2}
									alt="HKH demographic diversity"
									class="h-50 w-full object-contain"
								/>
								<div class="p-2">
									<p class="text-center text-xs text-slate-600">
										<!-- <span
											><span class="font-semibold">Mountain communities</span>
										</span> -->
									</p>
								</div>
							</div>
							<!-- <div class="overflow-hidden rounded-lg border border-slate-200/50 bg-white/50">
							<img src={climate_2} alt="Population centers" class="h-55 w-full object-contain" />
							<div class="p-2">
								<p class="text-center text-xs text-slate-600">
									<span>
										<span class="font-semibold"> Urban growth in mountain valleys </span>
										showing demographic concentration</span
									>
								</p>
							</div>
						</div> -->
						</div>
					{/if}
				</div>

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					The region’s rural people live in remote and environmentally harsh areas with poor social
					and physical infrastructures and unfavourable market conditions. Traditional subsistence
					smallholder farming and migratory pastoral livelihoods in these mountain regions face
					increasing challenges from the impacts of climate change, human-animal conflicts,
					increased natural disasters, and the degradation of forests and rangelands. In addition,
					poor infrastructure, limited access to water and energy, poor market linkages, and limited
					know-how on the development of marketable products and post-harvest management threaten
					the sustainability of mountain agriculture and traditional rural livelihoods.
				</p>
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
													checked={!!activeBaseLayers[layerInfo.id]}
													onchange={(e) => {
														toggleBaseLayer(layerInfo.id, e.target.checked);
														e.target.blur(); // Removes focus from the checkbox
													}}
													class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
												/>
												<span>{layerInfo.name}</span>
											</label>
										{/each}
									</div>
								</div>
							</div>

							<!-- Legend Panel - Bottom Right -->
							{#if currentDataset && Object.keys(legendData).length > 0}
								<div class="absolute right-2 bottom-2">
									<!-- Legend Toggle Button -->
									<button
										class="mb-2 flex w-full items-center justify-between rounded-lg border border-white/30 bg-white/95 p-2 text-sm shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-2xl"
										onclick={() => (legendCollapsed = !legendCollapsed)}
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
											<div class="max-h-[300px] w-35 space-y-4">
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
						<!-- <h3 class="mb-4 text-lg font-semibold text-slate-700">Demographic Analytics</h3> -->
						<div class="rounded-lg bg-slate-50/50">
							{#if currentCharts && currentCharts.length > 0}
								<div class="space-y-6">
									{#each currentCharts as chart, index}
										<div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
											<Chart
												chartData={chart.chart_data}
												title={chart.title}
												chart_type={chart.chart_type}
											/>
										</div>
									{/each}
								</div>
							{:else}
								<div class="flex h-80 items-center justify-center">
									<div class="text-center text-slate-500">
										<!-- <p class="text-sm">Select a question to view related charts</p> -->
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right part: Information Layer and Questions - Shows first on mobile/tablet -->
				<div class="order-1 w-full flex-shrink-0 lg:order-2 lg:w-75">
					<div
						class="top-6 flex-1 flex-col rounded-2xl border border-white/20 bg-white/70 p-4 lg:min-h-[calc(100vh-16rem)]"
					>
						<!-- Information Layer Header -->
						<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
							<div class="rounded-lg bg-gradient-to-r {getTopicColor(topic)} p-2">
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
														<ChevronUp class="h-4 w-4 text-slate-600" />
													{:else}
														<ChevronDown class="h-4 w-4 text-slate-600" />
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

<!-- Conditionally render floating questions button -->
<div>
	{#if layoutState !== 'left-full'}
		<div class="fixed right-12 bottom-6 z-50 flex flex-col items-end">
			{#if isQuestionsPanelOpen}
				<div
					class="questions-panel mb-4 flex h-80 w-80 origin-bottom-right scale-100 transform flex-col rounded-2xl border border-white/20 bg-white/95 px-4 py-4 opacity-100 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
				>
					<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
						<div class="rounded-lg bg-gradient-to-r {getTopicColor(topic)} p-2">
							<Info class="h-4 w-4 text-white" />
						</div>
						<h3 class="text-lg font-bold text-slate-800">Explore Questions</h3>
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
			{/if}

			<button
				onclick={toggleQuestionsPanel}
				class="custom-shadow flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r {getTopicColor(
					topic
				)} text-white"
				aria-label="Toggle questions panel"
			>
				<HelpCircle class="h-6 w-6" />
			</button>
		</div>
	{/if}
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
	/* .compact-slider {
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
	} */

	/* .scrollbar-hide {
		scrollbar-width: none; 
		-ms-overflow-style: none; 
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none; 
	} */

	.custom-shadow {
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); /* bigger shadow for Questions Button */
		transition:
			box-shadow 0.3s ease,
			transform 0.3s ease;
	}

	.custom-shadow:hover {
		/* box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);  */
		transform: scale(1.1);
	}
</style>
