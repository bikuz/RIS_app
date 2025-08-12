import { goto } from '$app/navigation';
import { Cloud, Users, Leaf, Snowflake, Sun, Mountain, Wind } from '@lucide/svelte';

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
	'air-quality': 'from-gray-500 to-slate-500'
};

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
