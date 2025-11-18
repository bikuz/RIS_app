<script lang="ts">
	import {
		topicIcons,
		topicDetail,
		getTopicColor,
		selectTopic,
		getTopicName
	} from '$lib/data/themeData';
</script>

<section class="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-300 py-6 pt-0">
	<div class="absolute inset-0 bg-black/20"></div>
	<div class="relative px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col lg:flex-row gap-6 lg:gap-8">
			<!-- Left Column: 20% - HKH Regional Information System Text -->
			<div class="w-full thematic-left-col flex items-center">
				<div class="text-white">
					<!-- <h2 class="text-2xl md:text-3xl font-bold mb-4">HKH Regional Information System</h2> -->
					<p class="text-base md:text-lg leading-relaxed text-white/90">
						Hi-RIS is a comprehensive platform that integrates, processes, and disseminates critical information 
				about the Hindu Kush Himalaya region. 
					</p>
				</div>
			</div>

			<!-- Right Column: 80% - Thematic Cards -->
			<div class="w-full thematic-right-col">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<!-- {#each Object.entries(topicIcons) as [topic, IconComponent]}
						{@const isDisabled = ([] as string[]).includes(topic)}
						<button
							onclick={() => !isDisabled && selectTopic(topic)}
							disabled={isDisabled}
							class="group block rounded-lg p-4 transition-all duration-300
								{!isDisabled
								? 'bg-white/40 hover:cursor-pointer hover:bg-white/60 hover:shadow-xl backdrop-blur-sm'
								: 'cursor-not-allowed bg-white/20 opacity-60'}"
						>
							<div class="flex flex-col items-center space-y-2 text-center">
								<div
									class="rounded-full bg-gradient-to-r p-3 {getTopicColor(
										topic
									)} text-white transition-colors
										{!isDisabled ? 'transition-shadow duration-300 group-hover:shadow-xl' : ''}"
								>
									<IconComponent class="h-4 w-4" />
								</div>
								<h3 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-gray-700">
									{getTopicName(topic)}
								</h3>
								<p class="text-sm leading-tight text-gray-700">
									{topicDetail[topic as keyof typeof topicDetail]}
								</p>
							</div>
						</button>
					{/each} -->
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@media (min-width: 1024px) {
		:global(.thematic-left-col) {
			flex: 0 0 30% !important;
			max-width: 30% !important;
		}
		:global(.thematic-right-col) {
			flex: 0 0 70% !important;
			max-width: 70% !important;
		}
	}
</style>
