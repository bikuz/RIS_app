<script lang="ts">
	import {
		topicIcons,
		topicDetail,
		getTopicColor,
		selectTopic,
		getTopicName
	} from '$lib/data/themeData';
	import { onMount } from 'svelte';
	import { Mountain, Users, Snowflake, Pentagon, Map, Cloud, Wind } from '@lucide/svelte';

	// Import images from assets
	import climateImg from '$lib/assets/icons/climate.png';
	import ecosystemImg from '$lib/assets/icons/ecosystem.png';
	import humanDimensionImg from '$lib/assets/icons/human_dimension.png';
	import airQualityImg from '$lib/assets/icons/air_quality.png';
	import cryosphereImg from '$lib/assets/icons/cryosphere.png';
	import physiographyImg from '$lib/assets/icons/physio.png';

	 

	let Map3D: any = $state();

	onMount(() => {
		import('./Map.svelte').then((module) => {
			Map3D = module.default;
		});
	});

	const stats = [
		{
			icon: Snowflake,
			value: '2,548',
			label: 'Glaciers'
		},
		{
			icon: Pentagon,
			value: '4.2M km²',
			label: 'Total area'
		},
		{
			icon: Users,
			value: '233+ M',
			label: 'Population'
		},
		{
			icon: Mountain,
			value: '28 - 8,848 m',
			label: 'Elevation range'
		}
	];
</script>

<section class="relative overflow-hidden py-40 pt-10">
	<div class=" relative px-4 sm:px-6 lg:px-8">
		
		<!-- Bottom Section: Stats (Left), Map (Middle), Links (Right) -->
        <!-- container mx-auto -->
		<div class="flex flex-col lg:flex-row gap-6 lg:gap-6">
			<!-- Left Column: Stats (Vertical) -->
			<div class="w-full lg:w-[15%] h-48 sm:h-64 md:h-80 lg:h-[550px]">
				<div class="flex flex-col gap-2 h-full justify-between">
					{#each stats as stat}
						<div class="text-center flex-1 flex flex-col items-center justify-center">
							<div class="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-1.5 bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
								<stat.icon class="h-4 w-4 text-white" />
							</div>
							<div class="text-lg font-bold text-gray-900 mb-1">{stat.value}</div>
							<div class="text-sm font-medium text-gray-600 capitalize">{stat.label}</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Middle Column: Map -->
			<div class="w-full lg:w-[70%]">
				<div class="rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/50 border border-gray-200/50 h-48 sm:h-64 md:h-80 lg:h-[550px]">
					{#if Map3D}
						<div class="">
							<Map3D />
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Column: Links -->
			<div class="w-full lg:w-[15%] h-48 sm:h-64 md:h-80 lg:h-[550px] flex items-center justify-center">
				<div class="flex flex-col gap-4 w-full">
					<!-- Interactive map (standalone) -->
					<a href="/integrated" class="group flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-xl">
						<Map class="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
						<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 whitespace-nowrap">Integrated Viewer</span>
					</a>
					
					<!-- Regional Science app section -->
					<div class="flex flex-col gap-2">
						<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">Regional Science app</h3>
						<div class="flex flex-col gap-2">
							<a href="/thematic/weather" class="group flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-xl">
								<Cloud class="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
								<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 whitespace-nowrap">Weather</span>
							</a>
							<a href="/thematic/air-quality" class="group flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-xl">
								<Wind class="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
								<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 whitespace-nowrap">AirQuality</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	:global(.map-wrapper .map-container) {
		height: 100% !important;
	}
</style>

