<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let {
		chartData,
		title = 'Chart',
		subtitle = '',
		chart_type = 'line',
		plotOptions = {},
		yAxisTitle = 'Value',
		plotLines = [],
		xAxisConfig = null,
		showLegend = true,
		isPyramid = false
	} = $props<{
		chartData: {
			categories: (string | number)[];
			series: Array<{
				name: string;
				data: (number | null)[];
				color?: string;
				marker?: any;
				dashStyle?: string;
			}>;
			plotOptions?: any;
			plotLines?: Array<{
				color: string;
				width: number;
				value: number;
				zIndex?: number;
			}>;
		};
		title?: string;
		subtitle?: string;
		chart_type?: string;
		plotOptions?: any;
		yAxisTitle?: string;
		plotLines?: Array<{
			color: string;
			width: number;
			value: number;
			zIndex?: number;
		}>;
		xAxisConfig?: {
			type?: 'linear' | 'category';
			min?: number;
			max?: number;
			title?: {
				text: string;
			};
			labels?: {
				formatter?: (this: { value: number }) => string;
				style?: any;
			};
			tickInterval?: number;
			gridLineWidth?: number;
			plotLines?: Array<{
				color: string;
				width: number;
				value: number;
				zIndex?: number;
				dashStyle?: string;
			}>;
		};
		showLegend?: boolean;
		isPyramid?: boolean;
	}>();

	let chartContainer: HTMLDivElement;
	let chart: any = null;
	let Highcharts: any = $state(null);

	async function loadHighcharts() {
		try {
			// Dynamic import of Highcharts
			const HighchartsModule = await import('highcharts');
			Highcharts = HighchartsModule.default;

			// Load and initialize the exporting module
			// const ExportingModule = await import('highcharts/modules/exporting');
			// ExportingModule(Highcharts);

			console.log('Highcharts and exporting module loaded successfully');
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
			// Configure chart for population pyramid
			let chartConfig: any = {
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
				exporting: {
					enabled: true
				},
				credits: {
					enabled: false
				}
			};

			// Configure xAxis for pyramid or regular chart
			if (isPyramid) {
				// Population pyramid uses dual xAxis (mirror axis)
				chartConfig.xAxis = [
					{
						categories: chartData.categories,
						reversed: false,
						labels: {
							step: 1
							// rotation: -45,
							// style: {
							// 	color: '#64748b',
							// 	fontSize: '11px'
							// },
							// y: 20,
							// reserveSpace: true
						},
						gridLineWidth: 1,
						gridLineColor: '#e2e8f0',
						lineColor: '#cbd5e1',
						tickColor: '#cbd5e1'
					},
					{
						// Mirror axis on right side
						opposite: true,
						reversed: false,
						categories: chartData.categories,
						linkedTo: 0,
						labels: {
							step: 1
							// rotation: 45,
							// style: {
							// 	color: '#64748b',
							// 	fontSize: '11px'
							// },
							// y: 20,
							// reserveSpace: true
						}
					}
				];
			} else {
				chartConfig.xAxis = xAxisConfig
					? {
							type: xAxisConfig.type || 'linear',
							min: xAxisConfig.min,
							max: xAxisConfig.max,
							title: xAxisConfig.title,
							labels: {
								formatter: xAxisConfig.labels?.formatter,
								style: {
									color: '#64748b',
									fontSize: '12px',
									...xAxisConfig.labels?.style
								}
							},
							tickInterval: xAxisConfig.tickInterval,
							gridLineWidth: xAxisConfig.gridLineWidth ?? 1,
							gridLineColor: '#e2e8f0',
							lineColor: '#cbd5e1',
							tickColor: '#cbd5e1',
							plotLines: xAxisConfig.plotLines || []
						}
					: {
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
						};
			}

			// Configure yAxis for pyramid or regular chart
			if (isPyramid) {
				chartConfig.yAxis = {
					title: {
						text: null
					},
					labels: {
						formatter: function (this: any) {
							return Math.abs(this.value);
						},
						style: {
							color: '#64748b',
							fontSize: '12px'
						}
					},
					gridLineColor: '#e2e8f0',
					lineColor: '#cbd5e1',
					tickColor: '#cbd5e1'
				};
			} else {
				chartConfig.yAxis = {
					title: {
						text: yAxisTitle,
						style: {
							color: '#64748b',
							fontSize: '12px',
							fontWeight: '500'
						}
					},
					plotLines: [...plotLines, ...(chartData.plotLines || [])],
					gridLineColor: '#e2e8f0',
					lineColor: '#cbd5e1',
					tickColor: '#cbd5e1',
					labels: {
						style: {
							color: '#64748b',
							fontSize: '12px'
						}
					}
				};
			}

			// Configure tooltip for pyramid or regular chart
			if (isPyramid) {
				chartConfig.tooltip = {
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					borderColor: '#e2e8f0',
					borderRadius: 8,
					shadow: true,
					style: {
						fontSize: '12px'
					},
					formatter: function (this: any) {
						return (
							`<b>${this.series.name}, age ${this.point.category}</b><br/>` +
							`Population: <b>${Math.abs(this.point.y).toFixed(2)}</b>`
						);
					}
				};
			} else {
				chartConfig.tooltip = {
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					borderColor: '#e2e8f0',
					borderRadius: 8,
					shadow: true,
					style: {
						fontSize: '12px'
					},
					formatter: function (this: any) {
						return `<b>${this.series.name}</b><br/>
                                ${this.x}: <b>${this.y}</b>`;
					}
				};
			}

			// Configure plotOptions
			if (isPyramid) {
				chartConfig.plotOptions = {
					...plotOptions,
					...(chartData.plotOptions || {}),
					series: {
						stacking: 'normal'
					},
					bar: {
						borderRadius: '50%',
						grouping: false
					}
				};
				// Increase height for pyramid charts and add bottom margin for x-axis labels
				// chartConfig.chart.height = 600;
				// chartConfig.chart.marginBottom = 80;
				// chartConfig.chart.spacingBottom = 20;
			} else {
				chartConfig.plotOptions = {
					...plotOptions,
					...(chartData.plotOptions || {}),
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
				};
			}

			// Configure series
			if (isPyramid) {
				chartConfig.series = chartData.series.map((serie: any, index: number) => ({
					...serie,
					color: serie.color || (index === 0 ? '#3b82f6' : '#ef4444')
				}));
			} else {
				chartConfig.series = chartData.series.map((serie: any, index: number) => ({
					...serie,
					color: serie.color || (index === 0 ? '#3b82f6' : '#10b981'),
					marker: {
						...serie.marker,
						fillColor: serie.color || (index === 0 ? '#3b82f6' : '#10b981'),
						lineColor: '#ffffff',
						lineWidth: 2,
						radius: 4
					}
				}));
			}

			// Configure legend
			chartConfig.legend = showLegend
				? {
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
					}
				: {
						enabled: false
					};

			chart = Highcharts.chart(chartContainer, chartConfig);

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

<div
	bind:this={chartContainer}
	class="w-full {isPyramid ? 'min-h-[600px]' : 'h-96 min-h-[400px]'}"
	style={isPyramid ? 'min-height: 450px;' : 'min-height: 400px;'}
>
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
