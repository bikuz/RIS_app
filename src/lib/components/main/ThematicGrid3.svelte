<script lang="ts">
	import {
		topicIcons,
		topicDetail,
		getTopicColor,
		selectTopic,
		getTopicName
	} from '$lib/data/themeData';
	import { onMount } from 'svelte';
	import { Mountain, Users, Snowflake, Pentagon } from '@lucide/svelte';

	// Import images from assets
	import climateImg from '$lib/assets/icons/climate.png';
	import ecosystemImg from '$lib/assets/icons/ecosystem.png';
	import humanDimensionImg from '$lib/assets/icons/human_dimension.png';
	import airQualityImg from '$lib/assets/icons/air_quality.png';
	import cryosphereImg from '$lib/assets/icons/cryosphere.png';
	import physiographyImg from '$lib/assets/icons/physio.png';

	// Map topics to their corresponding images
	const topicImages: Record<string, string> = {
		climate: climateImg,
		ecosystem: ecosystemImg,
		'human-dimensions': humanDimensionImg,
		'air-quality': airQualityImg,
		cryosphere: cryosphereImg,
		physiography: physiographyImg
	};
 
	 
</script>

<section class="relative overflow-hidden pt-5 " style="margin-top: -170px;">
	<div class="container mx-auto relative px-4 sm:px-6 lg:px-8">
		<!-- Thematic Cards - Top Row -->
		<div class="mb-10 lg:mb-12">
			<div class="flex flex-col lg:flex-row gap-6 lg:gap-6">
				<!-- Spacer to match left stats column width -->
				<div class="hidden lg:block w-[15%]"></div>
				
				<!-- Thematic Cards - Spans from stats to map -->
				<div class="w-full lg:w-[85%] flex flex-wrap justify-between items-start gap-6 lg:gap-8">
					{#each Object.entries(topicIcons) as [topic, IconComponent]}
						{@const isDisabled = ([] as string[]).includes(topic)}
						<div class="flex flex-col items-center gap-2">
							<button
								onclick={() => !isDisabled && selectTopic(topic)}
								disabled={isDisabled}
								class="group relative block rounded-full aspect-square p-0 transition-all duration-300 ease-out
									border border-gray-200/50 bg-white/80 backdrop-blur-md
									shadow-lg shadow-gray-200/50 w-18 h-18 sm:w-18 sm:h-24 md:w-20 md:h-20
									{!isDisabled
									? 'hover:cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-300/60 hover:border-gray-300/80 hover:-translate-y-1'
									: 'cursor-not-allowed opacity-50'}"
							>
								<div class="flex items-center justify-center h-full">
									{#if topicImages[topic]}
										<img
											src={topicImages[topic]}
											alt={getTopicName(topic)}
											class="w-full h-full object-contain rounded-full transition-all duration-300 group-hover:scale-110"
										/>
									{:else}
										<div
											class="relative rounded-xl bg-gradient-to-br {getTopicColor(
												topic
											)} p-2.5 text-white transition-all duration-300
											shadow-md group-hover:scale-110 group-hover:shadow-lg
											{!isDisabled ? '' : ''}"
										>
											<IconComponent class="h-4 w-4" />
										</div>
									{/if}
								</div>
							</button>
							<h3 class="text-base sm:text-lg text-white transition-colors text-center">
								{getTopicName(topic)}
							</h3>
						</div>
					{/each}
				</div>
			</div>
		</div>

		
</section>

<style>
	:global(.map-wrapper .map-container) {
		height: 100% !important;
	}
</style>

