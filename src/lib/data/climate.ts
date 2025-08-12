import type { Topic, DropdownOption } from '$lib/types/question-types';

const areaOptions: DropdownOption[] = [
    { value: 'hkh', label: 'HKH Region' },
    { value: 'afghanistan', label: 'Afghanistan' },
    { value: 'bangladesh', label: 'Bangladesh' },
    { value: 'bhutan', label: 'Bhutan' },
    { value: 'china', label: 'China' },
    { value: 'india', label: 'India' },
    { value: 'myanmar', label: 'Myanmar' },
    { value: 'nepal', label: 'Nepal' },
    { value: 'pakistan', label: 'Pakistan' }
];

const timeRangeOptions: DropdownOption[] = [
    { value: '10', label: 'Last 10 years' },
    { value: '20', label: 'Last 20 years' },
    { value: '30', label: 'Last 30 years' }
];

export const clim: Topic = {
        'temp-trend-30': {
            config: {
                id: 'temp-trend-30',
                question: 'What is the annual average temperature trend over the past 30 years?',
                hint: 'It will describe whether temperatures have risen, fallen, or remained stable, possibly with a rate of change.',
                controls: [
                    {
                        id: 'area',
                        type: 'dropdown',
                        label: 'Area',
                        options: areaOptions,
                        defaultValue: 'hkh'
                    }
                ],
                hasMapVisualization: true,
                hasChartVisualization: true
            },
            answers: {
                'area:hkh': {
                    mapSummary: 'The map shows temperature trends across the HKH region over the past 30 years, revealing significant warming patterns in high-altitude areas with an average increase of 1.2°C.',
                    chartSummary: 'Time series analysis shows a consistent warming trend of 0.04°C per year across the HKH region, with accelerated warming since 2000.'
                },
                'area:nepal': {
                    mapSummary: 'Nepal shows pronounced warming in the high Himalayas with temperature increases of up to 2°C in some areas over the past 30 years.',
                    chartSummary: 'Nepal\'s temperature data reveals a warming rate of 0.06°C per year, higher than the global average.'
                }
            }
        },
        'temp-anomaly-global': {
            config: {
                id: 'temp-anomaly-global',
                question: 'How does the annual temperature anomaly compare to the global average?',
                hint: 'It will indicate if a region is warming faster, slower, or in line with the global average.',
                controls: [
                    {
                        id: 'area',
                        type: 'dropdown',
                        label: 'Area',
                        options: areaOptions,
                        defaultValue: 'hkh'
                    },
                    {
                        id: 'timeRange',
                        type: 'dropdown',
                        label: 'Time Period',
                        options: timeRangeOptions,
                        defaultValue: '30'
                    }
                ],
                hasMapVisualization: true,
                hasChartVisualization: true
            },
            answers: {
                'area:hkh,timeRange:30': {
                    mapSummary: 'The HKH region shows temperature anomalies 1.5 times higher than the global average over the past 30 years.',
                    chartSummary: 'Comparative analysis reveals the HKH region is warming at 0.04°C/year compared to the global average of 0.018°C/year.'
                }
            }
        },
        'temp-rise-threshold': {
            config: {
                id: 'temp-rise-threshold',
                question: 'Which areas have observed temperature rise more than how much (x) degrees in last 30 years?',
                hint: 'It will show regions where temperatures increased beyond the given threshold.',
                controls: [
                    {
                        id: 'area',
                        type: 'dropdown',
                        label: 'Area',
                        options: areaOptions,
                        defaultValue: 'hkh'
                    },
                    {
                        id: 'threshold',
                        type: 'slider',
                        label: 'Temperature Threshold',
                        defaultValue: 0.5,
                        min: 0.5,
                        max: 3.0,
                        step: 0.5
                    }
                ],
                hasMapVisualization: true,
                hasChartVisualization: true
            },
            answers: {
                'area:hkh,threshold:0.5': {
                    mapSummary: 'Areas in the HKH region showing temperature rise above 0.5°C include high-altitude zones in Nepal, Bhutan, and northern India.',
                    chartSummary: 'Statistical analysis shows 65% of the HKH region has experienced temperature increases above 0.5°C in the last 30 years.'
                },
                'area:hkh,threshold:1.0': {
                    mapSummary: 'Regions with temperature rise above 1.0°C are concentrated in the high Himalayas, particularly in glacier-adjacent areas.',
                    chartSummary: '35% of the HKH region shows temperature increases exceeding 1.0°C, primarily in elevations above 4000m.'
                }
            }
        },
        'rainfall-highest': {
            config: {
                id: 'rainfall-highest',
                question: 'Which areas have observed highest rainfall in last 30 years?',
                hint: 'It will show the regions with extreme precipitation trends.',
                controls: [
                    {
                        id: 'area',
                        type: 'dropdown',
                        label: 'Area',
                        options: areaOptions,
                        defaultValue: 'hkh'
                    },
                    {
                        id: 'season',
                        type: 'dropdown',
                        label: 'Seasons',
                        options: [
                            { value: 'spring', label: 'Spring' },
                            { value: 'summer', label: 'Summer' },
                            { value: 'monsoon', label: 'Monsoon' },
                            { value: 'winter', label: 'Winter' }
                        ],
                        defaultValue: 'monsoon'
                    }
                ],
                hasMapVisualization: true,
                hasChartVisualization: true
            },
            answers: {
                'area:hkh,season:monsoon': {
                    mapSummary: 'The highest rainfall during monsoon season is observed in the eastern Himalayas, particularly in Bhutan and eastern Nepal.',
                    chartSummary: 'Monsoon rainfall analysis shows peak precipitation of 3000-4000mm annually in the eastern HKH region.',
                    chartData: {
                        categories: [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                            'Oct', 'Nov', 'Dec'
                        ],
                        series: [{
                            name: 'Nepal',
                            data: [
                                16.0, 18.2, 23.1, 27.9, 32.2, 36.4, 39.8, 38.4, 35.5, 29.2,
                                22.0, 17.8
                            ]
                        }, {
                            name: 'Bhutan',
                            data: [
                                -2.9, -3.6, -0.6, 4.8, 10.2, 14.5, 17.6, 16.5, 12.0, 6.5,
                                2.0, -0.9
                            ]
                        }]
                    }
                },
                'area:hkh,season:winter': {
                    mapSummary: 'Winter rainfall patterns show different distribution with lower precipitation in the high-altitude regions.',
                    chartSummary: 'Winter season analysis shows reduced precipitation with peak values of 1000-1500mm annually in the eastern HKH region.',
                    chartData: {
                        categories: [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                            'Oct', 'Nov', 'Dec'
                        ],
                        series: [{
                            name: 'Nepal',
                            data: [
                                -2.9, -3.6, -0.6, 4.8, 10.2, 14.5, 17.6, 16.5, 12.0, 6.5,
                                2.0, -0.9
                            ]
                        }, {
                            name: 'Bhutan',
                            data: [
                                16.0, 18.2, 23.1, 27.9, 32.2, 36.4, 39.8, 38.4, 35.5, 29.2,
                                22.0, 17.8
                            ]
                        }]
                    }
                },
                'area:hkh,season:spring': {
                    mapSummary: 'Spring rainfall shows moderate precipitation patterns across the HKH region.',
                    chartSummary: 'Spring season data reveals moderate rainfall with gradual increase towards pre-monsoon period.',
                    chartData: {
                        categories: [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                            'Oct', 'Nov', 'Dec'
                        ],
                        series: [{
                            name: 'Nepal',
                            data: [
                                8.0, 12.2, 18.1, 22.9, 28.2, 32.4, 35.8, 34.4, 30.5, 25.2,
                                18.0, 12.8
                            ]
                        }, {
                            name: 'Bhutan',
                            data: [
                                5.1, 8.6, 12.6, 16.8, 20.2, 24.5, 27.6, 26.5, 22.0, 16.5,
                                10.0, 6.9
                            ]
                        }]
                    }
                },
                'area:hkh,season:summer': {
                    mapSummary: 'Summer rainfall patterns show high precipitation in the southern slopes of the Himalayas.',
                    chartSummary: 'Summer season analysis indicates peak rainfall activity with maximum precipitation during June-August.',
                    chartData: {
                        categories: [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                            'Oct', 'Nov', 'Dec'
                        ],
                        series: [{
                            name: 'Nepal',
                            data: [
                                20.0, 22.2, 28.1, 32.9, 38.2, 42.4, 45.8, 44.4, 40.5, 35.2,
                                28.0, 22.8
                            ]
                        }, {
                            name: 'Bhutan',
                            data: [
                                12.1, 15.6, 19.6, 24.8, 29.2, 34.5, 38.6, 37.5, 33.0, 27.5,
                                20.0, 15.9
                            ]
                        }]
                    }
                }
            }
        }
    }
 