<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import ImageLayer from 'ol/layer/Image';
	import XYZ from 'ol/source/XYZ';
	import ImageArcGISRest from 'ol/source/ImageArcGISRest';
	import { fitMapToHkhOutline, HKH_OUTLINE_CENTER } from '$lib/map/hkh-extent';
	import 'ol/ol.css';
	import Chart from '$lib/components/Chart.svelte';
	import lightMap from '$lib/assets/images/basemaps/light-map.png';
	import darkMap from '$lib/assets/images/basemaps/dark-map.png';
	import osmMap from '$lib/assets/images/basemaps/osm-map.png';
	import satelliteMap from '$lib/assets/images/basemaps/satellite-map.png';
	import terrainMap from '$lib/assets/images/basemaps/terrain-map.png';
	import { House, CheckCircle, Layers, Info, HelpCircle, MapIcon, SlidersHorizontal } from '@lucide/svelte';
	import AccordionLayer from '$lib/components/AccordionLayer.svelte';
	import ThemeInfoButton from '$lib/components/ThemeInfoButton.svelte';
	import FullScreen from 'ol/control/FullScreen';
	import { defaults as defaultControls } from 'ol/control/defaults.js';

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Track fullscreen state
	let isFullscreen = $state(false);
	let fullscreenHandler: (() => void) | null = null;

	// ArcGIS MapServer configuration (default service for most demographic layers)
	const ARCGIS_MAPSERVER_URL =
		'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer';

	// Track questions panel state
	let isQuestionsPanelOpen = $state(false);
	function toggleQuestionsPanel() {
		isQuestionsPanelOpen = !isQuestionsPanelOpen;
	}

	// Base layer visibility (Outline overlay, controlled programmatically)
	let activeBaseLayers = $state<Record<number, boolean>>({});

	// Basemap switcher state
	let basemapPanelOpen = $state(false);
	let selectedBasemap = $state('light');
	let baseMapLayer: TileLayer<any> | null = null;

	const basemaps = [
		{
			id: 'light',
			name: 'Light',
			url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?key=cb1_2a03_1_fbf9a31c72de9a2979799ebc',
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

	// Define base layers from HKH/Outline service
	const baseLayers = [
		{
			id: 0,
			name: 'Outline',
			url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer'
		}
	];

	async function toggleBaseLayer(layerId: number, checked: boolean) {
		if (!map) return;
		activeBaseLayers = { ...activeBaseLayers, [layerId]: checked };

		if (checked) {
			const layerInfo = baseLayers.find((l) => l.id === layerId);
			if (!layerInfo) return;

			// HKH Outline always sits above every demographic data layer (zIndex 10) and the basemap (zIndex 0)
			const layer = new ImageLayer({
				source: new ImageArcGISRest({
					url: layerInfo.url,
					params: {
						LAYERS: `show:${layerId}`,
						FORMAT: 'PNG32',
						TRANSPARENT: true
					}
				}),
				zIndex: 20,
				opacity: 0.7
			});
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

		fetchLegendData();
	}

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

	// Legend state
	let legendData = $state<
		Record<string, { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }>
	>({});

	// Legend for every information layer's default state, prefetched on mount so
	// the sidebar doesn't have to wait on a network round-trip when a layer is clicked.
	let layerLegends = $state<
		Record<
			string,
			Record<string, { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> }>
		>
	>({});

	// Updated demographic dataset with ArcGIS layers
	const demographicDataset = [
		{
			id: 'population-2025',
			charts: [
				{
					title: 'Population Distribution by Age and Sex in HKH Region',
					chart_type: 'bar',
					isPyramid: true,
					chart_data: {
						categories: [
							'0-1','1-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44',
							'45-49','50-54','55-59','60-64','65-69','70-74','75-79','80-84','85-89','90+'
						],
						series: [
							{
								name: 'Male',
								data: [
									-2583174, -10166841, -12606734, -12474449, -11504715, -10547001, -9653669,
									-8535552, -7724644, -6844482, -5837920, -5349179, -4440363, -3354569, -2507988,
									-1866760, -1144430, -566243, -228994, -98160
								],
								color: '#3b82f6'
							},
							{
								name: 'Female',
								data: [
									2441938, 9597426, 11860202, 11694790, 10997892, 10224739, 9384308, 8234182,
									7578636, 6765130, 5765991, 5317287, 4448304, 3438076, 2685983, 2179466, 1411112,
									749921, 334153, 169997
								],
								color: '#ef4444'
							}
						]
					}
				},
				{
					title: 'Country-wise Population Distribution by Gender in HKH Region',
					chart_type: 'column',
					isStacked: true,
					yAxisTitle: 'Population',
					chart_data: {
						categories: ['Afghanistan','Pakistan','India','Nepal','China','Bhutan','Bangladesh','Myanmar'],
						series: [
							{
								name: 'Female',
								data: [17426901, 29178527, 26459146, 15503037, 17119987, 379148, 2568065, 6644774],
								color: '#ef4444'
							},
							{
								name: 'Male',
								data: [17805582, 29894140, 28146092, 14208531, 17911710, 433608, 2645816, 6990423],
								color: '#3b82f6'
							}
						]
					}
				}
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
			map_data: {
				name: 'Sex Ratio 2025',
				layer_id: 1,
				description: 'Sex ratio (males per 100 females) across HKH region for 2025'
			},
			charts: [
				{
					title: 'Country-wise Sex Ratio in HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Ratio',
					chart_data: {
						categories: ['Afghanistan','Pakistan','India','Nepal','China','Bhutan','Bangladesh','Myanmar'],
						series: [
							{
								name: 'Ratio',
								data: [102.17, 102.45, 106.38, 91.65, 104.62, 114.36, 103.03, 105.2],
								color: '#5F87C1',
								zIndex: 1
							}
						]
					}
				}
			],
			control_type: 'none'
		},
		{
			id: 'aged-75-proportion',
			map_data: {
				name: 'Proportion of Age >=75',
				layer_id: 2,
				description: 'Proportion of population aged 75 years and above'
			},
			charts: [
				{
					title: 'Country-wise Proportion of Population Aged 75 years and Above in HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Ratio',
					chart_data: {
						categories: ['Afghanistan','Pakistan','India','Nepal','China','Bhutan','Bangladesh','Myanmar'],
						series: [
							{
								name: 'Ratio',
								data: [0.69, 1.12, 2.46, 2.12, 4.26, 2.2, 1.65, 1.67],
								color: '#5F87C1',
								zIndex: 1
							}
						]
					}
				}
			],
			control_type: 'none'
		},
		{
			id: 'child-woman-ratio-2025',
			map_data: {
				name: 'Child Woman Ratio 2025',
				layer_id: 3,
				description: 'Number of children (0-4) per 1000 women (15-49 years)'
			},
			charts: [
				{
					title: 'Country-wise Child-Woman Ratio in HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Ratio',
					chart_data: {
						categories: ['Afghanistan','Pakistan','India','Nepal','China','Bhutan','Bangladesh','Myanmar'],
						series: [
							{
								name: 'Ratio',
								data: [659.15, 609.51, 306.28, 319.88, 187.24, 222.26, 445.12, 362.09],
								color: '#5F87C1',
								zIndex: 1
							}
						]
					}
				}
			],
			control_type: 'none'
		},
		{
			id: 'child-dependency-ratio-2025',
			map_data: {
				name: 'Child Dependency Ratio 2025',
				layer_id: 4,
				description: 'Ratio of children (0-14) to working age population (15-64)'
			},
			charts: [
				{
					title: 'Country-wise Child Dependency Ratio in HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Ratio',
					chart_data: {
						categories: ['Afghanistan','Pakistan','India','Nepal','China','Bhutan','Bangladesh','Myanmar'],
						series: [
							{
								name: 'Ratio',
								data: [80.04, 76.93, 38.19, 45.49, 29.25, 29.74, 56.24, 43.12],
								color: '#5F87C1',
								zIndex: 1
							}
						]
					}
				}
			],
			control_type: 'none'
		},
		{
			id: 'age-dependency-ratio-2025',
			map_data: {
				name: 'Age Dependency Ratio 2025',
				layer_id: 5,
				description: 'Ratio of dependents (0-14 and 65+) to working age population (15-64)'
			},
			charts: [
				{
					title: 'Country-wise Aged Dependency Ratio in HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Ratio',
					chart_data: {
						categories: ['Afghanistan','Pakistan','India','Nepal','China','Bhutan','Bangladesh','Myanmar'],
						series: [
							{
								name: 'Ratio',
								data: [4.52, 7.11, 10.42, 10.57, 17.79, 9.47, 8.38, 9.97],
								color: '#5F87C1',
								zIndex: 1
							}
						]
					}
				}
			],
			control_type: 'none'
		},
		{
			id: 'total-dependency-ratio-2025',
			map_data: {
				name: 'Total Dependency Ratio 2025',
				layer_id: 6,
				description: 'Ratio of total dependent population'
			},
			charts: [
				{
					title: 'Country-wise Total Dependency Ratio in HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Ratio',
					chart_data: {
						categories: ['Afghanistan','Pakistan','India','Nepal','China','Bhutan','Bangladesh','Myanmar'],
						series: [
							{
								name: 'Ratio',
								data: [84.56, 84.04, 48.61, 56.06, 47.04, 39.21, 64.62, 53.08],
								color: '#5F87C1',
								zIndex: 1
							}
						]
					}
				}
			],
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
			charts: [
				{
					title: 'Impervious Surface Distribution in HKH Region',
					chart_type: 'column',
					yAxisTitle: 'Area (Sq Km)',
					showLegend: false,
					units: 'Sq Km',
					chart_data: {
						categories: ['Upto 1990', '1990-2000', '2000-2010', '2010-2020'],
						series: [
							{
								name: 'Area',
								data: [
									{ y: 3785, color: '#147218' },
									{ y: 1227, color: '#A4CF22' },
									{ y: 2648, color: '#FDC820' },
									{ y: 2644, color: '#FE3C19' }
								],
								zIndex: 1
							}
						]
					}
				}
			],
			control_type: 'none'
		},
		{
			id: 'urban-center',
			map_data: {
				name: 'Urban Center Location',
				layer_id: 8,
				description: 'Location of Urban Center'
			},
			charts: [
				{
					title: 'Population Distribution by Age and Sex',
					chart_type: 'bar',
					isPyramid: true,
					chart_data: {
						categories: [
							'0-1','1-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44',
							'45-49','50-54','55-59','60-64','65-69','70-74','75-79','80-84','85-89','90+'
						],
						series: [
							{
								name: 'Male',
								data: [
									-2583174.5, -10166841, -12606734, -12474449, -11504715, -10547001, -9653669,
									-8535552, -7724644.5, -6844482, -5837920.5, -5349179, -4440363.5, -3354569.25,
									-2507988.5, -1866760.625, -1144430.125, -566243.625, -228994.9531, -98160.13281
								],
								color: '#3b82f6'
							},
							{
								name: 'Female',
								data: [
									2441938.25, 9597426, 11860202, 11694790, 10997892, 10224739, 9384308, 8234182.5,
									7578636, 6765130.5, 5765991, 5317287, 4448304.5, 3438076.75, 2685983.5,
									2179466.25, 1411112.125, 749921.0625, 334153.0625, 169997.7031
								],
								color: '#ef4444'
							}
						]
					}
				}
			],
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
			charts: [],
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
			title: 'Population',
			dataset_id: 'population-2025',
			info: 'The map represents the spatial distribution of the 2025 population across the HKH region.The dataset is obtained from WorldPop Global Project Population Data, providing population counts per 1km × 1km grid square.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-2',
			title: 'Sex Ratio',
			dataset_id: 'sex-ratio-2025',
			info: 'The map represents the spatial distribution of the sex ratio across HKH region based on the 2025 population data.The ratio is calculated using the formula (Total Male Count / Total Female Count) × 100, with each pixel representing the number of males per 100 females.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-3',
			title: 'Proportion of Population Aged >=75 Years',
			dataset_id: 'aged-75-proportion',
			info: 'The map represents spatial distribution of the elderly population as a percentage of the total population across the region based on 2025 population data.The proportion is calculated using the formula (Population Aged >=75 Years / Total Population of All Ages) × 100.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-4',
			title: 'Child-Woman Ratio',
			dataset_id: 'child-woman-ratio-2025',
			info: 'The map represents spatial distribution of Child-Woman Ratio across HKH region based on the 2025 population data.The ratio is calculated using the formula [Children Aged (0-4) Years / Women Aged (15-49)] × 1000 with each pixel representing the number of young children per 1,000 women of childbearing age.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-5',
			title: 'Child Dependency Ratio',
			dataset_id: 'child-dependency-ratio-2025',
			info: 'The map represents the number of young dependents per 100 working-age individuals. The ratio is calculated  using the formula [Population Aged (0-14) Years / Working-Age Population (15-64)] × 100, and is based on population data for the year 2025.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-6',
			title: 'Aged Dependency Ratio',
			dataset_id: 'age-dependency-ratio-2025',
			info: 'The map represents the number of elderly dependents per 100 working-age individuals.  .The ratio is calculated using formula [Population Aged ≥65 Years / Working-Age Population (15-64)] × 100 and is based on population data for the year 2025.',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-7',
			title: 'Total Dependency Ratio',
			dataset_id: 'total-dependency-ratio-2025',
			info: 'The map represents the total number of young and elderly dependents per 100 working-age individuals. The ratio is calculated using the formula: [(Population Aged (0-14) + Population Aged ≥65) / Working-Age Population (15-64)] × 100. ',
			source: 'WorldPop Global Population Data 2015-2030 (https://www.worldpop.org)'
		},
		{
			id: 'info-layer-8',
			title: 'Impervious Surface',
			dataset_id: 'impervious_surface',
			info: 'The dataset provides comprehensive insights into impervious-surface dynamics leveraging time-series Landsat imagery on the Google Earth Engine cloud computing platform created through an innovative and automated methodology that capitalizes on the strengths of spectral-generalization and automatic-sample-extraction strategies.',
			source: 'Global 30m Impervious-Surface Dynamic Dataset (https://gee-community-catalog.org/projects/gisd30)'
		},
		{
			id: 'info-layer-9',
			title: 'Night Light',
			dataset_id: 'night-light',
			info: 'The map shows the night light dataset indicating urbanization in the HKH region from 2015 to 2025. The map has been prepared from VIIRS Stray Light Corrected Nighttime Day/Night Band Composites data product with average radiance dataset for Janaury in 2015, 2020 and 2025 used to create a composite image.',
			source:
				'https://developers.google.com/earth-engine/datasets/catalog/NOAA_VIIRS_DNB_MONTHLY_V1_VCMSLCFG'
		}
	];

	// Track selected question
	let selectedQuestionId = $state('');

	// Track selected information layer (single selection) - default to Population
	let selectedInformationLayer = $state<string | null>('Population');

	// Track expanded layer for accordion - default closed
	let expandedLayer = $state<string | null>(null);

	// Get current dataset based on selected question or information layer
	let currentDataset = $derived.by(() => {
		if (selectedQuestionId) {
			const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
			if (selectedQuestion?.dataset_id) {
				return demographicDataset.find((item) => item.id === selectedQuestion.dataset_id);
			}
		}

		if (selectedInformationLayer) {
			const selectedLayer = information_layers.find(
				(layer) => layer.title === selectedInformationLayer
			);
			if (selectedLayer?.dataset_id) {
				return demographicDataset.find((item) => item.id === selectedLayer.dataset_id);
			}
		}

		return demographicDataset[0];
	});

	// Extract current data from dataset
	let currentCharts = $derived(currentDataset?.charts || []);

	// Resolve the single ArcGIS layer reference for a dataset's map_data
	function resolveLayerForDataset(dataset: any): { url: string; layerId: number; name: string } | null {
		if (!dataset || !dataset.map_data) return null;
		return {
			url: dataset.map_data.url || ARCGIS_MAPSERVER_URL,
			layerId: dataset.map_data.layer_id,
			name: dataset.map_data.name
		};
	}

	// Fetch a legend entry for one ArcGIS layer reference
	async function fetchLegendEntryForLayer(
		layerRef: { url: string; layerId: number; name: string } | null
	): Promise<{ key: string; entry: { name: string; items: Array<{ label: string; imageData?: string; imageUrl?: string }> } } | null> {
		if (!layerRef) return null;

		const uniqueKey = `${layerRef.url}_${layerRef.layerId}`;
		try {
			const legendUrl = `${layerRef.url}/legend?f=json`;
			const response = await fetch(legendUrl);
			const data = await response.json();
			const layerLegend = data.layers?.find((l: any) => l.layerId === layerRef.layerId);
			if (layerLegend) {
				return {
					key: uniqueKey,
					entry: {
						name: layerRef.name,
						items: layerLegend.legend.map((item: any) => ({
							label: item.label,
							imageData: `data:image/png;base64,${item.imageData}`
						}))
					}
				};
			}
		} catch (error) {
			console.error('Error fetching ArcGIS legend:', error);
		}
		return null;
	}

	// Prefetch the default legend for every information layer on mount, so the
	// sidebar can show a legend instantly instead of waiting on a fetch per click.
	async function prefetchAllLegends() {
		const results = await Promise.all(
			information_layers.map(async (infoLayer) => {
				const dataset = demographicDataset.find((d) => d.id === infoLayer.dataset_id);
				if (!dataset) return null;

				const layerRef = resolveLayerForDataset(dataset);
				const result = await fetchLegendEntryForLayer(layerRef);
				if (!result) return null;

				return { title: infoLayer.title, legendMap: { [result.key]: result.entry } };
			})
		);

		const combined: typeof layerLegends = {};
		for (const result of results) {
			if (result) combined[result.title] = result.legendMap;
		}
		layerLegends = combined;
	}

	let legendFetchTimeout: ReturnType<typeof setTimeout> | null = null;

	async function fetchLegendData() {
		if (legendFetchTimeout) clearTimeout(legendFetchTimeout);

		// Clear immediately (not inside the debounce) so a stale legend from the
		// previously selected layer never flashes under the newly selected one —
		// the sidebar falls back to that layer's prefetched legend instead.
		legendData = {};

		legendFetchTimeout = setTimeout(async () => {
			if (currentDataset) {
				const layerRef = resolveLayerForDataset(currentDataset);
				const result = await fetchLegendEntryForLayer(layerRef);
				if (result) legendData[result.key] = result.entry;
			}
		}, 300);
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
			zIndex: 10
		});

		arcgisLayer.set('layerId', layerId);
		arcgisLayer.set('layerName', layerName);
		arcgisLayer.set('serviceUrl', serviceUrl);
		map.addLayer(arcgisLayer);

		fetchLegendData();
	}

	// Remove all demographic layers from map
	function removeAllDemographicLayers() {
		if (!map) return;

		const layers = map.getLayers().getArray();
		const layersToRemove: any[] = [];

		layers.forEach((layer) => {
			if (layer.get('layerId') !== undefined) {
				layersToRemove.push(layer);
			}
		});

		layersToRemove.forEach((layer) => {
			map!.removeLayer(layer);
		});
	}

	function selectQuestion(questionId: string) {
		selectedQuestionId = questionId;
		selectedInformationLayer = null;

		const selectedQuestion = questions.find((q) => q.id === questionId);
		if (selectedQuestion?.dataset_id) {
			const dataset = demographicDataset.find((item) => item.id === selectedQuestion.dataset_id);
			if (dataset?.map_data) {
				addArcGISLayer(dataset.map_data.layer_id, dataset.map_data.name, dataset.map_data.url);
			}
		}
	}

	function selectInformationLayer(layerId: string) {
		selectedInformationLayer = layerId;
		selectedQuestionId = '';

		const selectedLayer = information_layers.find((layer) => layer.title === layerId);
		if (selectedLayer?.dataset_id) {
			const dataset = demographicDataset.find((item) => item.id === selectedLayer.dataset_id);
			if (dataset?.map_data) {
				addArcGISLayer(dataset.map_data.layer_id, dataset.map_data.name, dataset.map_data.url);
			}
		}
	}

	function toggleLayerExpansion(layerId: string) {
		if (expandedLayer === layerId) {
			expandedLayer = null;
		} else {
			expandedLayer = layerId;
		}
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

			// Add default layer (Population 2025) when map initializes
			addArcGISLayer(0, 'Population 2025');

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
				// Always show the HKH Outline, layered above everything else
				toggleBaseLayer(0, true);
			}
		}, 100);
	}

	onMount(() => {
		initializeMap();

		// Warm the sidebar's legend cache for every layer right away, instead of
		// waiting on a fetch each time a layer is clicked.
		prefetchAllLegends();

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
		if (legendFetchTimeout) {
			clearTimeout(legendFetchTimeout);
		}

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
</script>

<svelte:head>
	<title>Human Dimensions | ICIMOD RIS</title>
</svelte:head>

<div
	class="theme-heading sticky z-[53] flex items-start justify-between gap-4 bg-[#F1F5F9] pb-2"
	style="top: var(--app-header-height, 6rem)"
>
	<div class="max-w-2xl">
		<h1 class="text-[20px] font-semibold tracking-[-0.045em] text-[#0F3557] sm:text-[22px]">Human Dimensions</h1>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-[#64788B]">
			Understanding people and patterns in Hindu Kush Himalaya Region
		</p>
	</div>
	<ThemeInfoButton
		src="https://storymaps.arcgis.com/stories/8037fc07d0ea45a891c94ebef9eeaa0a"
		label="About human dimensions in the HKH"
	/>
</div>

<div class="mt-6 grid gap-4 lg:grid-cols-[0.7fr_1.7fr_0.7fr] lg:items-stretch">
	<!-- Left: Information layers -->
	<aside class="context-panel p-5" style="background-color: #EEF6FB">
		<div class="flex items-center justify-between border-b border-[#E0E7EE] pb-4">
			<div>
				<p class="chart-kicker">Layers</p>
				<h2 class="mt-1 text-base font-semibold text-[#17324D]">Information layer</h2>
			</div>
			<span class="grid size-8 place-items-center rounded-lg bg-[#E8EEF4]">
				<SlidersHorizontal class="size-4 text-[#64788B]" />
			</span>
		</div>
		<div class="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
			{#if information_layers && information_layers.length > 0}
				{#each information_layers as layer, index}
					<AccordionLayer
						title={layer.title}
						active={selectedInformationLayer === layer.title}
						open={expandedLayer === layer.title}
						onclick={() => {
							selectInformationLayer(layer.title);
							toggleLayerExpansion(layer.title);
						}}
					>
						{@const activeLegend =
							selectedInformationLayer === layer.title && Object.keys(legendData).length > 0
								? legendData
								: layerLegends[layer.title]}
						{#if activeLegend && Object.keys(activeLegend).length > 0}
							<div class="space-y-2">
								{#each Object.keys(activeLegend) as uniqueKey}
									<div class="space-y-1.5">
										{#if Object.keys(activeLegend).length > 1}
											<p class="text-[10px] font-bold uppercase tracking-wide text-[#8A9BAD]">
												{activeLegend[uniqueKey].name}
											</p>
										{/if}
										{#each activeLegend[uniqueKey].items as item}
											<div class="flex items-center gap-2 text-[11px] text-[#46637A]">
												{#if item.imageData}
													<img src={item.imageData} alt={item.label} class="h-3.5 w-4 shrink-0" />
												{:else if item.imageUrl}
													<img src={item.imageUrl} alt={item.label} class="h-3.5 w-4 shrink-0" />
												{/if}
												<span>{item.label}</span>
											</div>
										{/each}
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-[11px] text-[#8A9BAD]">Loading legend…</p>
						{/if}
					</AccordionLayer>
				{/each}
			{:else}
				<div class="flex h-40 flex-col items-center justify-center text-center text-[#8A9BAD]">
					<Layers class="mx-auto mb-2 size-6" />
					<p class="text-sm">No indicators available</p>
				</div>
			{/if}
		</div>
	</aside>

	<!-- Middle: Map -->
	<div class="relative h-[60vh] min-h-[450px] lg:h-[68vh] lg:max-h-[850px] lg:min-h-[550px]">
		<div class="map-frame h-full">
			<div class="map-container relative flex h-full flex-col">
				<div bind:this={mapContainer} class="map-element h-full w-full overflow-hidden rounded-[10px]"></div>

				<!-- Home Reset Button -->
				<button
					class="map-btn absolute top-3 left-[52px] z-20"
					onclick={() => fitMapToHkhOutline(map, 300)}
					title="Reset to Home View"
				>
					<House class="size-4" />
				</button>

				<!-- Basemap Switcher Button -->
				<button
					class="map-btn absolute top-3 right-[52px] z-20"
					onclick={() => (basemapPanelOpen = !basemapPanelOpen)}
					title="Change Basemap"
					aria-label="Change Basemap"
				>
					<MapIcon class="size-4" />
				</button>

				<!-- Basemap Switcher Panel -->
				<div
					class="absolute top-14 right-[52px] z-20 w-48 overflow-hidden rounded-xl border border-[#D8E1EA] bg-white shadow-lg transition-all duration-300 ease-in-out {basemapPanelOpen
						? 'max-h-96 opacity-100'
						: 'max-h-0 opacity-0'}"
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
			</div>
		</div>
	</div>

	<!-- Right: Description panel -->
	<aside class="context-panel min-w-0">
		{#if selectedInformationLayer}
			{@const activeLayer = information_layers.find((l) => l.title === selectedInformationLayer)}
			{#if activeLayer}
				<h2 class="text-xl font-semibold tracking-[-0.03em] text-[#17324D]">{activeLayer.title}</h2>
				<p class="mt-4 text-sm leading-6 text-[#71869A]">{activeLayer.info}</p>
				<p class="mt-4 break-all text-sm leading-6 text-[#71869A]">
					<span class="font-semibold text-[#46637A]">Data Source: </span>{activeLayer.source}
				</p>
			{/if}
		{:else}
			<p class="text-sm leading-6 text-[#71869A]">Select a layer to see its description.</p>
		{/if}
	</aside>
</div>

<!-- Chart Section -->
{#if currentCharts && currentCharts.length > 0}
	<div
		class="mt-6 grid gap-4 {currentCharts.length === 1
			? ''
			: currentCharts.length === 2
				? 'sm:grid-cols-2'
				: 'sm:grid-cols-2 xl:grid-cols-3'}"
	>
		{#each currentCharts as chart, index}
			<div class="data-card">
				<Chart
					chartData={chart.chart_data}
					title={chart.title}
					subtitle={'subtitle' in chart ? (chart as any).subtitle : ''}
					chart_type={chart.chart_type}
					isPyramid={'isPyramid' in chart ? (chart as any).isPyramid : false}
					isStacked={'isStacked' in chart ? (chart as any).isStacked : false}
					yAxisTitle={'yAxisTitle' in chart ? (chart as any).yAxisTitle : 'Value'}
					showLegend={'showLegend' in chart ? (chart as any).showLegend : true}
					unit={'units' in chart ? (chart as any).units : ''}
					plotOptions={'plotOptions' in chart ? (chart as any).plotOptions : {}}
					height={currentCharts.some((c) => 'isPyramid' in c && (c as { isPyramid?: boolean }).isPyramid)
						? 520
						: 260}
				/>
			</div>
		{/each}
	</div>
{/if}

<!-- Fixed Floating Questions Button and Panel -->
<div class="fixed right-8 bottom-6 z-50 flex flex-col items-end">
	{#if isQuestionsPanelOpen}
		<div
			class="mb-4 flex h-80 w-80 origin-bottom-right flex-col rounded-2xl border border-[#D8E1EA] bg-white/95 px-4 py-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out"
		>
			<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
				<div class="rounded-lg bg-[#2563EB] p-2">
					<Info class="h-3.5 w-3.5 text-white" />
				</div>
				<h3 class="text-base font-bold text-[#17324D]">Explore Questions</h3>
			</div>

			<div class="max-h-60 flex-1 space-y-3 overflow-y-auto">
				{#each questions as questionItem, index}
					<button
						class="group w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 {selectedQuestionId ===
						questionItem.id
							? 'border-[#2563EB] bg-[#DBEAFE] shadow-md'
							: 'border-[#D8E1EA] bg-white/50 hover:border-[#93C5FD] hover:bg-[#EEF6FB] hover:shadow-sm'}"
						onclick={() => selectQuestion(questionItem.id)}
					>
						<div class="flex items-start space-x-2">
							<div class="mt-1 flex-shrink-0">
								{#if selectedQuestionId === questionItem.id}
									<CheckCircle class="h-3.5 w-3.5 text-[#2563EB]" />
								{:else}
									<div class="h-3.5 w-3.5 rounded-full border-2 border-[#D8E1EA] group-hover:border-[#93C5FD]"></div>
								{/if}
							</div>
							<p
								class="text-xs leading-relaxed {selectedQuestionId === questionItem.id
									? 'font-medium text-[#174D7C]'
									: 'text-[#64788B] group-hover:text-[#31506A]'}"
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
		class="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F3557] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#174D7C] hover:shadow-2xl"
		aria-label="Toggle questions panel"
	>
		<HelpCircle class="h-6 w-6" />
	</button>
</div>

<style>
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

	:global(.flex > *) {
		min-width: 0;
	}

	:global(.ol-attribution) {
		right: auto !important;
		left: 0.5em !important;
		text-align: left !important;
		flex-flow: row !important;
	}

	:global(:fullscreen .map-container),
	:global(:-webkit-full-screen .map-container),
	:global(:-moz-full-screen .map-container),
	:global(:-ms-fullscreen .map-container) {
		position: relative !important;
		width: 100vw !important;
		height: 100vh !important;
		z-index: 9998 !important;
	}

	:global(:fullscreen .absolute),
	:global(:-webkit-full-screen .absolute),
	:global(:-moz-full-screen .absolute),
	:global(:-ms-fullscreen .absolute) {
		position: fixed !important;
		z-index: 9999 !important;
	}
</style>
