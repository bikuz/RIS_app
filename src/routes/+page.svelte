<script lang="ts">
	import { Mountain, Globe, BarChart3, Map, Info } from '@lucide/svelte';
	import Hero from '$lib/components/main/Hero.svelte';
	import ThematicGrid from '$lib/components/main/ThematicGrid.svelte';
	import StatsOverview from '$lib/components/main/StatsOverview.svelte';
	import Intro from '$lib/components/main/intro.svelte';
	import RISIntroduction from '$lib/components/main/RISIntroduction.svelte';
	import HKHRegionInfo from '$lib/components/main/HKHRegionInfo.svelte';
	import HomepageMap from '$lib/components/main/HomepageMap.svelte';
	// import DashboardCharts from '$lib/components/DashboardCharts.svelte';
</script>

<svelte:head>
	<title>Regional Information Services - HKH Region</title>
	<meta name="description" content="Comprehensive regional information services for the Hindu Kush Himalaya region" />
</svelte:head>
 
	<!-- <Hero /> -->
	<!-- <StatsOverview /> -->
	<!-- Added detailed RIS introduction section -->
	 <Intro/>
	<!-- <RISIntroduction /> -->
	<!-- Moved ThematicGrid up and removed KeyFeatures -->
	<ThematicGrid />
	<!-- Added HKH region infographics and information -->
	<!-- <HKHRegionInfo /> -->
	<!-- Added interactive map section -->
	<!-- <HomepageMap /> -->
	<!-- Added dashboard charts section -->
	<!-- <DashboardCharts /> -->
 
