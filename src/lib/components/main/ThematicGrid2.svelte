<script lang="ts">
	import {
		topicIcons,
		topicDetail,
		getTopicColor,
		selectTopic,
		getTopicName
	} from '$lib/data/themeData';
	import { onMount } from 'svelte';
	import { Mountain, Users, Snowflake, Trees, Pentagon } from '@lucide/svelte';

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
			value: '4.3M km²',
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
		},
		{
			icon: Trees,
			value: '841850 km²',
			label: 'Forest area'
		}
	];
</script>

<section class="relative overflow-hidden py-12 pt-10 bg-gradient-to-br from-gray-50 to-white">
	<div class="container mx-auto relative px-4 sm:px-6 lg:px-8">
		<!-- Title Section - Spans full width above columns -->
		<div class="mb-8 text-center">
			<!-- <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hi-RIS: HKH Regional Information System</h2> -->
			<p class="text-base md:text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
				The HKH Regional Information System (Hi-RIS) is a comprehensive platform that integrates, processes, and disseminates critical information about the Hindu Kush Himalaya region. Our mission is to support evidence-based decision-making through accessible, reliable, and timely regional data across multiple thematic areas.
			</p>
		</div>

		<div class="flex flex-col lg:flex-row gap-6 lg:gap-6">
			<!-- Left Column: Thematic Cards (Vertical) -->
			<div class="w-full lg:w-[15%] h-64 sm:h-80 md:h-96 lg:h-[600px]">
				<div class="flex flex-col gap-2 h-full justify-between">
					{#each Object.entries(topicIcons) as [topic, IconComponent]}
						{@const isDisabled = ([] as string[]).includes(topic)}
						<button
							onclick={() => !isDisabled && selectTopic(topic)}
							disabled={isDisabled}
							class="group relative block rounded-xl p-3 transition-all duration-300 ease-out
								border border-gray-200/50 bg-white/80 backdrop-blur-md
								shadow-lg shadow-gray-200/50 flex-1
								{!isDisabled
								? 'hover:cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-300/60 hover:border-gray-300/80 hover:-translate-y-1'
								: 'cursor-not-allowed opacity-50'}"
						>
							<div class="flex flex-col items-center justify-center space-y-1.5 text-center h-full">
								<div
									class="relative rounded-xl bg-gradient-to-br {getTopicColor(
										topic
									)} p-2.5 text-white transition-all duration-300
									shadow-md group-hover:scale-110 group-hover:shadow-lg
									{!isDisabled ? '' : ''}"
								>
									<IconComponent class="h-4 w-4" />
								</div>
								<h3 class="text-sm font-semibold text-gray-800 transition-colors group-hover:text-gray-900">
									{getTopicName(topic)}
								</h3>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Center Column: Map -->
			<div class="w-full lg:w-[70%]">
				<div class="rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/50 border border-gray-200/50">
					{#if Map3D}
						<Map3D />
					{/if}
				</div>
			</div>

			<!-- Right Column: Stats (Vertical) -->
			<div class="w-full lg:w-[15%] h-64 sm:h-80 md:h-96 lg:h-[600px]">
				<div class="flex flex-col gap-2 h-full justify-between">
					{#each stats as stat}
						<div class="text-center flex-1 flex flex-col items-center justify-center">
							<div class="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-1.5 bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
								<stat.icon class="h-4 w-4 text-white" />
							</div>
							<div class="text-lg font-bold text-gray-900 mb-1">{stat.value}</div>
							<div class="text-xs font-medium text-gray-600 capitalize">{stat.label}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

