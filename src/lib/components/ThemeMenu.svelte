<script lang="ts">
	import { Bot, Home, Layers } from '@lucide/svelte';
	import { base } from '$app/paths';
	import { themes } from '$lib/data/themes';
	import { themeIcons } from '$lib/theme-icons';

	let { active }: { active?: string } = $props();
</script>

<nav
	class="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-[15px]"
	aria-label="Regional themes"
	style="--theme: #2563EB"
>
	<a href={`${base}/`} class="theme-menu-item {!active ? 'theme-menu-item-active' : ''}">
		<Home class="size-4" strokeWidth={2} />Home
	</a>
	{#each themes as theme (theme.slug)}
		{@const Icon = themeIcons[theme.icon]}
		{@const isActive = active === theme.slug}
		<a href={`${base}/thematic/${theme.slug}`} class="theme-menu-item {isActive ? 'theme-menu-item-active' : ''}">
			<Icon class="size-4" strokeWidth={2} />{theme.name}
		</a>
	{/each}
	<a
		href={`${base}/integrated`}
		class="theme-menu-item {active === 'integrated' ? 'theme-menu-item-active' : ''}"
	>
		<Layers class="size-4" strokeWidth={2} />Integrated
	</a>
	<a
		href={`${base}/agent`}
		class="theme-menu-item {active === 'agent' ? 'theme-menu-item-active' : ''}"
	>
		<Bot class="size-4" strokeWidth={2} />Geo AI
	</a>
</nav>
