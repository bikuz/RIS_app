<script lang="ts">
	import {
		topicIcons,
		topicDetail,
		getTopicColor,
		selectTopic,
		getTopicName
	} from '$lib/data/themeData';
</script>

<section class="relative overflow-hidden py-6 pt-10">
	<div class="absolute inset-0 "></div>
	<div class="relative px-4 sm:px-6 lg:px-8">
		<!-- <div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold text-gray-900">Thematic Categories</h2>
			<p class="mx-auto max-w-4xl text-xl text-gray-600">
				Explore comprehensive data and insights across key thematic areas of the HKH region
			</p>
		</div> -->

		<!-- Removed cards, using flat design with hover effects -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
			<!-- {#each thematicAreas as area}
				<a 
					href={area.href}
					class="group block p-8 hover:bg-gray-50 transition-all duration-300 rounded-lg"
				>
					<div class="flex flex-col items-center text-center space-y-4">
						<div class="p-4 rounded-full bg-gradient-to-r {getTopicColor(area.name)} text-white transition-colors">
						 
						</div>
						<h3 class="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
							{area.name}
						</h3>
						<p class="text-gray-600 leading-relaxed">
							{area.description}
						</p>
					</div>
				</a>
			{/each} -->

			{#each Object.entries(topicIcons) as [topic, IconComponent]}
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
			{/each}
		</div>
	</div>
</section>
