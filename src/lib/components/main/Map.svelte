<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { List, HomeIcon, ChevronDown } from '@lucide/svelte';

	import '@arcgis/core/assets/esri/themes/light/main.css';

	let mapContainer: HTMLDivElement;
	let view: any = null;
	let isLoading = $state(true);
	let wheelHandler: ((event: WheelEvent) => void) | null = null;

	// Camera parameters (used by the hidden debug overlay)
	let latitude = $state(0);
	let longitude = $state(0);
	let altitude = $state(0);
	let tilt = $state(0);
	let heading = $state(0);

	let layerVisibility = $state<Record<string, boolean>>({
		hkhOutline: true,
		// river: true, // Physiography sublayer id 3 — enable when river network is needed
		glacier: false,
		mountainRegion: false,
		nightTime: false
	});
	let legendCollapsed = $state(false);
	let hkhOutline: any;
	let physioLayer: any;
	let glacierLayer: any;
	let nightTimeLayer: any;

	const initialPosition = {
		position: {
			longitude: 84.130628,
			latitude: 2.984924,
			z: 6719155
		},
		tilt: 20,
		heading: 2.6 // Looking from the north
	};

	// Toggle layer visibility
	function toggleLayer(layerName: string) {
		layerVisibility[layerName] = !layerVisibility[layerName];

		// Update river layer visibility if it exists
		// if (layerName === 'river' && physioLayer) {
		//     const sublayer = physioLayer.findSublayerById(3);
		//     if (sublayer)
		//         sublayer.visible = layerVisibility.river;
		// }

		if (layerName === 'hkhOutline' && hkhOutline) {
			const sublayer = hkhOutline.findSublayerById(0);
			if (sublayer) sublayer.visible = layerVisibility.hkhOutline;
		}

		if (layerName === 'mountainRegion' && physioLayer) {
			const sublayer = physioLayer.findSublayerById(4);
			if (sublayer) sublayer.visible = layerVisibility.mountainRegion;
		}
		if (layerName === 'glacier' && glacierLayer) {
			const sublayer = glacierLayer.findSublayerById(0);
			if (sublayer) sublayer.visible = layerVisibility.glacier;
		}
		if (layerName === 'nightTime' && nightTimeLayer) {
			const sublayer = nightTimeLayer.findSublayerById(7);
			if (sublayer) sublayer.visible = layerVisibility.nightTime;
		}
	}

	// Reset map to original camera position
	function resetMapView() {
		if (view && initialPosition) {
			view.goTo(initialPosition, {
				duration: 2000,
				easing: 'ease-out'
			});
		}
	}

	onMount(async () => {
		if (!browser) return;

		// Initialize your map here
		try {
			const [Map, SceneView, ElevationLayer, MapImageLayer, Legend] = await Promise.all([
				import('@arcgis/core/Map'),
				import('@arcgis/core/views/SceneView'),
				import('@arcgis/core/layers/ElevationLayer'),
				import('@arcgis/core/layers/MapImageLayer'),
				import('@arcgis/core/widgets/Legend')
			]);

			// Create elevation layer for 3D terrain
			const elevationLayer = new ElevationLayer.default({
				url: '//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
			});

			// create HKH outline layer
			hkhOutline = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
				title: '',
				sublayers: [
					{
						id: 0,
						title: 'HKH Outline ',
						visible: true
					}
				]
			});
			// Create the river network layer
			physioLayer = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
				title: '',
				sublayers: [
					{
						id: 4,
						title: 'Mountain Region',
						visible: layerVisibility.mountainRegion
					}
					// {
					//     id:3,
					//     title:'River',
					//     visible:layerVisibility.river
					// },
				]
			});

			// create glacier layer
			glacierLayer = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Glacier/MapServer',
				title: '',
				sublayers: [
					{
						id: 0,
						title: 'Glacier',
						visible: layerVisibility.glacier
					}
				]
			});
			// create night time layer
			nightTimeLayer = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
				title: '',
				sublayers: [
					{
						id: 7,
						title: 'Night Light',
						visible: layerVisibility.nightTime
					}
				]
			});

			const map = new Map.default({
				basemap: 'satellite', // You can use "streets", "hybrid", "terrain", etc.
				ground: {
					layers: [elevationLayer],
					opacity: 1,
					surfaceColor: [255, 255, 255, 0]
				},
				layers: [nightTimeLayer, physioLayer, glacierLayer, hkhOutline]
			});

			view = new SceneView.default({
				container: mapContainer,
				map: map,
				qualityProfile: 'high',
				camera: {
					position: {
						longitude: 87,
						latitude: 30,
						z: 12000
					},
					tilt: 70
				}
			});

			// Add collapsible legend widget
			const legend = new Legend.default({
				view: view,
				style: {
					type: 'classic',
					layout: 'auto'
				}
			});

			// Add legend content
			const legendContent = document.getElementById('legend-content');
			legend.container = legendContent;

			// Optional: add a Mount Everest label with Graphic + Point + TextSymbol (86.9250, 27.9881)

			// Wait for view to load
			await view.when(() => {
				// Store the original camera position for reset functionality
				view.goTo(initialPosition);
			});

			// Disable default mouse wheel zoom
			view.navigation.mouseWheelZoomEnabled = false;

			// Custom wheel handler: only zoom when Ctrl is pressed
			wheelHandler = (event: WheelEvent) => {
				if (event.ctrlKey || event.metaKey) {
					// Zoom map when Ctrl (or Cmd on Mac) is pressed
					event.preventDefault();
					const delta = event.deltaY;
					const camera = view.camera.clone();
					
					// Calculate zoom factor
					const zoomFactor = delta > 0 ? 0.9 : 1.1;
					
					// Adjust camera altitude for zoom effect
					camera.position.z = camera.position.z * zoomFactor;
					
					view.goTo(camera, { duration: 0 });
				}
				// When Ctrl is not pressed, allow default behavior (page scroll)
			};

			// Add wheel event listener to the map container
			mapContainer.addEventListener('wheel', wheelHandler, { passive: false });

			// 
			isLoading = false;

			// Update camera parameters on move
			view.watch('camera', (camera: any) => {
				// Convert camera position to geographic coordinates
				const point = camera.position;
				const spatialReference = view.spatialReference;
				const geographicPoint = point.clone();

				if (spatialReference.isWebMercator) {
					geographicPoint.spatialReference = spatialReference;
				}

				// Update reactive variables
				longitude = geographicPoint.longitude;
				latitude = geographicPoint.latitude;
				altitude = geographicPoint.z;
				tilt = camera.tilt;
				heading = camera.heading;
			});
		} catch (error) {
			isLoading = false;
			console.error('ArcGIS error:', error);
		}
	});

	onDestroy(() => {
		// Clean up on component unmount
		if (mapContainer && wheelHandler) {
			// Remove wheel event listener
			mapContainer.removeEventListener('wheel', wheelHandler);
		}
		if (view && typeof view.destroy === 'function') {
			view.destroy();
			view = null;
		}
	});

	// Export view + layer controls for parent component access
	export { view, toggleLayer, layerVisibility };
</script>

<div class="overflow-hidden rounded-[5px] bg-white">
	<div class="flex flex-col lg:flex-row">
		<!-- Map Controls -->

		<!-- Map Display -->
		<div class="relative flex-1">
			<div
				class="map-container relative flex h-full items-center justify-center overflow-hidden rounded-[5px] sm:h-80 md:h-96 lg:h-[550px]"
				bind:this={mapContainer}
			>
				{#if isLoading}
					<div
						class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100"
					>
						<div class="text-center">
							<div
								class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"
							></div>
							<p class="text-gray-600">Loading 3D Map...</p>
						</div>
					</div>
				{/if}

				<!-- Camera parameters display -->
				<div
					class="bg-opacity-80 absolute right-4 bottom-4 rounded-lg bg-white p-3 text-sm shadow-md hidden"
				>
					<div class="grid grid-cols-2 gap-2">
						<div class="font-semibold">Latitude:</div>
						<div>{latitude.toFixed(6)}°</div>

						<div class="font-semibold">Longitude:</div>
						<div>{longitude.toFixed(6)}°</div>

						<div class="font-semibold">Altitude:</div>
						<div>{altitude?.toFixed(0) || 0} m</div>

						<div class="font-semibold">Tilt:</div>
						<div>{tilt?.toFixed(1) || 0}°</div>

						<div class="font-semibold">Heading:</div>
						<div>{heading?.toFixed(1) || 0}°</div>
					</div>
				</div>

				<!-- Reset button — stacked below the ArcGIS zoom widget (top-left) -->
				<div class="absolute top-[15px] left-[60px] z-20 overflow-hidden  shadow-md">
					<button
						type="button"
						class="flex size-8 cursor-pointer items-center justify-center bg-white text-gray-600 transition hover:bg-gray-50"
						onclick={resetMapView}
						title="Reset to Home View"
						aria-label="Reset to Home View"
					>
						<HomeIcon class="h-4 w-4" />
					</button>
				</div>

				<!-- Legend overlay -->
				<div
					class="absolute bottom-6 right-2 w-[150px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300"
					style="max-height: {legendCollapsed ? '37px' : '260px'}"
				>
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between gap-2 border-b border-[#E5EAF0] bg-[#F8FAFC] px-2.5 py-1.5"
						onclick={() => (legendCollapsed = !legendCollapsed)}
					>
						<span class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#46637A]">
							<List class="h-3.5 w-3.5" />
							Legend
						</span>
						<ChevronDown
							class="h-3.5 w-3.5 shrink-0 text-[#8A9BAD] transition-transform duration-200 {legendCollapsed
								? '-rotate-90'
								: ''}"
						/>
					</button>

					<!-- Content -->
					<div
						class="overflow-y-auto bg-white p-1.5 transition-all duration-300"
						style="max-height: {legendCollapsed ? '0px' : '220px'}"
					>
						<div id="legend-content"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.esri-view-root) {
		width: 100% !important;
		height: 100% !important;
		overflow: hidden !important;
		border-radius: 5px;
	}

	:global(.esri-view),
	:global(.esri-view-surface) {
		overflow: hidden !important;
		border-radius: 5px;
	}

	/* Compact the default Esri Legend widget so it's proportionate to the map card.
	   Swatch/symbol sizes are left at their default — only spacing is tightened. */
	:global(#legend-content .esri-legend) {
		padding: 0 !important;
		font-family: inherit !important;
	}
	:global(#legend-content .esri-legend__service) {
		padding: 0 !important;
	}
	:global(#legend-content .esri-legend__layer) {
		margin-bottom: 3px !important;
	}
	:global(#legend-content .esri-legend__layer:last-child) {
		margin-bottom: 0 !important;
	}
	:global(#legend-content .esri-legend__layer-caption) {
		margin: 0 0 1px !important;
		padding: 0 !important;
		font-size: 10.5px !important;
		font-weight: 700 !important;
		color: #31506a !important;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	:global(#legend-content .esri-legend__layer-table),
	:global(#legend-content .esri-legend__layer-body) {
		margin: 0 !important;
		border-spacing: 0 !important;
	}
	:global(#legend-content .esri-legend__layer-child-table) {
		margin-bottom: 8px !important;
	}
	:global(#legend-content .esri-legend__layer-row) {
		line-height: 1.05 !important;
	}
	:global(#legend-content .esri-legend__layer-cell) {
		padding: 0 !important;
	}
	:global(#legend-content .esri-legend__layer-cell--symbols) {
		padding-right: 4px !important;
	}
	:global(#legend-content .esri-legend__layer-cell--info) {
		padding: 0 !important;
		font-size: 10.5px !important;
		color: #64788b !important;
	}
</style>
