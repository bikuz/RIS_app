<script lang="ts">
	// import '../app.css';
	import { Home, Cloud, Users, Leaf, Snowflake, Sun, Mountain, Wind, ChevronRight } from '@lucide/svelte';
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
		<button onclick={()=>goto(`${base}/`)} 
			class="group min-w-fit flex-1 transform rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] 
			border border-slate-200/50 bg-white/50 text-slate-700 hover:bg-white/80 hover:shadow-md "
			>
			<div class="flex items-center space-x-3">
				<div
					class="rounded-lg p-2 bg-slate-100 group-hover:bg-slate-200 ">
					<Home/>
				</div>
				<span class="font-semibold">Home</span>
			</div>
		</button>

		{#each Object.entries(topicIcons) as [topic, IconComponent]}
			{@const isDisabled = ['cryosphere', 'weather', 'physiography', 'air-quality'].includes(topic)}
			<button
				onclick={() => !isDisabled && selectTopic(topic)}
				disabled={isDisabled}
				class="group min-w-fit flex-1 transform rounded-xl p-4 text-left transition-all duration-300 {!isDisabled ? 'hover:scale-[1.02]' : ''} {currentTopic ===
				topic
					? 'bg-gradient-to-r ' + getTopicColor(topic) + ' text-white shadow-lg shadow-blue-500/25'
					: isDisabled 
						? 'border border-slate-200/30 bg-slate-100/50 text-slate-400 cursor-not-allowed'
						: 'border border-slate-200/50 bg-white/50 text-slate-700 hover:bg-white/80 hover:shadow-md'}"
			>
				<div class="flex items-center space-x-3">
					<div
						class="rounded-lg p-2 {currentTopic === topic
							? 'bg-white/20'
							: isDisabled
								? 'bg-slate-200/50'
								: 'bg-slate-100 group-hover:bg-slate-200'}"
					>
						<IconComponent
							class="h-5 w-5 {currentTopic === topic ? 'text-white' : isDisabled ? 'text-slate-400' : 'text-slate-600'}"
						/>
					</div>
					<span class="font-semibold">{getTopicName(topic)}</span>
					{#if !isDisabled}
						<ChevronRight
							class="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
						/>
					{/if}
				</div>
			</button>
		{/each}
	</nav>

	{@render children?.()}
</div>
