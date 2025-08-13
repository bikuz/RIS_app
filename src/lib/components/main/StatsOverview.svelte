<script>
	import { TrendingUp, Database, Globe, Users } from '@lucide/svelte';
	
	const stats = [
		{
			icon: Globe,
			value: '4.3M',
			label: 'Square Kilometers',
			description: 'Total HKH region area'
		},
		{
			icon: Users,
			value: '240M',
			label: 'Population',
			description: 'People living in the region'
		},
		{
			icon: Database,
			value: '1000+',
			label: 'Datasets',
			description: 'Available data sources'
		},
		{
			icon: TrendingUp,
			value: '24/7',
			label: 'Monitoring',
			description: 'Real-time data collection'
		}
	];
</script>

<section class="py-16 bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Converted from cards to flat design with clean spacing -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
			{#each stats as stat}
				<div class="text-center group">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 group-hover:bg-blue-700 transition-colors">
						<stat.icon class="h-8 w-8 text-white" />
					</div>
					<div class="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
					<div class="text-lg font-semibold text-gray-700 mb-1">{stat.label}</div>
					<div class="text-sm text-gray-500">{stat.description}</div>
				</div>
			{/each}
		</div>
	</div>
</section>
