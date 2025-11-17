// Merged map_layers from all thematic pages
// This object contains all map layer configurations extracted from:
// - climate/+page.svelte
// - ecosystem/+page.svelte
// - cryosphere/+page.svelte
// - physiography/+page.svelte
// - human-dimensions/+page.svelte

export const allMapLayers = {
	// ========== CLIMATE LAYERS ==========
	climate: {
		'temp-trend-10y': {
			overall: [
				{
					id: 'temp-trend-overall',
					name: 'Overall Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			],
			significant: [
				{
					id: 'temp-trend-significant',
					name: 'Significant Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				}
			]
		},
		'temp-trend-30y': {
			'0.5': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				}
			],
			'1': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
					layerIndex: 2,
					mapserver: 'arcgis'
				}
			],
			'1.5': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
					layerIndex: 3,
					mapserver: 'arcgis'
				}
			],
			'2': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
					layerIndex: 4,
					mapserver: 'arcgis'
				}
			],
			'2.5': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				}
			]
		},
		'temp-rise-decade': {
			'0.5': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				}
			],
			'1': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
					layerIndex: 2,
					mapserver: 'arcgis'
				}
			],
			'1.5': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
					layerIndex: 3,
					mapserver: 'arcgis'
				}
			],
			'2': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
					layerIndex: 4,
					mapserver: 'arcgis'
				}
			],
			'2.5': [
				{
					id: 'temp-trend-0.5',
					name: 'Annual Temperature Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				}
			]
		},
		'annual-temp-anamoly-series': {
			'1995': {
				id: 'temp-time-series-1995',
				name: 'Temperature Anamoly 1995',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 0,
				mapserver: 'arcgis'
			},
			'1996': {
				id: 'temp-time-series-1996',
				name: 'Temperature Anamoly 1996',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 1,
				mapserver: 'arcgis'
			},
			'1997': {
				id: 'temp-time-series-1997',
				name: 'Temperature Anamoly 1997',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 2,
				mapserver: 'arcgis'
			},
			'1998': {
				id: 'temp-time-series-1998',
				name: 'Temperature Anamoly 1998',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 3,
				mapserver: 'arcgis'
			},
			'1999': {
				id: 'temp-time-series-1999',
				name: 'Temperature Anamoly 1999',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 4,
				mapserver: 'arcgis'
			},
			'2000': {
				id: 'temp-time-series-2000',
				name: 'Temperature Anamoly 2000',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 5,
				mapserver: 'arcgis'
			},
			'2001': {
				id: 'temp-time-series-2001',
				name: 'Temperature Anamoly 2001',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 6,
				mapserver: 'arcgis'
			},
			'2002': {
				id: 'temp-time-series-2002',
				name: 'Temperature Anamoly 2002',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 7,
				mapserver: 'arcgis'
			},
			'2003': {
				id: 'temp-time-series-2003',
				name: 'Temperature Anamoly 2003',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 8,
				mapserver: 'arcgis'
			},
			'2004': {
				id: 'temp-time-series-2004',
				name: 'Temperature Anamoly 2004',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 9,
				mapserver: 'arcgis'
			},
			'2005': {
				id: 'temp-time-series-2005',
				name: 'Temperature Anamoly 2005',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 10,
				mapserver: 'arcgis'
			},
			'2006': {
				id: 'temp-time-series-2006',
				name: 'Temperature Anamoly 2006',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 11,
				mapserver: 'arcgis'
			},
			'2007': {
				id: 'temp-time-series-2007',
				name: 'Temperature Anamoly 2007',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 12,
				mapserver: 'arcgis'
			},
			'2008': {
				id: 'temp-time-series-2008',
				name: 'Temperature Anamoly 2008',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 13,
				mapserver: 'arcgis'
			},
			'2009': {
				id: 'temp-time-series-2009',
				name: 'Temperature Anamoly 2009',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 14,
				mapserver: 'arcgis'
			},
			'2010': {
				id: 'temp-time-series-2010',
				name: 'Temperature Anamoly 2010',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 15,
				mapserver: 'arcgis'
			},
			'2011': {
				id: 'temp-time-series-2011',
				name: 'Temperature Anamoly 2011',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 16,
				mapserver: 'arcgis'
			},
			'2012': {
				id: 'temp-time-series-2012',
				name: 'Temperature Anamoly 2012',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 17,
				mapserver: 'arcgis'
			},
			'2013': {
				id: 'temp-time-series-2013',
				name: 'Temperature Anamoly 2013',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 18,
				mapserver: 'arcgis'
			},
			'2014': {
				id: 'temp-time-series-2014',
				name: 'Temperature Anamoly 2014',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 19,
				mapserver: 'arcgis'
			},
			'2015': {
				id: 'temp-time-series-2015',
				name: 'Temperature Anamoly 2015',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 20,
				mapserver: 'arcgis'
			},
			'2016': {
				id: 'temp-time-series-2016',
				name: 'Temperature Anamoly 2016',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 21,
				mapserver: 'arcgis'
			},
			'2017': {
				id: 'temp-time-series-2017',
				name: 'Temperature Anamoly 2017',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 22,
				mapserver: 'arcgis'
			},
			'2018': {
				id: 'temp-time-series-2018',
				name: 'Temperature Anamoly 2018',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 23,
				mapserver: 'arcgis'
			},
			'2019': {
				id: 'temp-time-series-2019',
				name: 'Temperature Anamoly 2019',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 24,
				mapserver: 'arcgis'
			},
			'2020': {
				id: 'temp-time-series-2020',
				name: 'Temperature Anamoly 2020',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 25,
				mapserver: 'arcgis'
			},
			'2021': {
				id: 'temp-time-series-2021',
				name: 'Temperature Anamoly 2021',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 26,
				mapserver: 'arcgis'
			},
			'2022': {
				id: 'temp-time-series-2022',
				name: 'Temperature Anamoly 2022',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 27,
				mapserver: 'arcgis'
			},
			'2023': {
				id: 'temp-time-series-2023',
				name: 'Temperature Anamoly 2023',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 28,
				mapserver: 'arcgis'
			},
			'2024': {
				id: 'temp-time-series-2024',
				name: 'Temperature Anamoly 2024',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
				layerIndex: 29,
				mapserver: 'arcgis'
			}
		},
		'seasonal-temp-trend': {
			overall: {
				spring: [
					{
						id: 'seasonal-overall-spring',
						name: 'Spring Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				summer: [
					{
						id: 'seasonal-overall-summer',
						name: 'Summer Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				autumn: [
					{
						id: 'seasonal-overall-autumn',
						name: 'Autumn Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				],
				winter: [
					{
						id: 'seasonal-overall-winter',
						name: 'Winter Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 4,
						mapserver: 'arcgis'
					}
				]
			},
			significant: {
				spring: [
					{
						id: 'seasonal-significant-spring',
						name: 'Spring Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 8,
						mapserver: 'arcgis'
					}
				],
				summer: [
					{
						id: 'seasonal-significant-summer',
						name: 'Summer Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 7,
						mapserver: 'arcgis'
					}
				],
				autumn: [
					{
						id: 'seasonal-significant-autumn',
						name: 'Autumn Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 9,
						mapserver: 'arcgis'
					}
				],
				winter: [
					{
						id: 'seasonal-significant-winter',
						name: 'Winter Temperature Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
						layerIndex: 6,
						mapserver: 'arcgis'
					}
				]
			}
		},
		'ppt-trend-10y': {
			overall: [
				{
					id: 'ppt-trend-overall',
					name: 'Overall Precipitation Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			],
			significant: [
				{
					id: 'ppt-trend-significant',
					name: 'Significant Precipitation Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				}
			]
		},
		'seasonal-ppt-trend': {
			overall: {
				spring: [
					{
						id: 'seasonal-ppt-overall-spring',
						name: 'Spring Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				summer: [
					{
						id: 'seasonal-ppt-overall-summer',
						name: 'Summer Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				autumn: [
					{
						id: 'seasonal-ppt-overall-autumn',
						name: 'Autumn Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				],
				winter: [
					{
						id: 'seasonal-ppt-overall-winter',
						name: 'Winter Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 4,
						mapserver: 'arcgis'
					}
				]
			},
			significant: {
				spring: [
					{
						id: 'seasonal-ppt-significant-spring',
						name: 'Spring Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 6,
						mapserver: 'arcgis'
					}
				],
				summer: [
					{
						id: 'seasonal-ppt-significant-summer',
						name: 'Summer Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 7,
						mapserver: 'arcgis'
					}
				],
				autumn: [
					{
						id: 'seasonal-ppt-significant-autumn',
						name: 'Autumn Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 8,
						mapserver: 'arcgis'
					}
				],
				winter: [
					{
						id: 'seasonal-ppt-significant-winter',
						name: 'Winter Precipitation Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
						layerIndex: 9,
						mapserver: 'arcgis'
					}
				]
			}
		},
		'annual-ppt-anamoly-series': {
			'1995': {
				id: 'ppt-time-series-1995',
				name: 'Precipitation Anamoly 1995',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 0,
				mapserver: 'arcgis'
			},
			'1996': {
				id: 'ppt-time-series-1996',
				name: 'Precipitation Anamoly 1996',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 1,
				mapserver: 'arcgis'
			},
			'1997': {
				id: 'ppt-time-series-1997',
				name: 'Precipitation Anamoly 1997',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 2,
				mapserver: 'arcgis'
			},
			'1998': {
				id: 'ppt-time-series-1998',
				name: 'Precipitation Anamoly 1998',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 3,
				mapserver: 'arcgis'
			},
			'1999': {
				id: 'ppt-time-series-1999',
				name: 'Precipitation Anamoly 1999',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 4,
				mapserver: 'arcgis'
			},
			'2000': {
				id: 'ppt-time-series-2000',
				name: 'Precipitation Anamoly 2000',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 5,
				mapserver: 'arcgis'
			},
			'2001': {
				id: 'ppt-time-series-2001',
				name: 'Precipitation Anamoly 2001',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 6,
				mapserver: 'arcgis'
			},
			'2002': {
				id: 'ppt-time-series-2002',
				name: 'Precipitation Anamoly 2002',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 7,
				mapserver: 'arcgis'
			},
			'2003': {
				id: 'ppt-time-series-2003',
				name: 'Precipitation Anamoly 2003',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 8,
				mapserver: 'arcgis'
			},
			'2004': {
				id: 'ppt-time-series-2004',
				name: 'Precipitation Anamoly 2004',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 9,
				mapserver: 'arcgis'
			},
			'2005': {
				id: 'ppt-time-series-2005',
				name: 'Precipitation Anamoly 2005',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 10,
				mapserver: 'arcgis'
			},
			'2006': {
				id: 'ppt-time-series-2006',
				name: 'Precipitation Anamoly 2006',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 11,
				mapserver: 'arcgis'
			},
			'2007': {
				id: 'ppt-time-series-2007',
				name: 'Precipitation Anamoly 2007',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 12,
				mapserver: 'arcgis'
			},
			'2008': {
				id: 'ppt-time-series-2008',
				name: 'Precipitation Anamoly 2008',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 13,
				mapserver: 'arcgis'
			},
			'2009': {
				id: 'ppt-time-series-2009',
				name: 'Precipitation Anamoly 2009',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 14,
				mapserver: 'arcgis'
			},
			'2010': {
				id: 'ppt-time-series-2010',
				name: 'Precipitation Anamoly 2010',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 15,
				mapserver: 'arcgis'
			},
			'2011': {
				id: 'ppt-time-series-2011',
				name: 'Precipitation Anamoly 2011',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 16,
				mapserver: 'arcgis'
			},
			'2012': {
				id: 'ppt-time-series-2012',
				name: 'Precipitation Anamoly 2012',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 17,
				mapserver: 'arcgis'
			},
			'2013': {
				id: 'ppt-time-series-2013',
				name: 'Precipitation Anamoly 2013',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 18,
				mapserver: 'arcgis'
			},
			'2014': {
				id: 'ppt-time-series-2014',
				name: 'Precipitation Anamoly 2014',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 19,
				mapserver: 'arcgis'
			},
			'2015': {
				id: 'ppt-time-series-2015',
				name: 'Precipitation Anamoly 2015',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 20,
				mapserver: 'arcgis'
			},
			'2016': {
				id: 'ppt-time-series-2016',
				name: 'Precipitation Anamoly 2016',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 21,
				mapserver: 'arcgis'
			},
			'2017': {
				id: 'ppt-time-series-2017',
				name: 'Precipitation Anamoly 2017',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 22,
				mapserver: 'arcgis'
			},
			'2018': {
				id: 'ppt-time-series-2018',
				name: 'Precipitation Anamoly 2018',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 23,
				mapserver: 'arcgis'
			},
			'2019': {
				id: 'ppt-time-series-2019',
				name: 'Precipitation Anamoly 2019',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 24,
				mapserver: 'arcgis'
			},
			'2020': {
				id: 'ppt-time-series-2020',
				name: 'Precipitation Anamoly 2020',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 25,
				mapserver: 'arcgis'
			},
			'2021': {
				id: 'ppt-time-series-2021',
				name: 'Precipitation Anamoly 2021',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 26,
				mapserver: 'arcgis'
			},
			'2022': {
				id: 'ppt-time-series-2022',
				name: 'Precipitation Anamoly 2022',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 27,
				mapserver: 'arcgis'
			},
			'2023': {
				id: 'ppt-time-series-2023',
				name: 'Precipitation Anamoly 2023',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 28,
				mapserver: 'arcgis'
			},
			'2024': {
				id: 'ppt-time-series-2024',
				name: 'Precipitation Anamoly 2024',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
				layerIndex: 29,
				mapserver: 'arcgis'
			}
		},
		'seasonal-snowfall-trend-10y': {
			overall: {
				annual: [
					{
						id: 'seasonal-overall-annual',
						name: 'Annual Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				],
				spring: [
					{
						id: 'seasonal-overall-spring',
						name: 'Spring Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				summer: [
					{
						id: 'seasonal-overall-summer',
						name: 'Summer Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				],
				autumn: [
					{
						id: 'seasonal-overall-autumn',
						name: 'Autumn Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				winter: [
					{
						id: 'seasonal-overall-winter',
						name: 'Winter Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 4,
						mapserver: 'arcgis'
					}
				]
			},
			significant: {
				annual: [
					{
						id: 'seasonal-significant-annual',
						name: 'Annual Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 5,
						mapserver: 'arcgis'
					}
				],
				spring: [
					{
						id: 'seasonal-significant-spring',
						name: 'Spring Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 6,
						mapserver: 'arcgis'
					}
				],
				summer: [
					{
						id: 'seasonal-significant-summer',
						name: 'Summer Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 7,
						mapserver: 'arcgis'
					}
				],
				autumn: [
					{
						id: 'seasonal-significant-autumn',
						name: 'Autumn Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 8,
						mapserver: 'arcgis'
					}
				],
				winter: [
					{
						id: 'seasonal-significant-winter',
						name: 'Winter Snowfall Trend',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Snowfall/MapServer',
						layerIndex: 9,
						mapserver: 'arcgis'
					}
				]
			}
		}
	},

	// ========== ECOSYSTEM LAYERS ==========
	ecosystem: {
		'land-cover-2022': {
			default: [
				{
					id: 'land-cover-2022-layer',
					name: 'Land Cover 2022',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Landcover/MapServer/',
					layerIndex: 21,
					mapserver: 'arcgis'
				}
			]
		},
		'browning-greening': {
			default: [
				{
					id: 'browning-greening-layer',
					name: 'Vegetation Health',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_NDVI_EVI/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			]
		},
		'ndvi-trend': {
			default: [
				{
					id: 'ndvi-trend-layer',
					name: 'NDVI Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_NDVI_EVI/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				}
			]
		},
		'evi-trend': {
			default: [
				{
					id: 'evi-trend-layer',
					name: 'EVI Trend',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_NDVI_EVI/MapServer',
					layerIndex: 2,
					mapserver: 'arcgis'
				}
			]
		},
		'soil-carbon-content': {
			'0': [
				{
					id: 'soil-carbon-content-0',
					name: 'Soil Organic Carbon Content at 0cm depth(g/kg)',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			],
			'30': [
				{
					id: 'soil-carbon-content-30',
					name: 'Soil Organic Carbon Content at 30cm depth(g/kg)',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				}
			],
			'60': [
				{
					id: 'soil-carbon-content-60',
					name: 'Soil Organic Carbon Content at 60cm depth(g/kg)',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
					layerIndex: 2,
					mapserver: 'arcgis'
				}
			],
			'200': [
				{
					id: 'soil-carbon-content-200',
					name: 'Soil Organic Carbon Content at 200cm depth(g/kg)',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
					layerIndex: 3,
					mapserver: 'arcgis'
				}
			]
		}
	},

	// ========== CRYOSPHERE LAYERS ==========
	cryosphere: {
		'glacier': {
			default: [
				{
					id: 'glacier-layer',
					name: 'Glacier Numbers across HKH',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Glacier/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			]
		},
		'glacial_lake': {
			default: [
				{
					id: 'glacial-lake-layer',
					name: 'Glacial Lake',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/GlacialLake/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			]
		},
		'glof': {
			default: [
				{
					id: 'glof-layer',
					name: 'GLOFs',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/GLOF/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			]
		}
	},

	// ========== PHYSIOGRAPHY LAYERS ==========
	physiography: {
		'elevation': {
			default: [
				{
					id: 'elevation-layer',
					name: 'Elevation(DEM 90m)',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
					layerIndex: '5',
					mapserver: 'arcgis'
				}
			]
		},
		'mountain-region': {
			default: [
				{
					id: 'mountain-region-layer',
					name: 'Mountain Region',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
					layerIndex: '4',
					mapserver: 'arcgis'
				}
			]
		}
	},

	// ========== HUMAN DIMENSIONS LAYERS ==========
	'human-dimensions': {
		'population-2025': {
			default: [
				{
					id: 'population-2025-layer',
					name: 'Population Trends across HKH',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				}
			]
		},
		'sex-ratio-2025': {
			default: [
				{
					id: 'sex-ratio-2025-layer',
					name: 'Sex Ratio 2025',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				}
			]
		},
		'impervious_surface': {
			default: [
				{
					id: 'impervious-surface-layer',
					name: 'Impervious Surface',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_HumanDimensions/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}
			]
		},
		'urban-center': {
			default: [
				{
					id: 'urban-center-layer',
					name: 'Urban Center Location',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
					layerIndex: 8,
					mapserver: 'arcgis'
				}
			]
		}
	}
};

