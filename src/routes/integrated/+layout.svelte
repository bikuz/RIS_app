<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';

	let { children } = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-[#F1F5F9] text-[#17324D]">
	<TopNav active="integrated" />
	<main class="min-h-0 flex-1 overflow-hidden">
		<div class="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col px-[15px] py-4">
			{@render children?.()}
		</div>
	</main>
</div>

<style>
	:global(.map-frame) {
		background: #fff;
		min-height: 0;
		height: 100%;
	}
</style>
