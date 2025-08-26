<script lang="ts">
	import { topicIcons, topicDetail, getTopicColor,selectTopic, getTopicName } from '$lib/data/themeData';

	
</script>

<section class="py-16 bg-white">
	<div class=" px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-gray-900 mb-4">
				Thematic Categories
			</h2>
			<p class="text-xl text-gray-600 max-w-4xl mx-auto">
				Explore comprehensive data and insights across key thematic areas of the HKH region
			</p>
		</div>
		
		<!-- Removed cards, using flat design with hover effects -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-7 gap-8 ">
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
                {@const isDisabled = ['weather', 'physiography', 'air-quality'].includes(topic)}
                <button 
                onclick={() => !isDisabled && selectTopic(topic)}
                disabled={isDisabled}
                class="group block p-8 transition-all duration-300 rounded-lg 
						{!isDisabled 
							? 'bg-gradient-to-br from-gray-100 to-blue-50 hover:bg-gray-100 hover:shadow-lg hover:cursor-pointer' 
							: 'bg-gray-100/50 cursor-not-allowed opacity-60'}"
            >
                <div class="flex flex-col items-center text-center space-y-4">
                    <div class="p-4 rounded-full bg-gradient-to-r {getTopicColor(topic)} text-white transition-colors
								{!isDisabled ? 'group-hover:shadow-xl transition-shadow duration-300' : ''}">
                        <IconComponent
                        class="h-5 w-5"
                    />
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {getTopicName(topic)}
                    </h3>
                    <p class="text-gray-600 leading-relaxed">
                        {topicDetail[topic as keyof typeof topicDetail]}
                    </p>
                </div>
				 
				</button>
            {/each}
		</div>
	</div>
</section>
