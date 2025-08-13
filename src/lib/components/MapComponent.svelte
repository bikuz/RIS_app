<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import { fromLonLat } from 'ol/proj';
	import 'ol/ol.css';

	export let currentTopic: string = '';
	export let width: string = '100%';
	export let height: string = '400px';

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;

	// Hindu Kush Himalaya region coordinates (approximate center)
	const HKH_CENTER = [75.0, 30.0]; // Longitude, Latitude
	const HKH_ZOOM = 6;

	// Topic-specific map configurations
	const topicMapConfigs = {
		climate: {
			center: [85.0, 28.0], // Nepal/Tibet region
			zoom: 7,
			description: 'Climate patterns across the Hindu Kush Himalaya'
		},
		demography: {
			center: [77.0, 32.0], // Northern India/Pakistan region
			zoom: 6,
			description: 'Population distribution in mountain communities'
		},
		ecosystem: {
			center: [75.0, 35.0], // Kashmir/Afghanistan region
			zoom: 6,
			description: 'Biodiversity and ecosystem zones'
		},
		cryosphere: {
			center: [86.0, 28.0], // Everest region
			zoom: 7,
			description: 'Glaciers and snow cover analysis'
		},
		weather: {
			center: [80.0, 30.0], // Central Himalaya
			zoom: 6,
			description: 'Weather patterns and meteorological data'
		},
		physiography: {
			center: [78.0, 32.0], // Mountain ranges
			zoom: 5,
			description: 'Topography and geological features'
		},
		'air-quality': {
			center: [77.0, 28.0], // Delhi/NCR region
			zoom: 6,
			description: 'Air quality monitoring across the region'
		}
	};

	function initializeMap() {
		if (!mapContainer) return;

		// Small delay to ensure container has proper dimensions
		setTimeout(() => {
			const config = topicMapConfigs[currentTopic as keyof typeof topicMapConfigs] || {
				center: HKH_CENTER,
				zoom: HKH_ZOOM,
				description: 'Hindu Kush Himalaya region'
			};

			map = new Map({
				target: mapContainer,
				layers: [
					new TileLayer({
						source: new OSM()
					})
				],
				view: new View({
					center: fromLonLat(config.center),
					zoom: config.zoom
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

	function updateMapView() {
		if (!map) return;

		const config = topicMapConfigs[currentTopic as keyof typeof topicMapConfigs] || {
			center: HKH_CENTER,
			zoom: HKH_ZOOM,
			description: 'Hindu Kush Himalaya region'
		};

		map.getView().animate({
			center: fromLonLat(config.center),
			zoom: config.zoom,
			duration: 1000
		});
	}

	onMount(() => {
		initializeMap();

		// Add resize observer to handle container size changes
		if (typeof ResizeObserver !== 'undefined' && mapContainer) {
			const resizeObserver = new ResizeObserver(() => {
				if (map) {
					// Small delay to ensure DOM is updated
					setTimeout(() => {
						map.updateSize();
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

	// Update map when topic changes
	$: if (map && currentTopic) {
		updateMapView();
	}
</script>

<div
	class="map-container flex flex-col rounded-3xl border border-white/20 bg-white/70 p-6 shadow-2xl backdrop-blur-sm"
	class:h-full={height === '100%'}
>
	<div
		bind:this={mapContainer}
		class="map-element overflow-hidden rounded-2xl border border-slate-200/50"
		style="width: {width}; {height === '100%' ? 'min-height: 800px;' : `height: ${height};`}"
		class:flex-1={height === '100%'}
	></div>
</div>

<style>
	:global(.ol-control) {
		background-color: rgba(255, 255, 255, 0.8) !important;
		border-radius: 8px !important;
	}

	:global(.ol-zoom) {
		top: 10px !important;
		left: 10px !important;
	}

	:global(.ol-attribution) {
		bottom: 5px !important;
		right: 5px !important;
		background-color: rgba(255, 255, 255, 0.7) !important;
		border-radius: 6px !important;
		font-size: 10px !important;
	}

	.map-element {
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
