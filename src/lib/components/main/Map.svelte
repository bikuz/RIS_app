<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { Layers, List, RotateCcw, HomeIcon } from '@lucide/svelte';

	import '@arcgis/core/assets/esri/themes/light/main.css';

	// import WebMap from '@arcgis/core/WebMap';
	// import MapView from '@arcgis/core/views/MapView';
	// import SceneView from '@arcgis/core/views/SceneView';
	// import Basemap from '@arcgis/core/Basemap';

	let mapContainer: HTMLDivElement;
	let view: any = null;
	let isLoading = $state(true);
	let wheelHandler: ((event: WheelEvent) => void) | null = null;

	// Camera parameters
	let latitude = $state(0);
	let longitude = $state(0);
	let altitude = $state(0);
	let tilt = $state(0);
	let heading = $state(0);

	let selectedLayer = $state('elevation');
	// let mapStyle = 'terrain';

	let layerVisibility = $state<Record<string, boolean>>({
		hkhOutline: true,
		// river: true,
		glacier: false,
		mountainRegion: false,
		nightTime: false
	});
	let layerListCollapsed = $state(false);
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
			const [
				Map,
				SceneView,
				Basemap,
				ElevationLayer,
				MapImageLayer,
				GraphicsLayer,
				Graphic,
				Point,
				TextSymbol,
				Legend
			] = await Promise.all([
				import('@arcgis/core/Map'),
				import('@arcgis/core/views/SceneView'),
				import('@arcgis/core/Basemap'),
				import('@arcgis/core/layers/ElevationLayer'),
				import('@arcgis/core/layers/MapImageLayer'),
				import('@arcgis/core/layers/GraphicsLayer'),
				import('@arcgis/core/Graphic'),
				import('@arcgis/core/geometry/Point'),
				import('@arcgis/core/symbols/TextSymbol'),
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
				// zoom: 12,
				// center: [-118.805, 34.027], // Longitude, latitude
				// viewingMode: 'local',
				qualityProfile: 'high',
				camera: {
					position: {
						longitude: 87,
						latitude: 30,
						z: 12000 // elevation in meters
					},
					tilt: 70
					// heading: 15
				},
				environment: {
					// lighting: {
					//     // date: new Date("June 21, 2019 12:00:00 UTC"),
					//     directShadowsEnabled: true,
					//     ambientOcclusionEnabled: true
					// },
					// atmosphereEnabled: true,
					// starsEnabled: true,
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

			// const everestPoint = new Point.default({
			//     longitude: 86.9250,
			//     latitude: 27.9881,
			//     z: 9000
			// });

			// const labelGraphic = new Graphic.default({
			//     geometry: everestPoint,
			//     symbol: new TextSymbol.default({
			//         text: "Mount Everest\n8,848m",
			//         color: "white",
			//         haloColor: "black",
			//         haloSize: 1,
			//         font: { size: 12, weight: "bold" },
			//         yoffset: 20
			//     })
			// });
			// view.graphics.add(labelGraphic);

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

			// console.log('ArcGIS 3D Map loaded successfully');
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

	// Export view for parent component access
	export { view };
</script>

<div class="overflow-hidden rounded-2xl bg-white shadow-xl">
	<div class="flex flex-col lg:flex-row">
		<!-- Map Controls -->

		<!-- Map Display -->
		<div class="relative flex-1">
			<div
				class="map-container relative flex h-full items-center justify-center overflow-hidden sm:h-80 md:h-96 lg:h-[550px]"
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

				<!-- Map overlay info -->
				<div
					class="absolute top-4 right-4 overflow-hidden rounded-lg bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300"
					style="max-height: {layerListCollapsed ? '40px' : '200px'}"
				>
					<!-- Header -->
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2"
						onclick={() => (layerListCollapsed = !layerListCollapsed)}
					>
						<div class="flex items-center">
							<Layers class="h-4 w-4 text-gray-600" />
							<span
								class="ml-2 text-sm font-semibold text-gray-700"
								style="display: {layerListCollapsed ? 'none' : 'block'}">Layers</span
							>
						</div>
						<!-- <span class="text-gray-500 transition-transform duration-300" 
                              style="transform: rotate({layerListCollapsed ? '-90deg' : '0deg'})">▼</span> -->
					</button>

					<!-- Content -->
					<div
						class="p-3 transition-all duration-300"
						style="display: {layerListCollapsed ? 'none' : 'block'}; max-height: {layerListCollapsed
							? '0px'
							: '150px'}; max-width: {layerListCollapsed ? '0px' : 'auto'}"
					>
						<div class="space-y-2 text-sm text-gray-700">
							<!-- HKH Boundary Layer -->
							<label class="group flex cursor-pointer items-center space-x-2">
								<input
									type="checkbox"
									checked={layerVisibility.hkhOutline}
									onchange={() => toggleLayer('hkhOutline')}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 group-hover:border-blue-400 focus:ring-blue-500"
								/>
								<span class="group-hover:text-blue-600">HKH Outline</span>
							</label>

							<!-- River Layer -->
							<!-- <label class="flex items-center space-x-2 cursor-pointer group">
                                <input 
                                type="checkbox" 
                                checked={layerVisibility.river}
                                on:change={() => toggleLayer('river')}
                                class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                                />
                                <span class="group-hover:text-blue-600">River Network</span>
                            </label> -->

							<!-- Glacier Layer -->
							<label class="group flex cursor-pointer items-center space-x-2">
								<input
									type="checkbox"
									checked={layerVisibility.glacier}
									onchange={() => toggleLayer('glacier')}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 group-hover:border-blue-400 focus:ring-blue-500"
								/>
								<span class="group-hover:text-blue-600">Glacier</span>
							</label>

							<!-- Mountain Region Layer -->
							<label class="group flex cursor-pointer items-center space-x-2">
								<input
									type="checkbox"
									checked={layerVisibility.mountainRegion}
									onchange={() => toggleLayer('mountainRegion')}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 group-hover:border-blue-400 focus:ring-blue-500"
								/>
								<span class="group-hover:text-blue-600">Mountain Region</span>
							</label>

							<!-- Night Time Layer -->
							<label class="group flex cursor-pointer items-center space-x-2">
								<input
									type="checkbox"
									checked={layerVisibility.nightTime}
									onchange={() => toggleLayer('nightTime')}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 group-hover:border-blue-400 focus:ring-blue-500"
								/>
								<span class="group-hover:text-blue-600">Night Time</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Reset button -->
				<div
					class="absolute top-4 left-16 overflow-hidden bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300"
				>
					<button
						type="button"
						class="flex cursor-pointer items-center justify-between border-b border-gray-200 bg-gray-50 px-2 py-2"
						onclick={resetMapView}
					>
						<div class="flex items-center">
							<HomeIcon class="h-4 w-4 text-gray-600" />
						</div>
					</button>
				</div>

				<!-- Legend overlay -->
				<div
					class="absolute bottom-6 left-4 overflow-hidden rounded-lg bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300"
					style="max-height: {legendCollapsed ? '40px' : '300px'}"
				>
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2"
						onclick={() => (legendCollapsed = !legendCollapsed)}
					>
						<div class="flex items-center">
							<List class="h-4 w-4 text-gray-600" />
							<span
								class="ml-2 text-sm font-semibold text-gray-700"
								style="display: {legendCollapsed ? 'none' : 'block'}">Legend</span
							>
						</div>
					</button>

					<!-- Content -->
					<div
						class="overflow-y-auto bg-white p-3 transition-all duration-300"
						style="display: {legendCollapsed ? 'none' : 'block'}; max-height: {legendCollapsed
							? '0px'
							: '300px'}; max-width: {legendCollapsed ? '0px' : 'auto'}"
					>
						<div id="legend-content" class="text-sm text-gray-700"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- <div class="lg:w-80 bg-gray-50 p-6 border-r border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Layers class="w-5 h-5 mr-2" />
                Layers
            </h3>
            
            <div class="space-y-3 mb-6">
                {#each layers as layer}
                    <button
                        class="w-full flex items-center p-3 rounded-lg border-2 transition-all {selectedLayer === layer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
                        onclick={() => selectedLayer = layer.id}
                    >
                        <div class="w-4 h-4 rounded {layer.color} mr-3"></div>
                        <span class="font-medium text-gray-900">{layer.name}</span>
                    </button>
                {/each}
            </div>
            
            <div class="border-t border-gray-200 pt-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Map Controls</h4>
                <div class="flex space-x-2">
                    <button class="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <ZoomIn class="w-4 h-4" />
                    </button>
                    <button class="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <ZoomOut class="w-4 h-4" />
                    </button>
                    <button class="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <RotateCcw class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div> -->
	</div>
</div>

<style>
	/* Load ArcGIS CSS but override problematic rules */
	/* @import "https://js.arcgis.com/4.28/esri/themes/light/main.css"; */

	/* .map-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 400px;
      border-radius: 0.5rem;
      overflow: hidden;
      background: #f3f4f6;
    } */

	/* .map-container {
      width: 100% !important;
      height: 100% !important;
      min-height: 500px !important;
      position: relative !important;
      display: block !important;
    }
     */

	/* .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
    } */

	/* Critical overrides to prevent dimension collapse */
	/* :global(.esri-view) {
      width: 100% !important;
      height: 100% !important;
      min-width: 100px !important;
      min-height: 100px !important;
      position: relative !important;
    } */

	:global(.esri-view-root) {
		width: 100% !important;
		height: 100% !important;
	}

	/* :global(.esri-view-surface) {
      width: 100% !important;
      height: 100% !important;
    } */

	/* :global(canvas) {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
    } */
</style>
