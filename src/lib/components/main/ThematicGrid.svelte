<script lang="ts">
	import {
		topicIcons,
		topicDetail,
		getTopicColor,
		selectTopic,
		getTopicName
	} from '$lib/data/themeData';
</script>

<section class="bg-white py-16">
	<div class=" px-4 sm:px-6 lg:px-8">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold text-gray-900">Thematic Categories</h2>
			<p class="mx-auto max-w-4xl text-xl text-gray-600">
				Explore comprehensive data and insights across key thematic areas of the HKH region
			</p>
		</div>

		<!-- Removed cards, using flat design with hover effects -->
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-7">
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
				{@const isDisabled = [].includes(topic)}
				<button
					onclick={() => !isDisabled && selectTopic(topic)}
					disabled={isDisabled}
					class="group block rounded-lg p-8 transition-all duration-300
						{!isDisabled
						? 'bg-gradient-to-br from-gray-100 to-blue-50 hover:cursor-pointer hover:bg-gray-100 hover:shadow-lg'
						: 'cursor-not-allowed bg-gray-100/50 opacity-60'}"
				>
					<div class="flex flex-col items-center space-y-4 text-center">
						<div
							class="rounded-full bg-gradient-to-r p-4 {getTopicColor(
								topic
							)} text-white transition-colors
								{!isDisabled ? 'transition-shadow duration-300 group-hover:shadow-xl' : ''}"
						>
							<IconComponent class="h-5 w-5" />
						</div>
						<h3 class="text-xl font-bold text-gray-900 transition-colors group-hover:text-gray-700">
							{getTopicName(topic)}
						</h3>
						<p class="leading-relaxed text-gray-600">
							{topicDetail[topic as keyof typeof topicDetail]}
						</p>
					</div>
				</button>
			{/each}
		</div>
	</div>
</section>
