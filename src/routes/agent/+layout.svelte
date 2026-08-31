<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';

	let { children } = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-[#F1F5F9] text-[#17324D]">
	<TopNav active="agent" />
	<main class="min-h-0 flex-1 overflow-hidden">
		{@render children?.()}
	</main>
</div>
