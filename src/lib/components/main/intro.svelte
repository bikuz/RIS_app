<script lang="ts">
	import {  Mountain, Globe, Users, Snowflake, Trees, Shield, MapPin, Waves } from '@lucide/svelte';
	import { onMount } from 'svelte';

	// import Map from './Map.svelte';
	let Map3D: any=$state();

	onMount(async () => {
		const module = await import('./Map.svelte');
		Map3D = module.default;
	});
	
	const stats = [
    // {
    //   icon: Mountain,
    //   value: "4.3M km²",
    //   label: "Total area",
    //   color: "from-amber-500 to-orange-600",
    //   bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
    // },
    {
      icon: Globe,
      value: "200-8,838 m",
      label: "Elevation range",
      color: "from-emerald-500 to-green-600",
    //   bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
	bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    },
    {
      icon: Users,
      value: "240M",
      label: "Population",
      color: "from-violet-500 to-purple-600",
    //   bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
	bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    },
	
    {
      icon: Snowflake,
      value: "2,548",
      label: "Glaciers",
      color: "from-cyan-500 to-blue-600",
    //   bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
	bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    },
    {
      icon: Waves,
      value: "4,587 km²",
      label: "Glacier area",
      color: "from-sky-500 to-blue-600",
    //   bgColor: "bg-gradient-to-br from-sky-50 to-blue-50",
	bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    },
    // {
    //   icon: Snowflake,
    //   value: "9,845",
    //   label: "Snow cover",
    //   color: "from-slate-500 to-gray-600",
    // //   bgColor: "bg-gradient-to-br from-slate-50 to-gray-50",
	// bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    // },
	{
      icon: Globe,
      value: "200-8,838 m",
      label: "Elevation range",
      color: "from-amber-500 to-orange-600",
    //   bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
	bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    },
    // {
    //   icon: Mountain,
    //   value: "4,628",
    //   label: "Ice reserves",
    //   color: "from-indigo-500 to-blue-600",
    //   bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
    // },
    {
      icon: Trees,
      value: "861,350 km²",
      label: "Forest area",
      color: "from-green-500 to-emerald-600",
    //   bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
	bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    },
    {
      icon: Shield,
      value: "926,125 km²",
      label: "Protected area",
      color: "from-teal-500 to-cyan-600",
      bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
    },
  ]

  const topRowStats = $derived(stats.slice(0, 4))
  const leftColumnStats = $derived(stats.slice(4))
</script>

<section class="relative pt-16 pb-24 bg-gradient-to-br from-blue-200 to-green-200 ">
	<div class="container mx-auto px-8">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
				HKH at a glance
			</h2>
			<p class="text-lg text-gray-600 max-w-6xl mx-auto leading-relaxed">
				Often called the "Third Pole," the HKH region is home to the world's highest peaks and 
			largest concentration of glaciers outside the polar regions.
			</p>
		</div>

		<div class="space-y-8">
			<!-- <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each topRowStats as stat, index}
				  <div
					class="{stat.bgColor} rounded-2xl p-6 border border-white/50 backdrop-blur-sm group"
				  >
				 
					<div class="flex items-center gap-4">
					  <div
						class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br {stat.color} rounded-xl shadow-lg flex-shrink-0"
					  >
						<stat.icon class="h-7 w-7 text-white" />
					  </div>
					  <div>
						<div class="text-2xl lg:text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
						<div class="text-sm font-medium text-slate-600 capitalize">{stat.label}</div>
					  </div>
					</div>
				  </div>
				{/each}
			</div> -->
		
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
				<div class="col-span-1">
					<div class="space-y-4">
						{#each leftColumnStats as stat, index}
						  <div
							class="{stat.bgColor} rounded-2xl p-5 border border-white/50 backdrop-blur-sm group"
						  >
							<!-- Changed to vertical layout: icon at top, text at bottom -->
							<div class="text-center">
							  <div
								class="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br {stat.color} rounded-xl shadow-lg mb-3"
							  >
								<stat.icon class="h-6 w-6 text-white" />
							  </div>
							  <div class="text-xl font-bold text-slate-800 mb-1">{stat.value}</div>
							  <div class="text-sm font-medium text-slate-600 capitalize">{stat.label}</div>
							</div>
						  </div>
						{/each}
					  </div>
				</div>
				<div class="lg:col-span-5">
					<div class="space-y-4">
						<!-- <Map/> -->
						{#if Map3D}
							<svelte:component this={Map3D} />
						{/if}
					</div>
				</div>
			</div>
			  
		</div>

		<!-- <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center mb-12">
			
			<div class="col-span-1 rounded-xl p-8">
				<div class="grid grid-cols-3 gap-6">
                   
                    <div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-lg mb-3">
							<Pentagon class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">4.3M km²</div>
						<div class="text-sm text-gray-600">Total area</div>
					</div>
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-3">
							<Globe class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">200-8,838 m</div>
						<div class="text-sm text-gray-600">Elevation range</div>
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
						<div class="text-2xl font-bold text-gray-800">2548</div>
						<div class="text-sm text-gray-600">Glaciers</div>
					</div>
					
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3">
							<Database class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">4587 km²
						</div>
						<div class="text-sm text-gray-600">Glacier area</div>
					</div>
					 
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3">
							<Database class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">9845
						</div>
						<div class="text-sm text-gray-600">Snow cover</div>
					</div>
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3">
							<Database class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">4628
						</div>
						<div class="text-sm text-gray-600">Ice reserves</div>
					</div>
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3">
							<Database class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">861350 km²
						</div>
						<div class="text-sm text-gray-600">Forest area</div>
					</div>
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3">
							<Database class="h-6 w-6 text-white" />
						</div>
						<div class="text-2xl font-bold text-gray-800">926125 km²
						</div>
						<div class="text-sm text-gray-600">Protected area</div>
					</div>
				</div>
			</div>

			<div class=" col-span-2 space-y-6">
				 
				<Map/>
			</div>
			
			
		</div> -->
	</div>
</section>
