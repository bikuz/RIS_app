<script lang="ts">
    import { Map, BarChart3 } from '@lucide/svelte';
    import type { QuestionAnswer } from '$lib/types/question-types';
    import Chart from './Chart.svelte';

    let { 
        type, 
        answer, 
        questionTitle,
        selectedParams 
    } = $props<{
        type: 'map' | 'chart';
        answer: QuestionAnswer;
        questionTitle: string;
        selectedParams: Record<string, any>;
    }>();

    const config = {
        map: {
            icon: Map,
            title: 'Geospatial Visualization',
            subtitle: 'Interactive map analysis',
            gradientFrom: 'from-blue-500',
            gradientTo: 'to-indigo-500',
            bgGradient: 'from-blue-50/80 to-indigo-50/80',
            borderColor: 'border-blue-200/30'
        },
        chart: {
            icon: BarChart3,
            title: 'Statistical Analysis',
            subtitle: 'Charts and trends visualization',
            gradientFrom: 'from-green-500',
            gradientTo: 'to-emerald-500',
            bgGradient: 'from-green-50/80 to-emerald-50/80',
            borderColor: 'border-green-200/30'
        }
    };

    const currentConfig = $derived(config[type as keyof typeof config]);
    const summary = $derived(type === 'map' ? answer.mapSummary : answer.chartSummary);
    const hasChartData = $derived(type === 'chart' && answer.chartData);
    
    // Debug logging
    $effect(() => {
        if (type === 'chart') {
            console.log('VisualizationSection chart effect:', {
                hasChartData,
                chartData: answer.chartData,
                answer
            });
        }
    });
</script>

<div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
    <div class="flex items-center space-x-4 mb-6">
        <div class="p-3 bg-gradient-to-r {currentConfig.gradientFrom} {currentConfig.gradientTo} rounded-xl">
            <svelte:component this={currentConfig.icon} class="w-6 h-6 text-white" />
        </div>
        <div>
            <h4 class="text-xl font-bold text-slate-800">{currentConfig.title}</h4>
            <p class="text-slate-600">{currentConfig.subtitle}</p>
        </div>
    </div>

    <!-- Answer Summary -->
    <div class="bg-gradient-to-r {currentConfig.bgGradient} backdrop-blur-sm rounded-2xl p-6 mb-6 border {currentConfig.borderColor}">
        <div class="flex items-start space-x-4">
            <div class="p-2 bg-gradient-to-r {currentConfig.gradientFrom} {currentConfig.gradientTo} rounded-lg flex-shrink-0">
                <svelte:component this={currentConfig.icon} class="w-5 h-5 text-white" />
            </div>
            <div>
                <h5 class="font-bold text-slate-900 mb-3">{currentConfig.title} Summary</h5>
                <p class="text-slate-800 leading-relaxed">{summary}</p>
                
                <!-- Show selected parameters -->
                {#if Object.keys(selectedParams).length > 0}
                    <div class="mt-3 flex flex-wrap gap-2">
                        {#each Object.entries(selectedParams) as [key, value]}
                            <span class="px-2 py-1 bg-white/60 rounded-md text-xs font-medium text-slate-700">
                                {key}: {Array.isArray(value) ? value.join(', ') : value}
                            </span>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Visualization Content -->
    <div class="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden">
        {#if hasChartData}
            <!-- Real Chart with Highcharts -->
            <div class="p-6">
                <div class="mb-4">
                    <p class="text-sm text-gray-600">
                        Debug: Chart data available - Categories: {answer.chartData.categories.length}, Series: {answer.chartData.series.length}
                    </p>
                </div>
                <Chart 
                    chartData={answer.chartData}
                    title="Monthly Rainfall Distribution"
                    subtitle="Precipitation patterns across selected regions"
                />
            </div>
        {:else}
            <!-- Placeholder -->
            <div class="h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div class="text-center">
                    <div class="p-4 bg-gradient-to-r {currentConfig.gradientFrom} {currentConfig.gradientTo} rounded-2xl w-fit mx-auto mb-4">
                        <svelte:component this={currentConfig.icon} class="w-12 h-12 text-white" />
                    </div>
                    <p class="text-slate-600 font-medium">Interactive {type} will be displayed here</p>
                    <p class="text-slate-500 text-sm mt-2">{questionTitle}</p>
                    <p class="text-xs text-gray-400 mt-2">
                        Debug: hasChartData = {hasChartData}, type = {type}
                    </p>
                </div>
            </div>
        {/if}
    </div>
</div>
