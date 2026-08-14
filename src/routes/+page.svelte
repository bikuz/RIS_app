<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowUpRight, Mountain, MoonStar, Pentagon, Snowflake } from '@lucide/svelte';
	import { base } from '$app/paths';
	import TopNav from '$lib/components/TopNav.svelte';
	import SectionEyebrow from '$lib/components/SectionEyebrow.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import LayerPill from '$lib/components/LayerPill.svelte';
	import ResourceRail from '$lib/components/ResourceRail.svelte';
	import type { Component } from 'svelte';

	// The 3D globe pulls in @arcgis/core, so it's lazy-loaded client-side only,
	// matching the previous IntroMap.svelte behaviour.
	let Map3D: Component | undefined = $state();
	onMount(() => {
		import('$lib/components/main/Map.svelte').then((module) => {
			Map3D = module.default;
		});
	});

	// Bound instance of the (dynamically loaded) map component, used to drive
	// the layer pills below the map from its real layer-visibility state.
	let mapInstance: { toggleLayer: (name: string) => void; layerVisibility: Record<string, boolean> } | undefined =
		$state();
</script>

<svelte:head>
	<title>Regional Information Services - HKH Region</title>
	<meta
		name="description"
		content="Comprehensive regional information services for the Hindu Kush Himalaya region"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<main class="min-h-screen bg-[#F1F5F9] text-[#17324D]">
	<TopNav />
	<div class="mx-auto max-w-[1440px] px-[15px] pb-8">
		<section
			class="grid gap-10 pb-14 pt-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:pb-20 lg:pt-12"
		>
			<div class="max-w-xl">
				<h1
					class="mt-5 text-balance text-[40px] font-semibold leading-[1.03] tracking-[-0.055em] text-[#0F3557] sm:text-[48px] lg:text-[55px]"
				>
					<span class="text-[#0e63af]">HKH Regional Information System</span>
				</h1>
				<p class="mt-7 max-w-lg text-pretty text-base leading-7 text-[#5F7488] sm:text-lg">
					A comprehensive platform that integrates critical information about the Hindu Kush Himalaya
					region.
				</p>
				<a
					href={`${base}/integrated`}
					class="mt-8 inline-flex items-center rounded-full bg-[#0F3557] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174D7C]"
				>
					Integrated Viewer <ArrowUpRight class="ml-1.5 size-4" />
				</a>
				<div class="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
					<Stat value="54K" label="glaciers" note="mapped in the HKH" />
					<Stat value="4.2M" label="sq. km" note="regional extent" />
					<Stat value="233M+" label="people" note="across 8 countries" />
					<Stat value="28–8,848m" label="elevation" note="vertical range" />
				</div>
			</div>
			<div class="relative">
				<div class="absolute -inset-3 rounded-[16px] bg-[#D9EAF6] blur-2xl"></div>
				<div class="relative map-frame flex flex-col">
					<div class="relative min-h-0 flex-1">
						{#if Map3D}
							<Map3D bind:this={mapInstance} />
						{:else}
							<div class="grid h-[550px] place-items-center overflow-hidden rounded-[5px] bg-[#DCEAF5]">
								<div
									class="size-10 animate-spin rounded-full border-4 border-[#2563EB]/30 border-t-[#2563EB]"
								></div>
							</div>
						{/if}
					</div>
					<div class="mb-1 mt-3 flex flex-wrap gap-2 px-2">
						<LayerPill
							label="HKH Outline"
							active={mapInstance?.layerVisibility.hkhOutline}
							color="#2563EB"
							icon={Pentagon}
							onclick={() => mapInstance?.toggleLayer('hkhOutline')}
						/>
						<LayerPill
							label="Glacier"
							active={mapInstance?.layerVisibility.glacier}
							color="#0891B2"
							icon={Snowflake}
							onclick={() => mapInstance?.toggleLayer('glacier')}
						/>
						<LayerPill
							label="Mountain Region"
							active={mapInstance?.layerVisibility.mountainRegion}
							color="#0F766E"
							icon={Mountain}
							onclick={() => mapInstance?.toggleLayer('mountainRegion')}
						/>
						<LayerPill
							label="Night Time"
							active={mapInstance?.layerVisibility.nightTime}
							color="#7C3AED"
							icon={MoonStar}
							onclick={() => mapInstance?.toggleLayer('nightTime')}
						/>
					</div>
				</div>
			</div>
		</section>

		<section
			id="resources"
			class="mt-2 mb-16 grid gap-8 rounded-[24px] border border-[#D8E1EA] bg-[#E8EEF4] p-6 sm:mb-20 sm:p-8 lg:mb-24 lg:grid-cols-[0.7fr_1.3fr] lg:items-center"
		>
			<div>
				<SectionEyebrow color="#0F766E">Regional science apps</SectionEyebrow>
				<h2 class="max-w-md text-2xl font-semibold tracking-[-0.03em] text-[#17324D]">
					Explore the regional outlook
				</h2>
				<p class="mt-3 max-w-md text-sm leading-6 text-[#71869A]">
					Tools for weather, air quality, and streamflow across the HKH.
				</p>
			</div>
			<ResourceRail />
		</section>
	</div>
</main>
