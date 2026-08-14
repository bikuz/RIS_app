<script lang="ts">
	import type { Component } from 'svelte';

	let {
		label,
		active = false,
		color = '#2563EB',
		icon: Icon,
		onclick
	}: {
		label: string;
		active?: boolean;
		color?: string;
		icon?: Component;
		onclick?: () => void;
	} = $props();
</script>

<button
	{onclick}
	class="layer-pill {active ? 'layer-pill-active' : ''}"
	style={active ? `border-color: ${color}; color: ${color}` : undefined}
>
	{#if Icon}
		<Icon class="size-3.5 shrink-0" strokeWidth={2.25} />
	{/if}
	{label}
</button>
