<script lang="ts">
    import { onMount } from 'svelte';

	import { Menu, ChevronLeft, ChevronsRight, Layers, ChevronRight} from '@lucide/svelte';

    import Map from 'ol/Map';
    import View from 'ol/View';
    import TileLayer from 'ol/layer/Tile';
    import OSM from 'ol/source/OSM';
    import 'ol/ol.css';

    let mapContainer: HTMLDivElement;
    let panelOpen = true; // left panel is extended by default
    let layersPanelOpen = false; // right panel is extended by default

    onMount(() => {
        new Map({
            target: mapContainer,
            layers: [
                new TileLayer({
                    source: new OSM()
                })
            ],
            view: new View({
                center: [9280000, 3220000], // Nepal approx (EPSG:3857)
                zoom: 6
            })
        });
    });
</script>

<style>
    .map {
        width: 100%;
        height: 100%;
    }
    .slide-in-animation {
        transform: translateX(100%);
        opacity: 0;
    }
    .slide-in-animation.active {
        transform: translateX(0);
        opacity: 1;
    }
</style>

<!-- 3-Column Layout -->
<div class="grid grid-cols-12 items-stretch gap-8">
    <!-- Left Sidebar -->
    <div class="col-span-3 flex">
        <div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
            <h3 class="mb-3 text-sm font-semibold text-slate-700">Climate Abstract</h3>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="col-span-6 flex flex-col gap-4">
        <!-- Map Section -->
        <div class="min-h-[400px] flex-1 rounded-xl border border-slate-200/50 bg-white shadow-sm overflow-hidden relative flex">
            
            <!-- Left Collapsible Panel -->
            <div
                class="bg-white border-r border-slate-200/50 shadow-md transition-all duration-300 ease-in-out absolute z-10 h-1/2 top-[3.75rem] left-[0.5rem] rounded-xl"
                style="width: {panelOpen ? '25%' : '0'};"
            >
                <!-- Collapse Button -->
                {#if panelOpen}
                    <button
                        class="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-1 shadow"
                        on:click={() => panelOpen = false}
                    >
                        <!-- Left Arrow -->
                        <ChevronLeft class="w-4 h-4" />
                    </button>
                    <div class="p-4 overflow-hidden">
                        <h3 class="font-semibold mb-2">Panel Content</h3>
                        <p class="text-sm text-gray-600">You can place your map controls or data info here.</p>
                    </div>
                {/if}
            </div>

            <!-- Map Container -->
            <div class="flex-1 relative">
                <div bind:this={mapContainer} class="map"></div>

                <!-- Left Expand Button (only when collapsed) -->
                {#if !panelOpen}
                    <button
                        class="absolute top-[3.75rem] left-2 bg-white border border-slate-200/50 hover:bg-gray-100 rounded shadow p-1"
                        on:click={() => panelOpen = true}
                    >
                        <!-- Menu Icon -->
                        <Menu class="w-4 h-4" />
                    </button>
                {/if}

                <!-- Right Expand/Collapse Button -->
                <button
                    class="absolute top-[3.75rem] right-2 bg-white border border-slate-200/50 hover:bg-gray-100 rounded shadow p-1"
                    on:click={() => layersPanelOpen = !layersPanelOpen}
                >
                    {#if layersPanelOpen}
                        <!-- Right Arrow Icon -->
                        <ChevronsRight class="w-4 h-4" />
                    {:else}
                        <!-- Layers Icon -->
                        <Layers class="w-4 h-4" />
                    {/if}
                </button>
            </div>

            <!-- Right Collapsible Panel -->
            <div
                class="bg-white border-l border-slate-200/50 shadow-md transition-all duration-500 ease-in-out absolute z-10 h-1/2 top-[3.75rem] right-[2.5rem] rounded-xl transform origin-right"
                class:scale-x-0={!layersPanelOpen}
                style="width: 20%;"
            >
                <div class="p-4 overflow-hidden">
                    <h3 class="font-semibold mb-2">Layer Toggler</h3>
                    <p class="text-sm text-gray-600">This is where you'll toggle different map layers.</p>
                </div>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="flex-1 rounded-xl border border-slate-200/50 bg-white shadow-sm p-4">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">Climate Chart</h3>
            <div class="h-64 flex items-center justify-center border border-slate-200/50 rounded-xl bg-gray-50">
                <p class="text-slate-500">[Chart will be rendered here]</p>
            </div>
        </div>
    </div>

    <!-- Right Sidebar -->
    <div class="col-span-3 flex">
        <div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
            <h3 class="mb-3 text-sm font-semibold text-slate-700">Possible Questions</h3>
        </div>
    </div>
</div>
