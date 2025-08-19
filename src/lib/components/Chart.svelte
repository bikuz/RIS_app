<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let {
		chartData,
		title = 'Chart',
		subtitle = '',
		chart_type = 'line',
		plotOptions = {}
	} = $props<{
		chartData: {
			categories: string[];
			series: Array<{
				name: string;
				data: number[];
			}>;
		};
		title?: string;
		subtitle?: string;
		chart_type?: string;
		plotOptions?: any;
	}>();

	let chartContainer: HTMLDivElement;
	let chart: any = null;
	let Highcharts: any = null;

	async function loadHighcharts() {
		try {
			// Dynamic import of Highcharts
			const HighchartsModule = await import('highcharts');
			Highcharts = HighchartsModule.default;
			console.log('Highcharts loaded successfully');
			createChart();
		} catch (error) {
			console.error('Failed to load Highcharts:', error);
		}
	}

	function createChart() {
		if (!chartContainer || !chartData || !Highcharts) {
			console.log('Missing requirements for chart creation:', {
				hasContainer: !!chartContainer,
				hasData: !!chartData,
				hasHighcharts: !!Highcharts
			});
			return;
		}

		console.log('Creating chart with data:', chartData);

		// Destroy existing chart if it exists
		if (chart) {
			chart.destroy();
			chart = null;
		}

		try {
			chart = Highcharts.chart(chartContainer, {
				chart: {
					type: chart_type,
					backgroundColor: 'transparent',
					style: {
						fontFamily: 'Inter, system-ui, sans-serif'
					},
					height: 400
				},
				title: {
					text: title,
					style: {
						fontSize: '18px',
						fontWeight: '600',
						color: '#1e293b'
					}
				},
				subtitle: {
					text: subtitle,
					style: {
						fontSize: '14px',
						color: '#64748b'
					}
				},
				xAxis: {
					categories: chartData.categories,
					gridLineWidth: 1,
					gridLineColor: '#e2e8f0',
					lineColor: '#cbd5e1',
					tickColor: '#cbd5e1',
					labels: {
						style: {
							color: '#64748b',
							fontSize: '12px'
						}
					}
				},
				yAxis: {
					title: {
						text: 'Rainfall (mm)',
						style: {
							color: '#64748b',
							fontSize: '12px',
							fontWeight: '500'
						}
					},
					gridLineColor: '#e2e8f0',
					lineColor: '#cbd5e1',
					tickColor: '#cbd5e1',
					labels: {
						style: {
							color: '#64748b',
							fontSize: '12px'
						}
					}
				},
				tooltip: {
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					borderColor: '#e2e8f0',
					borderRadius: 8,
					shadow: true,
					style: {
						fontSize: '12px'
					},
					formatter: function () {
						return `<b>${this.series.name}</b><br/>
                                ${this.x}: <b>${this.y} mm</b>`;
					}
				},
				plotOptions: {
					...plotOptions,
					line: {
						dataLabels: {
							enabled: false
						},
						enableMouseTracking: true,
						marker: {
							radius: 4,
							lineWidth: 2,
							lineColor: '#ffffff'
						}
					}
				},
				series: chartData.series.map((serie, index) => ({
					...serie,
					color: index === 0 ? '#3b82f6' : '#10b981',
					marker: {
						fillColor: index === 0 ? '#3b82f6' : '#10b981',
						lineColor: '#ffffff',
						lineWidth: 2,
						radius: 4
					}
				})),
				legend: {
					align: 'center',
					verticalAlign: 'bottom',
					borderWidth: 0,
					itemStyle: {
						color: '#64748b',
						fontSize: '12px',
						fontWeight: '500'
					},
					itemHoverStyle: {
						color: '#1e293b'
					}
				},
				credits: {
					enabled: false
				}
			});

			console.log('Chart created successfully');
		} catch (error) {
			console.error('Error creating chart:', error);
		}
	}

	onMount(() => {
		console.log('HighchartsChart mounted', plotOptions);
		loadHighcharts();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
			chart = null;
		}
	});

	// Recreate chart when data changes
	$effect(() => {
		console.log('Chart data effect triggered:', chartData);
		if (chartData && Highcharts) {
			// Add a small delay to ensure DOM is ready
			setTimeout(() => {
				createChart();
			}, 100);
		}
	});
</script>

<div bind:this={chartContainer} class="h-96 min-h-[400px] w-full" style="min-height: 400px;">
	{#if !Highcharts}
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"
				></div>
				<p class="text-slate-600">Loading chart...</p>
			</div>
		</div>
	{/if}
</div>
