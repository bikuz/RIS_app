<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { X } from '@lucide/svelte';

	let { src, label }: { src: string; label: string } = $props();

	let open = $state(false);
	let overlayTop = $state(0);
	let loading = $state(false);

	function updateOverlayTop() {
		const header = document.getElementById('app-header');
		overlayTop = header ? Math.round(header.getBoundingClientRect().bottom) : 96;
	}

	function setOpen(next: boolean) {
		open = next;
		if (!browser) return;
		if (next) {
			loading = true;
			updateOverlayTop();
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) setOpen(false);
	}

	function onResize() {
		if (open) updateOverlayTop();
	}

	onDestroy(() => {
		if (browser) document.body.style.overflow = '';
	});
</script>

<svelte:window onkeydown={onKeydown} onresize={onResize} />

<button
	type="button"
	onclick={() => setOpen(true)}
	aria-label={label}
	title={label}
	aria-expanded={open}
	class="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0F3557] text-white shadow-sm transition hover:bg-[#174D7C]"
>
	<span class="text-[15px] font-bold italic leading-none" aria-hidden="true">i</span>
</button>

{#if open}
	<div
		class="fixed inset-x-0 bottom-0 z-[54] overflow-hidden bg-[#F1F5F9]"
		style="top: {overlayTop}px"
		role="dialog"
		aria-modal="true"
		aria-label={label}
	>
		<button
			type="button"
			onclick={() => setOpen(false)}
			aria-label="Close story"
			title="Close story"
			class="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-[#0F3557] text-white shadow-sm transition hover:bg-[#174D7C]"
		>
			<X class="size-4" strokeWidth={2.5} />
		</button>
		<iframe
			{src}
			title={label}
			class="h-full w-full border-0 bg-white"
			referrerpolicy="no-referrer-when-downgrade"
			allowfullscreen
			onload={() => (loading = false)}
		></iframe>
		{#if loading}
			<div class="absolute inset-0 z-[1] grid place-items-center bg-[#F1F5F9]">
				<div
					class="size-10 animate-spin rounded-full border-4 border-[#2563EB]/30 border-t-[#2563EB]"
					aria-hidden="true"
				></div>
				<span class="sr-only">Loading story</span>
			</div>
		{/if}
	</div>
{/if}
