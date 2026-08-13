import { goto } from '$app/navigation';
import { Cloud, Users, Leaf, Snowflake, Sun, Mountain, Wind, AlertTriangle } from '@lucide/svelte';
import { base } from '$app/paths';

export const topicDetail = {
	climate: 'Temperature trends, precipitation patterns, and climate change indicators',
	'human-dimensions': 'Population dynamics, migration patterns, and socio-economic indicators',
	ecosystem: 'Biodiversity, forest cover, and ecosystem health monitoring',
	cryosphere: 'Glacial dynamics, snow cover, and ice mass balance studies',
	weather: 'Real-time weather data, forecasting, and meteorological analysis',
	physiography: 'Topography, landforms, and geomorphological characteristics',
	'air-quality': 'Air pollution monitoring, atmospheric composition, and quality indices',
	disaster: 'Natural disaster monitoring, risk assessment, and hazard mapping'
};

export const topicIcons = {
	climate: Cloud,
	'human-dimensions': Users,
	ecosystem: Leaf,
	cryosphere: Snowflake,
	// weather: Sun,
	physiography: Mountain,
	// 'air-quality': Wind,
	disaster: AlertTriangle
};
export const topicColors = {
	climate: 'from-blue-500 to-cyan-500',
	'human-dimensions': 'from-purple-500 to-pink-500',
	ecosystem: 'from-emerald-500 to-[#7fac39]',
	cryosphere: 'from-cyan-500 to-blue-500',
	weather: 'from-yellow-500 to-orange-500',
	physiography: 'from-stone-500 to-amber-500',
	'air-quality': 'from-red-500 to-stone-500',
	disaster: 'from-[rgb(227,136,0)] to-[rgb(167,97,0)]'
};

export function selectTopic(topic: string) {
	goto(`${base}/thematic/${topic}`);
}

export function getTopicName(topic: string) {
	return topic
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export function getTopicIcon(topic: string) {
	return topicIcons[topic as keyof typeof topicIcons] || Cloud;
}

export function getTopicColor(topic: string): string {
	return topicColors[topic as keyof typeof topicColors] || 'from-gray-500 to-slate-500';
}
