<script lang="ts">
	import { Map, BarChart3 } from '@lucide/svelte';
	import type { QuestionAnswer } from '$lib/types/question-types';
	import Chart from './Chart.svelte';

	let {
		type,
		answer,
		questionTitle
	} = $props<{
		type: 'map' | 'chart';
		answer: QuestionAnswer;
		questionTitle: string;
	}>();

	const config = {
		map: {
			icon: Map,
			gradientFrom: 'from-blue-500',
			gradientTo: 'to-indigo-500'
		},
		chart: {
			icon: BarChart3,
			gradientFrom: 'from-green-500',
			gradientTo: 'to-emerald-500'
		}
	};

	const currentConfig = $derived(config[type as keyof typeof config]);
	const hasChartData = $derived(type === 'chart' && answer.chartData);
</script>

<div class="mb-6 overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm">
	{#if hasChartData}
		<div class="p-6">
			<Chart
				chartData={answer.chartData}
				title="Monthly Rainfall Distribution"
				subtitle="Precipitation patterns across selected regions"
			/>
		</div>
	{:else}
		<div class="flex h-96 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
			<div class="text-center">
				<div
					class="mx-auto mb-4 w-fit rounded-2xl bg-gradient-to-r {currentConfig.gradientFrom} {currentConfig.gradientTo} p-4"
				>
					<svelte:component this={currentConfig.icon} class="h-12 w-12 text-white" />
				</div>
				<p class="font-medium text-slate-600">Interactive {type} will be displayed here</p>
				<p class="mt-2 text-sm text-slate-500">{questionTitle}</p>
			</div>
		</div>
	{/if}
</div>
