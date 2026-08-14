<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		children,
		open,
		onclick,
		active = false
	}: {
		title: string;
		children: Snippet;
		open: boolean;
		onclick: () => void;
		active?: boolean;
	} = $props();
</script>

<div
	class="overflow-hidden rounded-xl border transition {active
		? 'border-[#2563EB] bg-gradient-to-r from-[#DBEAFE] to-[#EEF6FB]'
		: 'border-[#D8E1EA] bg-[#F3F7FA]'}"
>
	<button
		{onclick}
		class="flex w-full items-center justify-between px-3.5 py-3 text-left text-sm font-semibold transition {active
			? 'text-[#2563EB]'
			: 'text-[#46637A]'}"
	>
		<span>{title}</span>
		<ChevronDown
			class="size-4 shrink-0 transition {open ? 'rotate-180' : ''} {active ? 'text-[#2563EB]' : 'text-[#90A2B2]'}"
		/>
	</button>
	{#if open}
		<div class="px-3.5 pb-3.5">{@render children()}</div>
	{/if}
</div>
