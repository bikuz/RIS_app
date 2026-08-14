<script lang="ts">
	import { BarChart3, CloudSun, Droplets } from '@lucide/svelte';
</script>

<div class="grid gap-3 sm:grid-cols-3">
	<a
		href="https://tethys.icimod.org/apps/hiwatrg/"
		target="_blank"
		rel="noreferrer"
		class="resource-card transition hover:-translate-y-0.5 hover:bg-white"
	>
		<CloudSun class="size-4 text-[#2563EB]" />
		<div>
			<p class="font-semibold text-[#17324D]">Weather</p>
			<p class="mt-1 text-xs text-[#71869A]">Monitor conditions across the HKH</p>
		</div>
	</a>
	<a
		href="https://smog.icimod.org/apps/airquality/"
		target="_blank"
		rel="noreferrer"
		class="resource-card transition hover:-translate-y-0.5 hover:bg-white"
	>
		<Droplets class="size-4 text-[#0891B2]" />
		<div>
			<p class="font-semibold text-[#17324D]">Air Quality</p>
			<p class="mt-1 text-xs text-[#71869A]">Explore air quality signals</p>
		</div>
	</a>
	<a
		href="https://icimod.maps.arcgis.com/apps/instant/streamflowviewer/index.html?appid=7f282e15d6444679add88d9313c3a6bc"
		target="_blank"
		rel="noreferrer"
		class="resource-card transition hover:-translate-y-0.5 hover:bg-white"
	>
		<BarChart3 class="size-4 text-[#0F766E]" />
		<div>
			<p class="font-semibold text-[#17324D]">Streamflow</p>
			<p class="mt-1 text-xs text-[#71869A]">Follow river flow and water data</p>
		</div>
	</a>
</div>
