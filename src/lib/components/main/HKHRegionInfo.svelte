<script>
	import { Mountain, Droplets, TreePine, Users, Globe, Thermometer } from '@lucide/svelte';
</script>

<section class="pt-12 pb-16 bg-gradient-to-br from-blue-100 to-green-100 -mt-12">
	<div class="text-center mb-12">
		<h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
			HKH - The Third Pole
		</h2>
		<p class="text-lg text-gray-600 max-w-3xl mx-auto">
			Often called the "Third Pole," the HKH region is home to the world's highest peaks and 
			largest concentration of glaciers outside the polar regions.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 px-16">
		<!-- Geographic Extent -->
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
			<div class="flex items-center space-x-3 mb-4">
				<div class="p-2 bg-blue-100 rounded-lg">
					<Globe class="h-6 w-6 text-blue-600" />
				</div>
				<h3 class="text-xl font-semibold text-gray-800">Geographic Extent</h3>
			</div>
			<div class="space-y-3">
				<div class="flex justify-between">
					<span class="text-gray-600">Total Area:</span>
					<span class="font-semibold">4.3M km²</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Countries:</span>
					<span class="font-semibold">8 Nations</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Elevation Range:</span>
					<span class="font-semibold">200-8,848m</span>
				</div>
			</div>
		</div>

		<!-- Water Resources -->
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
			<div class="flex items-center space-x-3 mb-4">
				<div class="p-2 bg-cyan-100 rounded-lg">
					<Droplets class="h-6 w-6 text-cyan-600" />
				</div>
				<h3 class="text-xl font-semibold text-gray-800">Water Tower</h3>
			</div>
			<div class="space-y-3">
				<div class="flex justify-between">
					<span class="text-gray-600">Glaciers:</span>
					<span class="font-semibold">54,000+</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">River Basins:</span>
					<span class="font-semibold">12 Major</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Water Supply:</span>
					<span class="font-semibold">2B People</span>
				</div>
			</div>
		</div>

		<!-- Biodiversity -->
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
			<div class="flex items-center space-x-3 mb-4">
				<div class="p-2 bg-green-100 rounded-lg">
					<TreePine class="h-6 w-6 text-green-600" />
				</div>
				<h3 class="text-xl font-semibold text-gray-800">Biodiversity</h3>
			</div>
			<div class="space-y-3">
				<div class="flex justify-between">
					<span class="text-gray-600">Hotspots:</span>
					<span class="font-semibold">4 Global</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Endemic Species:</span>
					<span class="font-semibold">1000+</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Forest Cover:</span>
					<span class="font-semibold">40.6%</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Regional Map Visualization -->
	<!-- <div class="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
			<div>
				<h3 class="text-2xl font-bold mb-4">Countries in the HKH Region</h3>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>Afghanistan</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>Bangladesh</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>Bhutan</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>China</span>
						</div>
					</div>
					<div class="space-y-2">
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>India</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>Myanmar</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>Nepal</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-white rounded-full"></div>
							<span>Pakistan</span>
						</div>
					</div>
				</div>
			</div>
			<div class="text-center">
				<Mountain class="h-32 w-32 mx-auto mb-4 text-white/80" />
				<p class="text-lg text-white/90">
					The world's highest mountain range, spanning 3,500 km across Asia
				</p>
			</div>
		</div>
	</div> -->
</section>
