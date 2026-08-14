import { CloudSun, Mountain, ShieldAlert, Snowflake, Sprout, Users } from '@lucide/svelte';

export const themeIcons = {
	'cloud-sun': CloudSun,
	users: Users,
	sprout: Sprout,
	snowflake: Snowflake,
	mountain: Mountain,
	'shield-alert': ShieldAlert
} as const;
