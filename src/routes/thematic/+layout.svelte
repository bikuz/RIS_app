<script lang="ts">
	// import '../app.css';
	import { Cloud, Users, Leaf, Snowflake, Sun, Mountain, Wind, ChevronRight } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

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
	</nav>

	{@render children?.()}
</div>
