<script lang="ts">
	import { LayoutGrid } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { color = '#2563EB', children }: { color?: string; children: Snippet } = $props();
</script>

<div class="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]" style="color: {color}">
	<LayoutGrid class="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
	{@render children()}
</div>
