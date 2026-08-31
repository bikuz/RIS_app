<script lang="ts">
	import { Menu, X } from '@lucide/svelte';
	import { base } from '$app/paths';
	import { themes } from '$lib/data/themes';
	import servirLogo from '$lib/assets/logo/logo-servir-global.png';
	import icimodLogo from '$lib/assets/logo/logo-icimod_white.png';
	import Logo from './Logo.svelte';
	import ThemeMenu from './ThemeMenu.svelte';

	let { active }: { active?: string } = $props();

	let open = $state(false);
</script>

<header id="app-header" class="sticky top-0 z-40 border-b border-[#D8E1EA]/80 bg-white">
	<div class="mx-auto flex h-[56px] max-w-[1440px] items-center gap-4 px-[15px]">
		<Logo />
		<button
			class="icon-button ml-auto grid md:!hidden"
			onclick={() => (open = !open)}
			aria-label={open ? 'Close menu' : 'Open menu'}
		>
			{#if open}
				<X class="size-5" />
			{:else}
				<Menu class="size-5" />
			{/if}
		</button>
		<div class="ml-auto hidden items-center gap-6 md:flex">
			 
			<img src={servirLogo} alt="SERVIR Global" class="h-6 w-auto -translate-y-1" />
			<span
				role="img"
				aria-label="ICIMOD"
				class="block h-7 w-[6.5rem] bg-[#0F3557]"
				style="
					-webkit-mask-image: url({icimodLogo});
					mask-image: url({icimodLogo});
					-webkit-mask-size: contain;
					mask-size: contain;
					-webkit-mask-repeat: no-repeat;
					mask-repeat: no-repeat;
					-webkit-mask-position: center;
					mask-position: center;
				"
			></span>
		</div>
	</div>
	<div class="hidden border-t border-[#D8E1EA]/70 bg-white md:block">
		<ThemeMenu {active} />
	</div>
	{#if open}
		<div class="border-t border-[#D8E1EA] bg-white px-[15px] py-4 md:hidden">
			<nav class="flex flex-col gap-4 text-sm font-semibold text-[#31506A]">
				<a href={`${base}/`} onclick={() => (open = false)} class={!active ? 'font-bold text-[#2563EB]' : ''}>Home</a>
				<a
					href={`${base}/integrated`}
					onclick={() => (open = false)}
					class={active === 'integrated' ? 'font-bold text-[#2563EB]' : ''}
				>
					Integrated
				</a>
				<a
					href={`${base}/agent`}
					onclick={() => (open = false)}
					class={active === 'agent' ? 'font-bold text-[#2563EB]' : ''}
				>
					Agent
				</a>
				{#each themes as theme (theme.slug)}
					<a
						href={`${base}/thematic/${theme.slug}`}
						onclick={() => (open = false)}
						class={active === theme.slug ? 'font-bold text-[#2563EB]' : ''}
					>
						{theme.name}
					</a>
				{/each}
			</nav>
		</div>
	{/if}
</header>
