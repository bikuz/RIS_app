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
        river: true,  // Default to visible
        mountainRegion: false
    });
    let layerListCollapsed = $state(false);
    let legendCollapsed = $state(false);
    let hkhOutline:any;
    let physioLayer: any;
    let originalCameraPosition: any = null;
    

    // Toggle layer visibility
    function toggleLayer(layerName: string) {
        layerVisibility[layerName] = !layerVisibility[layerName];
        
        // Update river layer visibility if it exists
        if (layerName === 'river' && physioLayer) {
            const sublayer = physioLayer.findSublayerById(3);
            if (sublayer)
                sublayer.visible = layerVisibility.river;
        }
         
        if(layerName === 'hkhOutline' && hkhOutline){
            const sublayer = hkhOutline.findSublayerById(0);
            if (sublayer)
                sublayer.visible = layerVisibility.hkhOutline;
        }

        if(layerName === 'mountainRegion' && physioLayer){
            const sublayer = physioLayer.findSublayerById(4);
            if (sublayer)
                sublayer.visible = layerVisibility.mountainRegion;
        }
       
        
    }

    // Reset map to original camera position
    function resetMapView() {
        if (view && originalCameraPosition) {
            view.goTo(originalCameraPosition, {
                duration: 2000,
                easing: "ease-out"
            });
        }
    }

	// const layers = [
    //     { id: 'forest', name: 'HKH boundary', color: 'bg-green-500' },
	// 	{ id: 'elevation', name: 'River', color: 'bg-amber-500' },
	// 	{ id: 'climate', name: 'Slope', color: 'bg-blue-500' },
	// 	// { id: 'population', name: 'Population Density', color: 'bg-purple-500' },
		
	// ];
     
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
                url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
            });

            // create HKH outline layer
            hkhOutline=new MapImageLayer.default({
                url: "https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer",
                title: "HKH Outline ",
                sublayers:[
                    {
                        id:0,
                        title:'',
                        visible:true
                    },
                    
                ] 
                 
            });
            // Create the river network layer
            physioLayer = new MapImageLayer.default({
                url: "https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer",
                title: "Physiography ",
                sublayers:[
                    {
                        id:4,
                        title:'Mountain Region',
                        visible:layerVisibility.mountainRegion
                    },
                    {
                        id:3,
                        title:'River',
                        visible:layerVisibility.river
                    },
                   
                ] 
                 
            });

             

            const map = new Map.default({
                basemap: "satellite", // You can use "streets", "hybrid", "terrain", etc.
                ground: {
                    layers: [elevationLayer],
                    opacity: 1,
                    surfaceColor: [255, 255, 255, 0]
                },
                layers: [physioLayer,hkhOutline,]  
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
                    type: "classic",
                    layout: "auto"
                }
            });
            
            // // Create a custom container for the collapsible legend
            // const legendContainer = document.createElement("div");
            // legendContainer.className = "esri-widget esri-legend";
            // legendContainer.style.cssText = `
            //     background: white;
            //     border-radius: 8px;
            //     box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            //     max-height: 300px;
            //     overflow: hidden;
            //     transition: max-height 0.3s ease;
            // `;
            
            // // Create header with collapse button
            // const header = document.createElement("div");
            // header.style.cssText = `
            //     padding: 8px 12px;
            //     background: #f8f9fa;
            //     border-bottom: 1px solid #e9ecef;
            //     display: flex;
            //     justify-content: space-between;
            //     align-items: center;
            //     cursor: pointer;
            //     font-weight: 600;
            //     font-size: 14px;
            // `;
            // header.innerHTML = `
                
            //     <span class="ml-2">Legend</span>
            //     <span class="collapse-icon" style="transition: transform 0.3s ease;">▼</span>
            // `;
            
            // // Create content container
            // const content = document.createElement("div");
            // content.style.cssText = `
            //     padding: 8px;
            //     max-height: 250px;
            //     overflow-y: auto;
            // `;
            
            // // Add legend content to the container
            // legend.container = content;
            
            // // Assemble the collapsible legend
            // legendContainer.appendChild(header);
            // legendContainer.appendChild(content);
            
            // // Add collapse functionality
            // let isCollapsed = false;
            // header.addEventListener("click", () => {
            //     isCollapsed = !isCollapsed;
            //     const icon = header.querySelector(".collapse-icon") as HTMLElement;
            //     if (isCollapsed) {
            //         content.style.maxHeight = "0px";
            //         content.style.padding = "0px 8px";
            //         if (icon) icon.style.transform = "rotate(-90deg)";
            //     } else {
            //         content.style.maxHeight = "250px";
            //         content.style.padding = "8px";
            //         if (icon) icon.style.transform = "rotate(0deg)";
            //     }
            // });
            
            // // Add to view UI
            // view.ui.add(legendContainer, "bottom-right");

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
                const initialPosition = {
                    position: {
                        longitude: 84.130628,
                        latitude: 2.984924,
                        z: 6719155
                    },
                    tilt: 20,
                    heading: 2.6  // Looking from the north
                };
                
                // Store the original camera position for reset functionality
                originalCameraPosition = initialPosition;
                
                view.goTo(initialPosition);
            });
            // console.log('ArcGIS 3D Map loaded successfully');
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
            <div class="map-container h-96 lg:h-[600px] flex items-center justify-center relative overflow-hidden"
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
            <div class="absolute bottom-4 right-4 bg-white bg-opacity-80 p-3 rounded-lg shadow-md text-sm">
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
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden transition-all duration-300" 
                     style="max-height: {layerListCollapsed ? '40px' : '200px'}">
                    <!-- Header -->
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                         on:click={() => layerListCollapsed = !layerListCollapsed}>
                        <div class="flex items-center ">
                            <Layers class="w-4 h-4 text-gray-600" />
                            <span class="text-sm font-semibold text-gray-700 ml-2"  style="display: {layerListCollapsed ? 'none' : 'block'}">Layers</span>
                        </div>
                        <!-- <span class="text-gray-500 transition-transform duration-300" 
                              style="transform: rotate({layerListCollapsed ? '-90deg' : '0deg'})">▼</span> -->
                    </div>
                    
                    <!-- Content -->
                    <div class="p-3 transition-all duration-300" 
                         style="display: {layerListCollapsed ? 'none' : 'block'}; max-height: {layerListCollapsed ? '0px' : '150px'}; max-width: {layerListCollapsed ? '0px' : 'auto'}">
                        <div class="text-sm text-gray-700 space-y-2">
                            <!-- HKH Boundary Layer -->
                            <label class="flex items-center space-x-2 cursor-pointer group">
                                <input 
                                type="checkbox" 
                                checked={layerVisibility.hkhOutline}
                                on:change={() => toggleLayer('hkhOutline')}
                                class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                                />
                                <span class="group-hover:text-blue-600">HKH Outline</span>
                            </label>

                            <!-- River Layer -->
                            <label class="flex items-center space-x-2 cursor-pointer group">
                                <input 
                                type="checkbox" 
                                checked={layerVisibility.river}
                                on:change={() => toggleLayer('river')}
                                class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                                />
                                <span class="group-hover:text-blue-600">River Network</span>
                            </label>

                            <!-- Mountain Region Layer -->
                            <label class="flex items-center space-x-2 cursor-pointer group">
                                <input 
                                type="checkbox" 
                                checked={layerVisibility.mountainRegion}
                                on:change={() => toggleLayer('mountainRegion')}
                                class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                                />
                                <span class="group-hover:text-blue-600">Mountain Region</span>
                            </label>
                        </div>
                    </div>
                </div>

                                 <!-- Reset button -->
                 <div class="absolute top-4 left-16 bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-300">
                     <!-- <button 
                         on:click={resetMapView}
                         class="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                         title="Reset to original view"
                     >
                         <RotateCcw class="w-5 h-5" />
                     </button> -->

                     <div class="px-2 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                        on:click={resetMapView}>
                        <div class="flex items-center ">
                            <HomeIcon class="w-4 h-4 text-gray-600" />
                        </div>
                        
                    </div>
                 </div>

                 <!-- Legend overlay -->
                 <div class="absolute bottom-6 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden transition-all duration-300" 
                      style="max-height: {legendCollapsed ? '40px' : '300px'}">
                    <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                         on:click={() => legendCollapsed = !legendCollapsed}>
                         <div class="flex items-center ">
                            <List class="w-4 h-4 text-gray-600" />
                            <span class="text-sm font-semibold text-gray-700 ml-2"  style="display: {legendCollapsed ? 'none' : 'block'}">Legend</span>
                         </div>
                        
                    </div>

                    <!-- Content -->
                    <div class="p-3 transition-all duration-300 bg-white overflow-y-auto" 
                         style="display: {legendCollapsed ? 'none' : 'block'}; max-height: {legendCollapsed ? '0px' : '300px'}; max-width: {legendCollapsed ? '0px' : 'auto'}">
                        <div id="legend-content" class="text-sm text-gray-700">
                           
                        </div>
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