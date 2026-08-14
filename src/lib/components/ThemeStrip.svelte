<script lang="ts">
	import { base } from '$app/paths';
	import { themes } from '$lib/data/themes';
	import { themeIcons } from '$lib/theme-icons';
</script>

<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
	{#each themes as theme (theme.slug)}
		{@const Icon = themeIcons[theme.icon]}
		<a href={`${base}/thematic/${theme.slug}`} class="block">
			<div
				class="group flex items-center gap-2.5 rounded-xl border border-[#D8E1EA] bg-white/55 px-3 py-2.5 transition hover:-translate-y-0.5 hover:bg-white"
				style="--theme: {theme.color}; --theme-soft: {theme.soft}"
			>
				<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme)]">
					<Icon class="size-4" strokeWidth={1.8} />
				</span>
				<span class="min-w-0 truncate text-xs font-semibold text-[#31506A] group-hover:text-[var(--theme)]"
					>{theme.name}</span
				>
			</div>
		</a>
	{/each}
</div>
