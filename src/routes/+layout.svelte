<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	const showFooter = $derived(!$page.route.id?.startsWith('/integrated'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-[#F1F5F9]">
	{@render children?.()}

	{#if showFooter}
		<Footer />
	{/if}
</div>
