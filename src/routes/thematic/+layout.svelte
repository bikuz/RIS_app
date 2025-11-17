<script lang="ts">
	// import '../app.css';
	import {
		Home,
		Cloud,
		Users,
		Leaf,
		Snowflake,
		Sun,
		Mountain,
		Wind,
		ChevronRight,
		ChevronDown,
		ExternalLink
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	import {
		topicIcons,
		// topicColors,
		selectTopic,
		getTopicName,
		// getTopicIcon,
		getTopicColor
	} from '$lib/data/themeData.js';

	import icimodLogo from '$lib/assets/logo/logo-icimod_white.png';
	// Get current topic from the URL
	let currentTopic = $derived($page.route.id?.split('/').pop() || '');

	// let currentSection = $state('');
	// let currentQuestionId = $state('');
	// let controlValues = $state({});

	let { children } = $props();

	// Useful links dropdown state
	let isLinksDropdownOpen = $state(false);
	let dropdownRef: HTMLDivElement | null = null;

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isLinksDropdownOpen = false;
		}
	}

	$effect(() => {
		if (isLinksDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	// Useful links data
	const usefulLinks = [
		{
			label: 'Weather',
			url: 'https://tethys.icimod.org/apps/hiwatrg/'
		},
		{
			label: 'Air Quality',
			url: 'https://smog.icimod.org/apps/airquality/'
		}
		// {
		// 	label: 'SERVIR Hindu Kush Himalaya',
		// 	url: 'https://servir.icimod.org'
		// },
		// {
		// 	label: 'HI-AWARE',
		// 	url: 'https://www.hi-aware.org'
		// },
		// {
		// 	label: 'Regional Database System',
		// 	url: 'https://rds.icimod.org'
		// }
	];

	// function selectTopic(topic: string) {
	// 	goto(`/thematic/${topic}`);
	// }

	// function getTopicName(topic: string): string {
	// 	return topic.charAt(0).toUpperCase() + topic.slice(1).replace('-', ' ');
	// }

	// function getTopicIcon(topic: string) {
	// 	return topicIcons[topic as keyof typeof topicIcons] || Cloud;
	// }
</script>

<header class="relative overflow-hidden bg-gradient-to-r from-blue-800 to-green-800 text-white">
	<div class="absolute inset-0 bg-black/20"></div>
	<div class="relative mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex h-24 items-center justify-between">
			<div class="flex items-center space-x-6">
				<div class="flex flex-col">
					 
					<div class="text-3xl font-bold text-white">Hi-RIS (HKH Regional Information System)</div>
				</div>
			</div>

			<div class="">
				<img src={icimodLogo} alt="ICIMOD Logo" class="h-7 w-auto" />
			</div>
		</div>
	</div>
</header>

<div class="min-h-screen bg-gray-50 p-3 sm:p-6">
	<!-- Top Navigation -->
	<nav
		class="mb-4 flex flex-wrap gap-2 sm:mb-6 sm:gap-4 md:grid md:grid-cols-2 md:gap-4 lg:flex lg:flex-wrap"
	>
		<button
			onclick={() => goto(`${base}/`)}
			class="group w-full transform rounded-lg border border-slate-200/50 bg-white/50 p-3 text-left text-slate-700 transition-all duration-300 hover:scale-[1.02]
			hover:bg-white/80 hover:shadow-md sm:min-w-fit sm:flex-1 sm:rounded-xl sm:p-4 md:flex-none lg:flex-1"
		>
			<div class="flex items-center space-x-2 sm:space-x-3">
				<div class="rounded-lg bg-slate-100 p-1.5 group-hover:bg-slate-200 sm:p-2">
					<Home class="h-4 w-4 sm:h-5 sm:w-5" />
				</div>
				<span class="text-sm font-semibold sm:text-base">Home</span>
			</div>
		</button>

		{#each Object.entries(topicIcons) as [topic, IconComponent]}
			<button
				onclick={() => selectTopic(topic)}
				class="group w-full transform rounded-lg p-3 text-left transition-all duration-300 hover:scale-[1.02] sm:min-w-fit sm:flex-1 sm:rounded-xl sm:p-4 md:flex-none lg:flex-1 {currentTopic ===
				topic
					? 'bg-gradient-to-r ' + getTopicColor(topic) + ' text-white shadow-lg shadow-blue-500/25'
					: 'border border-slate-200/50 bg-white/50 text-slate-700 hover:bg-white/80 hover:shadow-md'}"
			>
				<div class="flex items-center space-x-2 sm:space-x-3">
					<div
						class="rounded-lg p-1.5 sm:p-2 {currentTopic === topic
							? 'bg-white/20'
							: 'bg-slate-100 group-hover:bg-slate-200'}"
					>
						<svelte:component
							this={IconComponent}
							class="h-4 w-4 sm:h-5 sm:w-5 {currentTopic === topic
								? 'text-white'
								: 'text-slate-600'}"
						/>
					</div>
					<span class="text-sm font-semibold sm:text-base">{getTopicName(topic)}</span>
					<ChevronRight
						class="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 sm:h-4 sm:w-4"
					/>
				</div>
			</button>
		{/each}

		<!-- Useful Links Dropdown -->
		<div
			bind:this={dropdownRef}
			class="relative w-full sm:min-w-fit sm:flex-1 md:flex-none lg:flex-1"
		>
			<button
				onclick={() => (isLinksDropdownOpen = !isLinksDropdownOpen)}
				class="group flex h-full w-full transform items-center rounded-lg border border-slate-200/50 bg-white/50 p-3 text-left text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 hover:shadow-md sm:rounded-xl sm:p-4"
			>
				<div class="flex flex-1 items-center justify-between">
					<div class="flex items-center space-x-2 sm:space-x-3">
						<div class="rounded-lg bg-slate-100 p-1.5 group-hover:bg-slate-200 sm:p-2">
							<ExternalLink class="h-4 w-4 text-slate-600 sm:h-5 sm:w-5" />
						</div>
						<span class="text-sm font-semibold sm:text-base">Regional Science App</span>
					</div>
					<ChevronDown
						class="ml-2 h-3.5 w-3.5 transition-transform duration-200 sm:ml-auto sm:h-4 sm:w-4 {isLinksDropdownOpen
							? 'rotate-180'
							: ''}"
					/>
				</div>
			</button>

			<!-- Dropdown Menu -->
			{#if isLinksDropdownOpen}
				<div
					class="absolute top-full right-0 left-0 z-50 mt-2 rounded-lg border border-slate-200 bg-white shadow-xl"
				>
					<div class="py-1 sm:py-2">
						{#each usefulLinks as link}
							<a
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center justify-between px-3 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-50 sm:px-4 sm:py-2.5 sm:text-sm"
							>
								<span>{link.label}</span>
								<ExternalLink class="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</nav>

	{@render children?.()}
</div>
