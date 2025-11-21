// Merged map_layers from all thematic pages
// This object contains all map layer configurations extracted from:
// - climate/+page.svelte
// - ecosystem/+page.svelte
// - cryosphere/+page.svelte
// - physiography/+page.svelte
// - human-dimensions/+page.svelte

export const allMapLayers = {

	// basic_Layer:[
	// 	{
	// 		id: 'basic',
	// 		title: 'Basic Layer',		
	// 		map_layers: {
	// 			'hkh-outline': [
	// 				{
	// 					id: 'hkh-outline',
	// 					name: 'HKH Outline',
	// 					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
	// 					layerIndex: 0,
	// 					mapserver: 'arcgis'
	// 				}
	// 			]

	// 		}
	// 	},
	// ],

	// ========== CLIMATE LAYERS ==========
	climate: [
		{
			id: 'temp-trend-30y',
			title: 'Annual Temperature Trend ',		
			map_layers: {
				'0.5': [
					{
						id: 'temp-trend-0.5',
						name: 'Annual Temperature Trend (0.5)',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				'1.0': [
					{
						id: 'temp-trend-1',
						name: 'Annual Temperature Trend (1.0)',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				'1.5': [
					{
						id: 'temp-trend-1.5',
						name: 'Annual Temperature Trend (1.5)',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				],
				'2.0': [
					{
						id: 'temp-trend-2',
						name: 'Annual Temperature Trend (2.0)' ,
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 4,
						mapserver: 'arcgis'
					}
				],
				'2.5': [
					{
						id: 'temp-trend-2.5',
						name: 'Annual Temperature Trend (2.5)',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_30Years/MapServer',
						layerIndex: 5,
						mapserver: 'arcgis'
					}
				]
			}
		},
		// {
		// 	id: 'temp-rise-decade',
		// 	title: 'Regional Temperature Rise',
		// 	map_layers: {
		// 		'0.5': [
		// 			{
		// 				id: 'temp-trend-0.5',
		// 				name: 'Regional Temperature Trend (0.5)',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
		// 				layerIndex: 1,
		// 				mapserver: 'arcgis'
		// 			}
		// 		],
		// 		'1.0': [
		// 			{
		// 				id: 'temp-trend-1',
		// 				name: 'Regional Temperature Trend (1.0)',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
		// 				layerIndex: 2,
		// 				mapserver: 'arcgis'
		// 			}
		// 		],
		// 		'1.5': [
		// 			{
		// 				id: 'temp-trend-1.5',
		// 				name: 'Regional Temperature Trend (1.5)',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
		// 				layerIndex: 3,
		// 				mapserver: 'arcgis'
		// 			}
		// 		],
		// 		'2.0': [
		// 			{
		// 				id: 'temp-trend-2',
		// 				name: 'Regional Temperature Trend (2.0)',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
		// 				layerIndex: 4,
		// 				mapserver: 'arcgis'
		// 			}
		// 		],
		// 		'2.5': [
		// 			{
		// 				id: 'temp-trend-2.5 (2.5)',
		// 				name: 'Regional Temperature Trend',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend/MapServer',
		// 				layerIndex: 5,
		// 				mapserver: 'arcgis'
		// 			}
		// 		]
		// 	}
		// },
		{
			id: 'annual-temp-anamoly-series',
			title: 'Time Series Temperature Anomaly',
			map_layers: {
				'1995': [{
					id: 'temp-time-series-1995',
					name: 'Temperature Anamoly 1995',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 0,
					mapserver: 'arcgis'
				}],
				'1996': [{
					id: 'temp-time-series-1996',
					name: 'Temperature Anamoly 1996',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 1,
					mapserver: 'arcgis'
				}],
				'1997': [{
					id: 'temp-time-series-1997',
					name: 'Temperature Anamoly 1997',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 2,
					mapserver: 'arcgis'
				}],
				'1998': [{
					id: 'temp-time-series-1998',
					name: 'Temperature Anamoly 1998',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 3,
					mapserver: 'arcgis'
				}],
				'1999': [{
					id: 'temp-time-series-1999',
					name: 'Temperature Anamoly 1999',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 4,
					mapserver: 'arcgis'
				}],
				'2000': [{
					id: 'temp-time-series-2000',
					name: 'Temperature Anamoly 2000',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 5,
					mapserver: 'arcgis'
				}],
				'2001': [{
					id: 'temp-time-series-2001',
					name: 'Temperature Anamoly 2001',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 6,
					mapserver: 'arcgis'
				}],
				'2002': [{
					id: 'temp-time-series-2002',
					name: 'Temperature Anamoly 2002',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 7,
					mapserver: 'arcgis'
				}],
				'2003': [{
					id: 'temp-time-series-2003',
					name: 'Temperature Anamoly 2003',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 8,
					mapserver: 'arcgis'
				}],
				'2004': [{
					id: 'temp-time-series-2004',
					name: 'Temperature Anamoly 2004',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 9,
					mapserver: 'arcgis'
				}],
				'2005': [{
					id: 'temp-time-series-2005',
					name: 'Temperature Anamoly 2005',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 10,
					mapserver: 'arcgis'
				}],
				'2006': [{
					id: 'temp-time-series-2006',
					name: 'Temperature Anamoly 2006',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 11,
					mapserver: 'arcgis'
				}],
				'2007': [{
					id: 'temp-time-series-2007',
					name: 'Temperature Anamoly 2007',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 12,
					mapserver: 'arcgis'
				}],
				'2008': [{
					id: 'temp-time-series-2008',
					name: 'Temperature Anamoly 2008',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 13,
					mapserver: 'arcgis'
				}],
				'2009': [{
					id: 'temp-time-series-2009',
					name: 'Temperature Anamoly 2009',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 14,
					mapserver: 'arcgis'
				}],
				'2010': [{
					id: 'temp-time-series-2010',
					name: 'Temperature Anamoly 2010',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 15,
					mapserver: 'arcgis'
				}],
				'2011': [{
					id: 'temp-time-series-2011',
					name: 'Temperature Anamoly 2011',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 16,
					mapserver: 'arcgis'
				}],
				'2012': [{
					id: 'temp-time-series-2012',
					name: 'Temperature Anamoly 2012',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 17,
					mapserver: 'arcgis'
				}],
				'2013': [{
					id: 'temp-time-series-2013',
					name: 'Temperature Anamoly 2013',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 18,
					mapserver: 'arcgis'
				}],
				'2014': [{
					id: 'temp-time-series-2014',
					name: 'Temperature Anamoly 2014',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 19,
					mapserver: 'arcgis'
				}],
				'2015': [{
					id: 'temp-time-series-2015',
					name: 'Temperature Anamoly 2015',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 20,
					mapserver: 'arcgis'
				}],
				'2016': [{
					id: 'temp-time-series-2016',
					name: 'Temperature Anamoly 2016',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 21,
					mapserver: 'arcgis'
				}],
				'2017': [{
					id: 'temp-time-series-2017',
					name: 'Temperature Anamoly 2017',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 22,
					mapserver: 'arcgis'
				}],
				'2018': [{
					id: 'temp-time-series-2018',
					name: 'Temperature Anamoly 2018',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 23,
					mapserver: 'arcgis'
				}],
				'2019': [{
					id: 'temp-time-series-2019',
					name: 'Temperature Anamoly 2019',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 24,
					mapserver: 'arcgis'
				}],
				'2020': [{
					id: 'temp-time-series-2020',
					name: 'Temperature Anamoly 2020',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 25,
					mapserver: 'arcgis'
				}],
				'2021': [{
					id: 'temp-time-series-2021',
					name: 'Temperature Anamoly 2021',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 26,
					mapserver: 'arcgis'
				}],
				'2022': [{
					id: 'temp-time-series-2022',
					name: 'Temperature Anamoly 2022',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 27,
					mapserver: 'arcgis'
				}],
				'2023': [{
					id: 'temp-time-series-2023',
					name: 'Temperature Anamoly 2023',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 28,
					mapserver: 'arcgis'
				}],
				'2024': [{
					id: 'temp-time-series-2024',
					name: 'Temperature Anamoly 2024',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Anomaly/MapServer',
					layerIndex: 29,
					mapserver: 'arcgis'
				}]
			}
		},
		{
			id: 'seasonal-temp-trend',
			title: 'Seasonal Temperature Trend',
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'seasonal-overall-annual',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 0,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-overall-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 2,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-overall-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 4,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-overall-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 6,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-overall-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 8,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'seasonal-significant-annual',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 1,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'seasonal-significant-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 3,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'seasonal-significant-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 5,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'seasonal-significant-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 7,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'seasonal-significant-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Temperature_Trend_Decadal/MapServer',
							layerIndex: 9,
							mapserver: 'arcgis'
						}
					]
				}
			}
		},
		
		{
			id: 'seasonal-ppt-trend',
			title: 'Seasonal Precipitation Trend',
			 
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'ppt-trend-overall',
							name: 'Overall Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 0,
							mapserver: 'arcgis'
						}
					],
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
					annual: [
						{
							id: 'ppt-trend-significant',
							name: 'Significant Precipitation Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Trend_Decadal/MapServer',
							layerIndex: 5,
							mapserver: 'arcgis'
						}
					],
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
			}
		},
		{
			id: 'annual-ppt-anamoly-series',
			title: 'Time Series Precipitation Anomaly',
			description: 'Time series analysis of annual precipitation with temporal controls',
			 
			map_layers: {
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
					layerIndex: 15, // 15 is the layer index for 2010
					mapserver: 'arcgis'
				},
				'2011': {
					id: 'ppt-time-series-2011',
					name: 'Precipitation Anamoly 2011',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 16, // 16 is the layer index for 2011
					mapserver: 'arcgis'
				},
				'2012': {
					id: 'ppt-time-series-2012',
					name: 'Precipitation Anamoly 2012',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 17, // 17 is the layer index for 2012
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
					layerIndex: 19, // 19 is the layer index for 2014
					mapserver: 'arcgis'
				},
				'2015': {
					id: 'ppt-time-series-2015',
					name: 'Precipitation Anamoly 2015',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 20, // 20 is the layer index for 2015
					mapserver: 'arcgis'
				},
				'2016': {
					id: 'ppt-time-series-2016',
					name: 'Precipitation Anamoly 2016',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 21, // 21 is the layer index for 2016
					mapserver: 'arcgis'
				},
				'2017': {
					id: 'ppt-time-series-2017',
					name: 'Precipitation Anamoly 2017',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 22, // 22 is the layer index for 2017
					mapserver: 'arcgis'
				},
				'2018': {
					id: 'ppt-time-series-2018',
					name: 'Precipitation Anamoly 2018',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 23, // 23 is the layer index for 2018
					mapserver: 'arcgis'
				},
				'2019': {
					id: 'ppt-time-series-2019',
					name: 'Precipitation Anamoly 2019',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 24, // 24 is the layer index for 2019
					mapserver: 'arcgis'
				},
				'2020': {
					id: 'ppt-time-series-2020',
					name: 'Precipitation Anamoly 2020',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 25, // 25 is the layer index for 2020
					mapserver: 'arcgis'
				},
				'2021': {
					id: 'ppt-time-series-2021',
					name: 'Precipitation Anamoly 2021',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 26, // 26 is the layer index for 2021
					mapserver: 'arcgis'
				},
				'2022': {
					id: 'ppt-time-series-2022',
					name: 'Precipitation Anamoly 2022',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 27, // 27 is the layer index for 2022
					mapserver: 'arcgis'
				},
				'2023': {
					id: 'ppt-time-series-2023',
					name: 'Precipitation Anamoly 2023',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 28, // 28 is the layer index for 2023
					mapserver: 'arcgis'
				},
				'2024': {
					id: 'ppt-time-series-2024',
					name: 'Precipitation Anamoly 2024',
					url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Precipitation_Anomaly/MapServer',
					layerIndex: 29, // 29 is the layer index for 2024
					mapserver: 'arcgis'
				}
			}
		},
		{
			id: 'seasonal-snowfall-trend-10y',
			title: 'Seasonal Snowfall Trend Analysis of 10 Years',
			 
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
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
		{
			id: 'min-temp-trend-10y',
			title: 'Annual Minimum Temperature Trend Analysis of 10 Years',
		 
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'min-temp-trend-overall',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 0,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'min-temp-trend-overall-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 2,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'min-temp-trend-overall-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 4,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'min-temp-trend-overall-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 6,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'min-temp-trend-overall-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 8,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'min-temp-trend-significant',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 1,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'min-temp-trend-significant-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 3,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'min-temp-trend-significant-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 5,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'min-temp-trend-significant-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 7,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'min-temp-trend-significant-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 9,
							mapserver: 'arcgis'
						}
					]
				}
			}
		},
		{
			id: 'max-temp-trend-10y',
			title: 'Annual Maximum Temperature Trend Analysis of 10 Years',
		 
			map_layers: {
				// Nested structure: trend_analysis -> season -> layer_config
				overall: {
					annual: [
						{
							id: 'max-temp-trend-overall',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 10,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'max-temp-trend-overall-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 12,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'max-temp-trend-overall-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 14,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'max-temp-trend-overall-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 16,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'max-temp-trend-overall-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 18,
							mapserver: 'arcgis'
						}
					]
				},
				significant: {
					annual: [
						{
							id: 'max-temp-trend-significant',
							name: 'Annual Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 11,
							mapserver: 'arcgis'
						}
					],
					spring: [
						{
							id: 'max-temp-trend-significant-spring',
							name: 'Spring Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 13,
							mapserver: 'arcgis'
						}
					],
					summer: [
						{
							id: 'max-temp-trend-significant-summer',
							name: 'Summer Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 15,
							mapserver: 'arcgis'
						}
					],
					autumn: [
						{
							id: 'max-temp-trend-significant-autumn',
							name: 'Autumn Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 17,
							mapserver: 'arcgis'
						}
					],
					winter: [
						{
							id: 'max-temp-trend-significant-winter',
							name: 'Winter Temperature Trend',
							url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_MinMax_Temp_Trend_Decadal/MapServer',
							layerIndex: 19,
							mapserver: 'arcgis'
						}
					]
				}
			}
		}
	],

	// ========== ECOSYSTEM LAYERS ==========
	ecosystem: [
		{
			id: 'land-cover-2022',
			title: 'Land Cover 2022',
			 
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
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
			 
		},
		{
			id: 'browning-greening',
			title: 'Vegetation Health',
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
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
		},
		{
			id: 'ndvi-trend',
			title: 'NDVI Trend (2000-2023)',
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
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
		},
		{
			id: 'evi-trend',
			title: 'EVI Trend (2000-2023)',
			map_layers: {
				// For 'none' control type, you can use a simple structure
				// or just provide the layers directly
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
		},

		{
			id: 'soil-carbon-content',
			title: 'Soil Organic Carbon Content',
			map_layers: {
				'0': [
					{
						id: 'soil-carbon-content-0',
						name: 'At 0cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				],

				'30': [
					{
						id: 'soil-carbon-content-30',
						name: 'At 30cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 1,
						mapserver: 'arcgis'
					}
				],
				'60': [
					{
						id: 'soil-carbon-content-60',
						name: 'At 60cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				],
				'200': [
					{
						id: 'soil-carbon-content-200',
						name: 'At 200cm depth',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Soil_Carbon_Content/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				]
			}
		}
	],

	// ========== CRYOSPHERE LAYERS ==========
	cryosphere: [
		{
			id: 'glacier',
			title: 'Glacier',
			map_layers: {
				name: 'Glacier Numbers across HKH',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Glacier/MapServer',
				layer_id: 0,
				mapserver: 'arcgis'
			},
		},
		{
			id: 'glacial_lake',
			title: 'Glacier Lake',
			map_layers: {
				name: 'Glacial Lake',
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/GlacialLake/MapServer',
				layer_id: 0,
				mapserver: 'arcgis'
			},
		},
		{
			id: 'glof',
			title: 'Glacial Lake Outburst Flood (GLOF)',
			map_layers: {
				name: 'GLOFs',
				layer_id: 0,
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/GLOF/MapServer',
				mapserver: 'arcgis'
			},
		}
	],

	// ========== PHYSIOGRAPHY LAYERS ==========
	physiography: [
		{
			id: 'elevation',
			title: 'Elevation',
			map_layers: {
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
		},
		{
			id: 'mountain-region',
			title: 'Mountain Region',
			map_layers: {
				default: [
					{
						id: 'mountain-region-layer',
						name: 'Mountain Region',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
						layerIndex: '4',
						mapserver: 'arcgis'
					}
				]
			},
			 
		}
		 
	],

	// ========== HUMAN DIMENSIONS LAYERS ==========
	'human-dimensions': [
		{
			id: 'population-2025',
			title: 'Population 2025',
			map_layers: {
				default: [
					{
						id: 'population-2025-layer',
						name: 'Population 2025',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
						layerIndex: 0,
						mapserver: 'arcgis'
					}
				]
			},
		},
		{
			id: 'aged-75-proportion',
			title: 'Proportion of Population Aged >=75',
			map_layers: {
				default: [
					{
						id: 'aged-75-proportion-layer',
						name: 'Proportion of Population Aged >=75',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
						layerIndex: 2,
						mapserver: 'arcgis'
					}
				]
			},
			 
		},
		{
			id: 'child-woman-ratio-2025',
			title: 'Child Woman Ratio 2025',	
			map_layers: {
				default: [
					{
						id: 'child-woman-ratio-2025-layer',
						name: 'Child Woman Ratio 2025',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
						layerIndex: 3,
						mapserver: 'arcgis'
					}
				]
			},
			 
		},
		{
			id: 'child-dependency-ratio-2025',
			title: 'Child Dependency Ratio 2025',			
			map_layers: {
				default: [
					{
						id: 'child-dependency-ratio-2025-layer',
						name: 'Child Dependency Ratio 2025',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
						layerIndex: 4,
						mapserver: 'arcgis'
					}
				]
			},
			 
		},
		{
			id: 'age-dependency-ratio-2025',
			title: 'Age Dependency Ratio 2025',			
			map_layers: {
				default: [
					{
						id: 'age-dependency-ratio-2025-layer',
						name: 'Age Dependency Ratio 2025',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
						layerIndex: 5,
						mapserver: 'arcgis'
					}
				]
			},
			 
		},
		{
			id: 'total-dependency-ratio-2025',
			title: 'Total Dependency Ratio 2025',			
			map_layers: {
				default: [
					{
						id: 'total-dependency-ratio-2025-layer',
						name: 'Total Dependency Ratio 2025',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
						layerIndex: 6,
						mapserver: 'arcgis'
					}
				]
			},
			 
		},
		{
			id: 'impervious_surface',
			title: 'Impervious Surface',
			map_layers: {
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
			 
		},

		// {
		// 	id: 'urban-center',
		// 	title: 'Urban Center Location',
		// 	map_layers: {
		// 		default: [
		// 			{
		// 				id: 'urban-center-layer',
		// 				name: 'Urban Center Location',
		// 				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_HumanDimensions/MapServer',
		// 				layerIndex: 8,
		// 				mapserver: 'arcgis'
		// 			}
		// 		]
		// 	},
			 
		// },
		{
			id: 'night-light',
			title: 'Night Light',
			map_layers: {
				default: [
					{
						id: 'night-light-layer',
						name: 'Night Light',
						url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
						layerIndex: 7,
						mapserver: 'arcgis'
					}
				]
			},
			
			 
		}
	]
};

