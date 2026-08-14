<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { base } from '$app/paths';
	import type { Theme } from '$lib/data/themes';
	import { themeIcons } from '$lib/theme-icons';

	let { theme }: { theme: Theme } = $props();

	const Icon = $derived(themeIcons[theme.icon]);
</script>

<a href={`${base}/thematic/${theme.slug}`} class="block">
	<div class="theme-card group h-full" style="--theme: {theme.color}; --theme-soft: {theme.soft}">
		<div class="flex items-start justify-between">
			<span class="grid size-11 place-items-center rounded-2xl bg-[var(--theme-soft)] text-[var(--theme)]">
				<Icon class="size-5" strokeWidth={1.8} />
			</span>
			<ArrowUpRight
				class="size-4 text-[#94A3B8] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--theme)]"
			/>
		</div>
		<h3 class="mt-6 text-lg font-semibold text-[#17324D]">{theme.name}</h3>
		<p class="mt-2 text-sm leading-6 text-[#64788B]">{theme.description}</p>
		<span class="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[var(--theme)]">
			Explore theme <span class="h-px w-5 bg-current"></span>
		</span>
	</div>
</a>
