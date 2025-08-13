<script>
	import { topicIcons, thematicAreas, getTopicColor,getTopicIcon } from '$lib/data/themeData';

	// const thematicAreas = [
	// 	{
	// 		name: getTopicName('climate'),
	// 		href: '/thematic/climate',
	// 		icon: Thermometer,
	// 		description: 'Temperature trends, precipitation patterns, and climate change indicators',
	// 		color: getTopicColor('climate'),
	// 		hoverColor: 'hover:bg-orange-600'
	// 	},
	// 	{
	// 		name: 'Demography',
	// 		href: '/thematic/demography',
	// 		icon: Users,
	// 		description: 'Population dynamics, migration patterns, and socio-economic indicators',
	// 		color: 'bg-purple-500',
	// 		hoverColor: 'hover:bg-purple-600'
	// 	},
	// 	{
	// 		name: 'Ecosystem',
	// 		href: '/thematic/ecosystem',
	// 		icon: TreePine,
	// 		description: 'Biodiversity, forest cover, and ecosystem health monitoring',
	// 		color: 'bg-green-500',
	// 		hoverColor: 'hover:bg-green-600'
	// 	},
	// 	{
	// 		name: 'Cryosphere',
	// 		href: '/thematic/cryosphere',
	// 		icon: Snowflake,
	// 		description: 'Glacial dynamics, snow cover, and ice mass balance studies',
	// 		color: 'bg-blue-500',
	// 		hoverColor: 'hover:bg-blue-600'
	// 	},
	// 	{
	// 		name: 'Weather',
	// 		href: '/thematic/weather',
	// 		icon: Cloud,
	// 		description: 'Real-time weather data, forecasting, and meteorological analysis',
	// 		color: 'bg-yellow-500',
	// 		hoverColor: 'hover:bg-yellow-600'
	// 	},
	// 	{
	// 		name: 'Physiography',
	// 		href: '/thematic/physiography',
	// 		icon: Mountain,
	// 		description: 'Topography, landforms, and geomorphological characteristics',
	// 		color: 'bg-gray-500',
	// 		hoverColor: 'hover:bg-gray-600'
	// 	},
	// 	{
	// 		name: 'Air Quality',
	// 		href: '/thematic/air-quality',
	// 		icon: Wind,
	// 		description: 'Air pollution monitoring, atmospheric composition, and quality indices',
	// 		color: 'bg-red-500',
	// 		hoverColor: 'hover:bg-red-600'
	// 	}
	// ];
</script>

<section class="py-16 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-gray-900 mb-4">
				Thematic Categories
			</h2>
			<!-- <p class="text-xl text-gray-600 max-w-3xl mx-auto">
				Explore comprehensive data and insights across seven key thematic areas of the HKH region
			</p> -->
		</div>
		
		<!-- Removed cards, using flat design with hover effects -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each thematicAreas as area}
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
			{/each}

            <!-- {#each Object.entries(topicIcons) as [topic, IconComponent]}
                <a 
                href='#'
                class="group block p-8 hover:bg-gray-50 transition-all duration-300 rounded-lg"
            >
                <div class="flex flex-col items-center text-center space-y-4">
                    <div class="p-4 rounded-full bg-gradient-to-r {getTopicColor(topic)} text-white transition-colors">
                        <svelte:component
                        this={IconComponent}
                        class="h-5 w-5"
                    />
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {topic}
                    </h3>
                    <p class="text-gray-600 leading-relaxed">
                        {topic}
                    </p>
                </div>
            </a>
            {/each} -->
		</div>
	</div>
</section>
