<script>
	import { Map, Layers, ZoomIn, ZoomOut, RotateCcw } from '@lucide/svelte';
	
	let selectedLayer = $state('elevation');
	let mapStyle = 'terrain';
	
	const layers = [
        { id: 'forest', name: 'HKH boundary', color: 'bg-green-500' },
		{ id: 'elevation', name: 'Elevation', color: 'bg-amber-500' },
		{ id: 'climate', name: 'Slope', color: 'bg-blue-500' },
		// { id: 'population', name: 'Population Density', color: 'bg-purple-500' },
		
	];
</script>

<div class="bg-white rounded-2xl shadow-xl overflow-hidden">
    <div class="flex flex-col lg:flex-row">
        <!-- Map Controls -->
        
        
        <!-- Map Display -->
        <div class="flex-1 relative">
            <div class="h-96 lg:h-[500px] flex items-center justify-center relative overflow-hidden">
                <!-- bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 -->
                <!-- Simulated map background -->
                <!-- <div class="absolute inset-0 opacity-20">
                    <div class="absolute top-10 left-10 w-32 h-24 bg-green-600 rounded-lg transform rotate-12"></div>
                    <div class="absolute top-20 right-20 w-28 h-20 bg-blue-600 rounded-lg transform -rotate-6"></div>
                    <div class="absolute bottom-20 left-20 w-36 h-28 bg-purple-600 rounded-lg transform rotate-3"></div>
                    <div class="absolute bottom-10 right-10 w-24 h-32 bg-amber-600 rounded-lg transform -rotate-12"></div>
                </div> -->
                
                <div class="text-center z-10">
                    <Map class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">HKH Region Map</h3>
                    <p class="text-gray-500">Displaying: {layers.find(l => l.id === selectedLayer)?.name}</p>
                </div>
                
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