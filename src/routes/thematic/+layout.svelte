<script lang="ts">
	// import '../app.css';
	import { Cloud, Users, Leaf, Snowflake, Sun, Mountain, Wind, ChevronRight } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const topicIcons = {
		climate: Cloud,
		demography: Users,
		ecosystem: Leaf,
		cryosphere: Snowflake,
		weather: Sun,
		physiography: Mountain,
		'air-quality': Wind
	} as const;

	// const topicColors = {
	// 	climate: 'from-blue-500 to-cyan-500',
	// 	demography: 'from-purple-500 to-pink-500',
	// 	ecosystem: 'from-[#b1d777] to-emerald-500',
	// 	cryosphere: 'from-cyan-500 to-blue-500',
	// 	weather: 'from-yellow-500 to-orange-500',
	// 	physiography: 'from-stone-500 to-amber-500',
	// 	'air-quality': 'from-gray-500 to-slate-500'
	// } as const;

	// Get current topic from the URL
	let currentTopic = $derived($page.route.id?.split('/').pop() || '');

	// let currentSection = $state('');
	// let currentQuestionId = $state('');
	// let controlValues = $state({});

	let { children } = $props();

	function selectTopic(topic: string) {
		goto(`/thematic/${topic}`);
	}

	function getTopicName(topic: string): string {
		return topic.charAt(0).toUpperCase() + topic.slice(1).replace('-', ' ');
	}

	function getTopicIcon(topic: string) {
		return topicIcons[topic as keyof typeof topicIcons] || Cloud;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Top Navigation -->
	<nav class="mt-6 mb-6 flex flex-wrap gap-3">
		{#each Object.entries(topicIcons) as [topic, IconComponent]}
			<button
				onclick={() => selectTopic(topic)}
				class="group min-w-fit flex-1 transform rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] {currentTopic ===
				topic
					? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
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
	</nav>

	<!-- 3-Column Layout -->
	<div class="grid grid-cols-12 items-stretch gap-6 px-4">
		<!-- Left Sidebar -->
		<div class="col-span-2 flex">
			<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
				<h3 class="mb-3 text-sm font-semibold text-slate-700">Story</h3>
			</div>
		</div>

		<!-- Main Content Area -->
		<div class="col-span-8 flex">
			<div class="min-h-[600px] flex-1 rounded-xl border border-slate-200/50 bg-white shadow-sm">
				{@render children?.()}
			</div>
		</div>

		<!-- Right Sidebar -->
		<div class="col-span-2 flex">
			<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
				<h3 class="mb-3 text-sm font-semibold text-slate-700">Questions</h3>
			</div>
		</div>
	</div>
</div>
