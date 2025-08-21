<script>
	import { Map, ChartBar, ChevronsLeft, Cloud, Layers } from '@lucide/svelte';
	import climate_1 from '$lib/assets/images/climate_1.png';
	import climate_2 from '$lib/assets/images/climate_2.png';

	import { getTopicName, getTopicIcon, getTopicColor } from '$lib/data/themeData.js';
	import DisplaySection from '$lib/components/DisplaySection.svelte';
	const topic = 'weather';
	const TopicIcon = getTopicIcon(topic);

	let layoutState = $state('default');
</script>

<div class="relative grid grid-cols-1 gap-6 xl:grid-cols-16">
	<div class="xl:col-span-4">
		<div class="sticky top-8 rounded-2xl border border-slate-200/50 bg-white/70 p-6">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="rounded-lg bg-gradient-to-r {getTopicColor(topic)} p-2">
						<TopicIcon class="h-5 w-5 text-white" />
					</div>
					<h3
						class="{layoutState === 'left-full'
							? 'text-2xl'
							: 'text-lg'} font-bold text-slate-800 transition-all duration-300"
					>
						Climate Change in HKH
					</h3>
				</div>
				<div class="flex items-center space-x-2">
					{#if layoutState !== 'left-full'}
						<!-- Hide Left Panel Button -->
						<button
							class="rounded-lg border border-slate-200 bg-white/50 p-1.5 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800"
							title="Hide Story Panel"
						>
							<ChevronsLeft class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>

			<div
				class="{layoutState === 'left-full'
					? 'space-y-6'
					: 'space-y-4'} transition-all duration-300"
			>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-700 transition-all duration-300"
				>
					Historically, the climate of the HKH has experienced significant changes that are closely
					related to the rise and fall of regional cultures and civilizations. The region is one of
					the most climate-sensitive mountain systems in the world. Known as the "Third Pole" for
					its vast ice reserves, the HKH plays a critical role in regulating Asia's climate and
					serves as the source of ten major river systems that sustain the livelihoods of over 1.6
					billion people downstream. However, the impacts of climate change are being felt here more
					intensely than the global average, with temperatures rising significantly faster than
					elsewhere.
				</p>

				<!-- First Image - After first paragraph -->
				{#if layoutState === 'left-full'}
					<div class="flex justify-center">
						<div
							class="w-fit overflow-hidden rounded-xl border border-slate-200/50 bg-white/50 shadow-lg"
						>
							<img src={climate_1} alt="Himalayan glacial retreat" class="h-80 object-contain" />
							<div class="p-4">
								<p class="text-center text-sm leading-relaxed text-slate-700">
									<span
										>We see <span class="font-semibold text-slate-800"
											>less snow on the mountain peaks
										</span> in recent years
									</span>
								</p>
							</div>
						</div>
					</div>
				{:else}
					<div class="overflow-hidden rounded-lg border border-slate-200/50 bg-white/50">
						<img
							src={climate_1}
							alt="Himalayan glacial retreat"
							class="h-50 w-full object-contain"
						/>
						<div class="p-2">
							<p class="text-center text-xs text-slate-600">
								<span
									>We see <span class="font-semibold">less snow on the mountain peaks </span> in recent
									years
								</span>
							</p>
						</div>
					</div>
				{/if}

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					In the future, even if global warming is kept to 1.5 °C, warming in the Hindu Kush
					Himalaya (HKH) region will likely be at least 0.3 °C higher, and in the northwest Himalaya
					and Karakoram at least 0.7 °C higher. Such large warming could trigger a multitude of
					biophysical and socio-economic impacts, such as biodiversity loss, increased glacial
					melting, and less predictable water availability—all of which will impact livelihoods and
					well-being in the HKH.
				</p>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Glaciers in the HKH are retreating at unprecedented rates, snow cover is diminishing, and
					permafrost is degrading, all of which are altering river flows and threatening water
					security.
				</p>

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Climate change is also amplifying the frequency and severity of extreme weather events,
					including floods, droughts, and landslides, which pose immediate risks to lives,
					infrastructure, and economies. The loss of cryospheric mass not only threatens long-term
					water availability but also increases the risk of glacial lake outburst floods (GLOFs)
					that can devastate downstream communities.
				</p>
				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					The impacts extend beyond the physical environment to agriculture, biodiversity, and
					cultural heritage. Shifts in seasonal patterns are affecting crop yields, while warming
					temperatures are pushing species to higher altitudes, disrupting delicate alpine
					ecosystems. Many communities in the HKH rely on climate-sensitive livelihoods such as
					farming, herding, and tourism, making them particularly vulnerable.
				</p>

				<!-- Second Image - Before last paragraph -->
				{#if layoutState === 'left-full'}
					<div class="flex justify-center">
						<div
							class="w-fit overflow-hidden rounded-xl border border-slate-200/50 bg-white/50 shadow-lg"
						>
							<img src={climate_2} alt="Climate impacts" class="h-80 object-contain" />
							<div class="p-4">
								<p class="text-center text-sm leading-relaxed text-slate-700">
									<span>
										<span class="font-semibold text-slate-800"> Flooded street in Kathmandu </span> after
										a less than an hour heavy downpour</span
									>
								</p>
							</div>
						</div>
					</div>
				{:else}
					<div class="overflow-hidden rounded-lg border border-slate-200/50 bg-white/50">
						<img src={climate_2} alt="Climate impacts" class="h-55 w-full object-contain" />
						<div class="p-2">
							<p class="text-center text-xs text-slate-600">
								<span>
									<span class="font-semibold"> Flooded street in Kathmandu </span> after a less than
									an hour heavy downpour</span
								>
							</p>
						</div>
					</div>
				{/if}

				<p
					class="text-justify {layoutState === 'left-full'
						? 'text-base leading-loose'
						: 'text-sm leading-relaxed'} text-slate-600 transition-all duration-300"
				>
					Addressing climate change in the HKH requires urgent, coordinated, and region-wide action.
					This includes investing in climate-resilient infrastructure, expanding early warning
					systems, improving water management, and enhancing scientific monitoring of glaciers and
					weather patterns. Regional cooperation is essential for sharing data, aligning adaptation
					strategies, and managing shared water resources sustainably. Equally important is
					empowering local communities with knowledge, technology, and resources to adapt to
					changing conditions while preserving the environmental and cultural richness of the HKH.
				</p>
			</div>
		</div>
	</div>

	<div class="xl:col-span-9">
		<div class="sticky top-8 rounded-2xl border border-slate-200/50 bg-white/70 p-6">
			<div
				class="mb-6 overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm"
			>
				<!-- Map section -->
				<div
					class="flex h-96 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
				>
					<div class="text-center">
						<div
							class="mx-auto mb-4 w-fit rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 p-4"
						>
							<svelte:component this={Map} class="h-12 w-12 text-white" />
						</div>
						<p class="font-medium text-slate-600">Interactive map will be displayed here</p>
					</div>
				</div>
			</div>

			<!-- Chart section -->
			<div
				class="mb-6 overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm"
			>
				<div
					class="flex h-96 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
				>
					<div class="text-center">
						<div
							class="mx-auto mb-4 w-fit rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-4"
						>
							<svelte:component this={ChartBar} class="h-12 w-12 text-white" />
						</div>
						<p class="font-medium text-slate-600">Interactive chart will be displayed here</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="xl:col-span-3">
		<div class="sticky top-8 rounded-2xl border border-slate-200/50 bg-white/70 p-6">
			<div class="mb-4 flex flex-shrink-0 items-center space-x-3">
				<div class="rounded-lg bg-gradient-to-r {getTopicColor(topic)} p-2">
					<Layers class="h-5 w-5 text-white" />
				</div>
				<h3 class="text-lg font-bold text-slate-800">Information Layer</h3>
			</div>

			<div class="flex-1 overflow-y-auto">
				<div class="space-y-3">
					<button
						class="w-full rounded-lg border border-blue-500 bg-blue-50 p-4 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-md"
						><div class="flex items-start space-x-3 text-left">
							<div class="flex-1">
								<h4 class="text-sm font-medium text-blue-700">Population 2025</h4>
							</div>
						</div></button
					><button
						class="w-full rounded-lg border border-slate-200/50 bg-white/50 p-4 backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-md hover:shadow-sm"
						><div class="flex items-start space-x-3 text-left">
							<div class="flex-1">
								<h4
									class="text-sm font-medium text-slate-600 group-hover:text-slate-800"
								>
									Sex Ratio 2025
								</h4>
							</div>
						</div></button
					><button
						class="w-full rounded-lg border border-slate-200/50 bg-white/50 p-4 backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-md hover:shadow-sm"
						><div class="flex items-start space-x-3 text-left">
							<div class="flex-1">
								<h4
									class="text-sm font-medium text-slate-600 group-hover:text-slate-800"
								>
									Proportion of Age &gt;=75
								</h4>
							</div>
						</div></button
					>
				</div>
				<!---->
			</div>
		</div>
	</div>
</div>
