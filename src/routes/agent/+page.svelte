<script lang="ts">
	import { AGENT_EMBED_URL } from '$lib/data/agent';

	let loading = $state(Boolean(AGENT_EMBED_URL));
</script>

<svelte:head>
	<title>Geospatial Agent | ICIMOD RIS</title>
	<meta
		name="description"
		content="Ask questions and explore HKH geospatial data with the RIS LLM agent."
	/>
</svelte:head>

<div class="relative h-full min-h-0 w-full bg-white">
	{#if AGENT_EMBED_URL}
		<iframe
			src={AGENT_EMBED_URL}
			title="RIS Geospatial Agent"
			class="h-full w-full border-0"
			referrerpolicy="no-referrer-when-downgrade"
			allow="clipboard-read; clipboard-write; fullscreen"
			onload={() => (loading = false)}
		></iframe>
		{#if loading}
			<div class="absolute inset-0 z-[1] grid place-items-center bg-[#F1F5F9]">
				<div
					class="size-10 animate-spin rounded-full border-4 border-[#2563EB]/30 border-t-[#2563EB]"
					aria-hidden="true"
				></div>
				<span class="sr-only">Loading geospatial agent</span>
			</div>
		{/if}
	{:else}
		<div class="grid h-full place-items-center px-6">
			<div class="max-w-md text-center">
				<p class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A9BAD]">
					Geospatial agent
				</p>
				<h1 class="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#0F3557]">
					Agent host URL not set yet
				</h1>
				<p class="mt-3 text-sm leading-6 text-[#64788B]">
					Set <code class="rounded bg-[#E8EEF4] px-1.5 py-0.5 text-[#31506A]">VITE_AGENT_EMBED_URL</code> in
					<code class="rounded bg-[#E8EEF4] px-1.5 py-0.5 text-[#31506A]">.env</code>
					to the agent server address when it is ready.
				</p>
			</div>
		</div>
	{/if}
</div>
