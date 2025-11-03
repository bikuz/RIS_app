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

<div class="min-h-screen bg-gray-50 p-6">
	<!-- Top Navigation -->
	<nav class="mb-6 flex flex-wrap gap-6">
		<button
			onclick={() => goto(`${base}/`)}
			class="group min-w-fit flex-1 transform rounded-xl border border-slate-200/50 bg-white/50 p-4 text-left
			text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 hover:shadow-md"
		>
			<div class="flex items-center space-x-3">
				<div class="rounded-lg bg-slate-100 p-2 group-hover:bg-slate-200">
					<Home />
				</div>
				<span class="font-semibold">Home</span>
			</div>
		</button>

		{#each Object.entries(topicIcons) as [topic, IconComponent]}
			<button
				onclick={() => selectTopic(topic)}
				class="group min-w-fit flex-1 transform rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] {currentTopic ===
				topic
					? 'bg-gradient-to-r ' + getTopicColor(topic) + ' text-white shadow-lg shadow-blue-500/25'
					: 'border border-slate-200/50 bg-white/50 text-slate-700 hover:bg-white/80 hover:shadow-md'}"
			>
				<div class="flex items-center space-x-3">
					<div
						class="rounded-lg p-2 {currentTopic === topic
							? 'bg-white/20'
							: 'bg-slate-100 group-hover:bg-slate-200'}"
					>
						<svelte:component
							this={IconComponent}
							class="h-5 w-5 {currentTopic === topic ? 'text-white' : 'text-slate-600'}"
						/>
					</div>
					<span class="font-semibold">{getTopicName(topic)}</span>
					<ChevronRight
						class="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
			</button>
		{/each}

		<!-- Useful Links Dropdown -->
		<div bind:this={dropdownRef} class="relative min-w-fit flex-1">
			<button
				onclick={() => (isLinksDropdownOpen = !isLinksDropdownOpen)}
				class="group flex h-full w-full transform items-center rounded-xl border border-slate-200/50 bg-white/50 p-4 text-left text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 hover:shadow-md"
			>
				<div class="flex flex-1 items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="rounded-lg bg-slate-100 p-2 group-hover:bg-slate-200">
							<ExternalLink class="h-5 w-5 text-slate-600" />
						</div>
						<span class="font-semibold">Useful Links</span>
					</div>
					<ChevronDown
						class="ml-auto h-4 w-4 transition-transform duration-200 {isLinksDropdownOpen
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
					<div class="py-2">
						{#each usefulLinks as link}
							<a
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
							>
								<span>{link.label}</span>
								<ExternalLink class="h-3.5 w-3.5 text-slate-400" />
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</nav>

	{@render children?.()}
</div>
