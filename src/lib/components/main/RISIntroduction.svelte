<script>
	import { Database, Globe, TrendingUp, Users, Pentagon, Shield, Zap } from '@lucide/svelte';
</script>

<section class="pt-4 pb-12 ">
	<div class="max-w-6xl mx-auto px-8">
		<div class="text-center mb-12">
			<!-- <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
				What is Regional Information Services (RIS)?
			</h2> -->
			<!-- <p class="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
				RIS is a comprehensive platform that integrates, processes, and disseminates critical information 
				about the Hindu Kush Himalaya region. Our mission is to support evidence-based decision-making 
				through accessible, reliable, and timely regional data.
			</p> -->
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
			<div class="space-y-6">
				<h3 class="text-3xl font-bold text-gray-800">HKH at a glance</h3>
				<p class="text-gray-600 leading-relaxed">
                    RIS is a comprehensive platform that integrates, processes, and disseminates critical information 
				    about the Hindu Kush Himalaya region. Our mission is to support evidence-based decision-making 
				    through accessible, reliable, and timely regional data.
                </p>    
                <p class="text-gray-600 leading-relaxed">
					The Hindu Kush Himalaya region faces unprecedented challenges from climate change, 
					population growth, and environmental degradation. RIS serves as a central hub for 
					monitoring, analyzing, and sharing critical information that helps governments, 
					researchers, and communities make informed decisions.
				</p>
				<!-- <div class="space-y-4">
					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
							<div class="w-2 h-2 bg-blue-600 rounded-full"></div>
						</div>
						<div>
							<h4 class="font-semibold text-gray-800">Data Integration</h4>
							<p class="text-sm text-gray-600">Combining multiple data sources for comprehensive insights</p>
						</div>
					</div>
					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
							<div class="w-2 h-2 bg-green-600 rounded-full"></div>
						</div>
						<div>
							<h4 class="font-semibold text-gray-800">Real-time Monitoring</h4>
							<p class="text-sm text-gray-600">Continuous tracking of environmental and social indicators</p>
						</div>
					</div>
					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
							<div class="w-2 h-2 bg-purple-600 rounded-full"></div>
						</div>
						<div>
							<h4 class="font-semibold text-gray-800">Knowledge Sharing</h4>
							<p class="text-sm text-gray-600">Making complex data accessible to diverse stakeholders</p>
						</div>
					</div>
				</div> -->
			</div>
			
			<div class="bg-gradient-to-br from-blue-100 to-green-100 rounded-xl p-8">
				<div class="grid grid-cols-2 gap-6">
                    <div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-3">
							<Globe class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">8</div>
						<div class="text-sm text-gray-600">Countries</div>
					</div>
                    <div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-lg mb-3">
							<Pentagon class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">4.3M</div>
						<div class="text-sm text-gray-600">Square Kilometers</div>
					</div>
                    <div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-lg mb-3">
							<Users class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">240M</div>
						<div class="text-sm text-gray-600">Population</div>
					</div>
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3">
							<Database class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">1000+</div>
						<div class="text-sm text-gray-600">Data Sources</div>
					</div>
					
					
					 
				</div>
			</div>
		</div>
	</div>
</section>
