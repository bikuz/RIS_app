
<script>
    import Map from "./Map.svelte";
</script>
<section class="pt-2 pb-16 px-12 bg-gradient-to-br from-slate-50 to-blue-50">
	<div class="px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-gray-900 mb-4">Interactive Regional Map</h2>
			<p class="text-lg text-gray-600 max-w-3xl mx-auto">
				Explore geospatial datasets across the Hindu Kush Himalaya region with our interactive mapping platform
			</p>
		</div>
		
		<Map/>
		
		<!-- <div class="text-center mt-8">
			<a href="/map" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
				<Map class="w-5 h-5 mr-2" />
				Explore Full Map
			</a>
		</div> -->
	</div>
</section>
