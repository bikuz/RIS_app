<script lang="ts">

	import { onMount, onDestroy } from 'svelte';
  	import { browser } from '$app/environment';
    
    import '@arcgis/core/assets/esri/themes/light/main.css';
    
    // import WebMap from '@arcgis/core/WebMap';
    // import MapView from '@arcgis/core/views/MapView';
    // import SceneView from '@arcgis/core/views/SceneView';
    // import Basemap from '@arcgis/core/Basemap';
    
    let mapContainer: HTMLDivElement;
    let view: any = null;
    let isLoading = $state(true);
    
    // Camera parameters
    let latitude = $state(0);
    let longitude = $state(0);
    let altitude = $state(0);
    let tilt = $state(0);
    let heading = $state(0);

	let selectedLayer = $state('elevation');
	// let mapStyle = 'terrain';
	
	const layers = [
        { id: 'forest', name: 'HKH boundary', color: 'bg-green-500' },
		{ id: 'elevation', name: 'Elevation', color: 'bg-amber-500' },
		{ id: 'climate', name: 'Slope', color: 'bg-blue-500' },
		// { id: 'population', name: 'Population Density', color: 'bg-purple-500' },
		
	];
     
	onMount(async () => {
        if (!browser) return;
        
        // Initialize your map here
        try {
            
            const [
                Map,
                SceneView,
                Basemap,
                ElevationLayer,
                GraphicsLayer,
                Graphic,
                Point,
                TextSymbol 
            ] = await Promise.all([
                import('@arcgis/core/Map'),
                import('@arcgis/core/views/SceneView'),
                import('@arcgis/core/Basemap'),
                import('@arcgis/core/layers/ElevationLayer'),
                import('@arcgis/core/layers/GraphicsLayer'),
                import('@arcgis/core/Graphic'),
                import('@arcgis/core/geometry/Point'),
                import('@arcgis/core/symbols/TextSymbol')
            ]);

            // Create elevation layer for 3D terrain
            const elevationLayer = new ElevationLayer.default({
                url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
            });

            const map = new Map.default({
                basemap: "satellite", // You can use "streets", "hybrid", "terrain", etc.
                ground: {
                    layers: [elevationLayer]
                },
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
                    tilt: 70,
                    // heading: 15
                },
                environment: {
                    lighting: {
                        // date: new Date("June 21, 2019 12:00:00 UTC"),
                        directShadowsEnabled: true,
                        ambientOcclusionEnabled: true
                    },
                    atmosphereEnabled: true,
                    starsEnabled: true,
                }
            });

            const everestPoint = new Point.default({
                longitude: 86.9250,
                latitude: 27.9881,
                z: 8850
            });

            const labelGraphic = new Graphic.default({
                geometry: everestPoint,
                symbol: new TextSymbol.default({
                    text: "Mount Everest\n8,848m",
                    color: "white",
                    haloColor: "black",
                    haloSize: 1,
                    font: { size: 12, weight: "bold" },
                    yoffset: 20
                })
            });
            view.graphics.add(labelGraphic);

            // Wait for view to load
            await view.when(() => {
                // view.goTo({
                //     position: {
                //     // Mount Everest coordinates
                //     longitude: 86.9250, 
                //     latitude: 27.9881,
                //     // Elevation in meters (higher than Everest's summit)
                //     z: 14000 
                //     },
                //     tilt: 65,  // Angle looking downward (0 = straight down, 90 = horizontal)
                //     heading: 45  // Rotation around the point (0 = north, 90 = east)
                // });

                // view.goTo({
                //     position: {
                //         longitude: 85.9250,
                //         latitude: 27.9881,
                //         z: 15000
                //     },
                //     tilt: 45,
                //     heading: 0
                //     });

                view.goTo({
                    position: {
                        longitude: 86.693581,
                        latitude: 27.982193,
                        z: 9954
                    },
                    tilt: 80.6,
                    heading: 94.3  // Looking from the north
                });
            });
            console.log('ArcGIS 3D Map loaded successfully');
            // await loadArcGISCSS();
            isLoading=false;


            // Update camera parameters on move
            view.watch('camera', (camera:any) => {
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
            isLoading=false;
            console.error('ArcGIS error:', error);
        }
		
	});

 
	onDestroy(() => {
		// Clean up on component unmount
		// 'view' is scoped inside onMount; recreate a reference if needed or manage globally
		// Since 'view' is local above, no-op here. If you move 'view' to outer scope, destroy it here.
        if (view && typeof view.destroy === 'function') {
            view.destroy();
            view = null;
        }
	});

    // Export view for parent component access
    export { view };
</script>
 

<div class="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div class="flex flex-col lg:flex-row">
        <!-- Map Controls -->
        
        
        <!-- Map Display -->
        <div class="flex-1 relative">
            <div class="map-container h-96 lg:h-[500px] flex items-center justify-center relative overflow-hidden"
            bind:this={mapContainer}
            >
            {#if isLoading}
                <div class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading 3D Map...</p>
                    </div>
                </div>
            {/if}

            <!-- Camera parameters display -->
  <div class="absolute bottom-4 left-4 bg-white bg-opacity-80 p-3 rounded-lg shadow-md text-sm">
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
                <!-- bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 -->
                <!-- Simulated map background -->
                <!-- <div class="absolute inset-0 opacity-20">
                    <div class="absolute top-10 left-10 w-32 h-24 bg-green-600 rounded-lg transform rotate-12"></div>
                    <div class="absolute top-20 right-20 w-28 h-20 bg-blue-600 rounded-lg transform -rotate-6"></div>
                    <div class="absolute bottom-20 left-20 w-36 h-28 bg-purple-600 rounded-lg transform rotate-3"></div>
                    <div class="absolute bottom-10 right-10 w-24 h-32 bg-amber-600 rounded-lg transform -rotate-12"></div>
                </div> -->
                
                <!-- <div class="text-center z-10">
                    <Map class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">HKH Region Map</h3>
                    <p class="text-gray-500">Displaying: {layers.find(l => l.id === selectedLayer)?.name}</p>
                </div> -->
                
                <!-- Map overlay info -->
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div class="text-sm text-gray-600">
                        <div class="font-bold">Layers</div>
                        <div><input type="checkbox"/><span class="ml-2">HKH boundary</span></div>
                        <div><input type="checkbox"/><span class="ml-2">Elevation</span></div>
                        <div><input type="checkbox"/><span class="ml-2">Slope</span></div>
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