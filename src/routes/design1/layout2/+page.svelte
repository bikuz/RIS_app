<script lang="ts">
	import { Mountain, Globe, BarChart3, Map, Info } from '@lucide/svelte';
	import Hero from '$lib/components/main/Hero.svelte';
	import Banner from '$lib/components/main/banner.svelte';
	import ThematicGrid2 from '$lib/components/main/ThematicGrid2.svelte';
	import StatsOverview from '$lib/components/main/StatsOverview.svelte';
	import Intro from '$lib/components/main/intro.svelte';
    import Short_intro from '$lib/components/main/Short_intro.svelte';
	import RISIntroduction from '$lib/components/main/RISIntroduction.svelte';
	import HKHRegionInfo from '$lib/components/main/HKHRegionInfo.svelte';
	import HomepageMap from '$lib/components/main/HomepageMap.svelte';
	// import DashboardCharts from '$lib/components/DashboardCharts.svelte';

	
</script>

<svelte:head>
	<title>Regional Information Services - HKH Region</title>
	<meta name="description" content="Comprehensive regional information services for the Hindu Kush Himalaya region" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<!-- <link rel="stylesheet" href="https://js.arcgis.com/4.28/esri/themes/light/main.css"> -->
</svelte:head>
 
	<!-- <Hero /> -->
	<!-- <Banner /> -->
	<ThematicGrid2 />
     
    <!-- <Short_intro /> -->
	 
	 <!-- <Intro/> -->
	 <!-- <StatsOverview /> -->
	<!-- <RISIntroduction /> -->
	<!-- Moved ThematicGrid up and removed KeyFeatures -->
	
	<!-- Added HKH region infographics and information -->
	<HKHRegionInfo />
	<!-- Added interactive map section -->
	<!-- <HomepageMap /> -->
	<!-- Added dashboard charts section -->
	<!-- <DashboardCharts /> -->
 
