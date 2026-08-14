export const themes = [
	{
		name: 'Climate',
		slug: 'climate',
		color: '#2563EB',
		soft: '#DBEAFE',
		icon: 'cloud-sun',
		description: 'Climate patterns, variability, and change across the region.'
	},
	{
		name: 'Human dimensions',
		slug: 'human-dimensions',
		color: '#C026D3',
		soft: '#FAE8FF',
		icon: 'users',
		description: 'People, settlements, livelihoods, and social vulnerability.'
	},
	{
		name: 'Ecosystem',
		slug: 'ecosystem',
		color: '#15803D',
		soft: '#DCFCE7',
		icon: 'sprout',
		description: 'Biodiversity, habitats, and the services ecosystems provide.'
	},
	{
		name: 'Cryosphere',
		slug: 'cryosphere',
		color: '#0891B2',
		soft: '#CFFAFE',
		icon: 'snowflake',
		description: 'Glaciers, snow, and the frozen water towers of Asia.'
	},
	{
		name: 'Physiography',
		slug: 'physiography',
		color: '#B45309',
		soft: '#FEF3C7',
		icon: 'mountain',
		description: 'Terrain, elevation, watersheds, and physical geography.'
	},
	{
		name: 'Disaster',
		slug: 'disaster',
		color: '#EA580C',
		soft: '#FFEDD5',
		icon: 'shield-alert',
		description: 'Hazards, exposure, and the risks shaping resilient futures.'
	}
] as const;

export type Theme = (typeof themes)[number];
