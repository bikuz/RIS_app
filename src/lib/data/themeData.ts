import { goto } from '$app/navigation';
import { Cloud, Users, Leaf, Snowflake, Sun, Mountain, Wind } from '@lucide/svelte';

export const topicDetail ={
	climate: 'Temperature trends, precipitation patterns, and climate change indicators',
	demography: 'Population dynamics, migration patterns, and socio-economic indicators',
	ecosystem: 'Biodiversity, forest cover, and ecosystem health monitoring',
	cryosphere: 'Glacial dynamics, snow cover, and ice mass balance studies',
	weather: 'Real-time weather data, forecasting, and meteorological analysis',
	physiography: 'Topography, landforms, and geomorphological characteristics',
	'air-quality':'Air pollution monitoring, atmospheric composition, and quality indices',
}

export const topicIcons = {
	climate: Cloud,
	demography: Users,
	ecosystem: Leaf,
	cryosphere: Snowflake,
	weather: Sun,
	physiography: Mountain,
	'air-quality': Wind
};
export const topicColors = {
	climate: 'from-blue-500 to-cyan-500',
	demography: 'from-purple-500 to-pink-500',
	ecosystem: 'from-[#b1d777] to-emerald-500',
	cryosphere: 'from-cyan-500 to-blue-500',
	weather: 'from-yellow-500 to-orange-500',
	physiography: 'from-stone-500 to-amber-500',
	'air-quality': 'from-red-500 to-stone-500'
};

export const topicHoverColors = {
	climate: 'from-blue-600 to-cyan-600',
	demography: 'from-purple-600 to-pink-600',
	ecosystem: 'from-[#8cab5c] to-emerald-600',
	cryosphere: 'from-cyan-600 to-blue-600',
	weather: 'from-yellow-600 to-orange-600',
	physiography: 'from-stone-600 to-amber-600',
	'air-quality': 'from-red-600 to-stone-600'
};
export const topicAbstracts = [
	{
		topic: 'climate',
		abstract:
			"Climate is the long-term pattern of weather conditions in a region. It is influenced by a combination of factors, including the Earth's orbit, the tilt of its axis, and the amount of solar radiation it receives. Climate can be described in terms of temperature, precipitation, and other weather variables.",
		images: ['img1.png', 'img2.png', 'img3.png']
	},
	{
		topic: 'demography',
		abstract:
			'Demography is the study of human populations. It is concerned with the size, structure, and distribution of populations, as well as the factors that influence them. Demography is used to understand the relationship between population and the environment, and to develop policies and interventions to address population-related issues.',
		images: ['img1.png', 'img2.png', 'img3.png']
	}
];

export function selectTopic(topic: string) {
	goto(`/thematic/${topic}`);
}

export function getTopicName(topic: string) {
	return topic.charAt(0).toUpperCase() + topic.slice(1).replace('-', ' ');
}

export function getTopicIcon(topic: string) {
	return topicIcons[topic as keyof typeof topicIcons] || Cloud;
}

export function getTopicColor(topic: string): string {
	return topicColors[topic as keyof typeof topicColors] || 'from-gray-500 to-slate-500';
}

export function getTopicHoverColor(topic: string): string {
	return topicColors[topic as keyof typeof topicHoverColors] || 'from-gray-600 to-slate-600';
}

// export function getTopicDetail(topic: string): string {
// 	return thematicAreas[topic as keyof typeof topicHoverColors] || 'from-gray-600 to-slate-600';
// }