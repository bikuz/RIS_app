<script lang="ts">
	import { topicIcons, getTopicColor, selectTopic, getTopicName } from '$lib/data/themeData';

	import climateImg from '$lib/assets/icons/climate.png';
	import ecosystemImg from '$lib/assets/icons/ecosystem.png';
	import humanDimensionImg from '$lib/assets/icons/human_dimension.png';
	import airQualityImg from '$lib/assets/icons/air_quality.png';
	import cryosphereImg from '$lib/assets/icons/cryosphere.png';
	import physiographyImg from '$lib/assets/icons/physio.png';
	import disasterImg from '$lib/assets/icons/air_quality.png';

	const topicImages: Record<string, string> = {
		climate: climateImg,
		ecosystem: ecosystemImg,
		'human-dimensions': humanDimensionImg,
		'air-quality': airQualityImg,
		cryosphere: cryosphereImg,
		physiography: physiographyImg,
		disaster: disasterImg
	};
</script>

<section
	class="relative mt-0 overflow-hidden bg-gradient-to-r from-blue-800 to-green-800 pt-5 pb-6 lg:-mt-[170px] lg:[background:none] lg:pb-0"
>
	<div class="relative container mx-auto px-4 sm:px-6 lg:px-8">
		<div class="mb-10 lg:mb-12">
			<div class="flex flex-col gap-6 lg:flex-row">
				<div class="hidden w-[15%] lg:block"></div>

				<div
					class="flex w-full flex-wrap items-start justify-center gap-6 lg:w-[85%] lg:justify-between lg:gap-8"
				>
					{#each Object.entries(topicIcons) as [topic, IconComponent]}
						<div class="flex flex-col items-center gap-2">
							<button
								onclick={() => selectTopic(topic)}
								class="group relative block aspect-square rounded-full border border-gray-200/50 bg-white/80 p-0 shadow-lg shadow-gray-200/50 backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.02] hover:border-gray-300/80 hover:shadow-2xl hover:shadow-gray-300/60 hover:-translate-y-1 h-18 w-18 sm:h-24 sm:w-18 md:h-20 md:w-20"
							>
								<div class="flex h-full items-center justify-center">
									{#if topicImages[topic]}
										<img
											src={topicImages[topic]}
											alt={getTopicName(topic)}
											class="h-full w-full rounded-full object-contain transition-all duration-300 group-hover:scale-110"
										/>
									{:else}
										<div
											class="relative rounded-xl bg-gradient-to-br {getTopicColor(
												topic
											)} p-2.5 text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
										>
											<IconComponent class="h-4 w-4" />
										</div>
									{/if}
								</div>
							</button>
							<h3 class="text-center text-base text-white transition-colors sm:text-lg">
								{getTopicName(topic)}
							</h3>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
