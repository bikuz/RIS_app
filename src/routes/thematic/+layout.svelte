<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import TopNav from '$lib/components/TopNav.svelte';

	let { children } = $props();

	let active = $derived($page.route.id?.split('/').pop() || '');

	onMount(() => {
		const header = document.getElementById('app-header');
		if (!header) return;
		const sync = () => {
			document.documentElement.style.setProperty('--app-header-height', `${header.offsetHeight}px`);
		};
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(header);
		return () => observer.disconnect();
	});
</script>

<TopNav {active} />

<main class="thematic-page min-h-screen bg-[#F1F5F9] text-[#17324D]">
	<div class="mx-auto max-w-[1440px] px-[15px] py-6">
		{@render children?.()}
	</div>
</main>

<style>
	.thematic-page :global(.map-frame) {
		background: #fff;
	}
</style>
