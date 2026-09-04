<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { List, HomeIcon, ChevronDown, Maximize2, Minimize2 } from '@lucide/svelte';

	import '@arcgis/core/assets/esri/themes/light/main.css';

	let mapContainer: HTMLDivElement;
	let view: any = null;
	let isLoading = $state(true);
	let isFullscreen = $state(false);
	let wheelHandler: ((event: WheelEvent) => void) | null = null;
	let fullscreenHandler: (() => void) | null = null;
	let resizeObserver: ResizeObserver | null = null;

	// Camera parameters (used by the hidden debug overlay)
	let latitude = $state(0);
	let longitude = $state(0);
	let altitude = $state(0);
	let tilt = $state(0);
	let heading = $state(0);

	let layerVisibility = $state<Record<string, boolean>>({
		hkhOutline: true,
		// river: true, // Physiography sublayer id 3 — enable when river network is needed
		glacier: true,
		mountainRegion: false,
		nightTime: false
	});
	let legendCollapsed = $state(false);
	let hkhOutline: any;
	let physioLayer: any;
	let glacierLayer: any;
	let nightTimeLayer: any;

	const initialPosition = {
		position: {
			longitude: 84.130628,
			latitude: 2.984924,
			z: 6719155
		},
		tilt: 20,
		heading: 2.6 // Looking from the north
	};

	// Toggle layer visibility
	function toggleLayer(layerName: string) {
		layerVisibility[layerName] = !layerVisibility[layerName];

		if (layerName === 'hkhOutline' && hkhOutline) {
			const sublayer = hkhOutline.findSublayerById(0);
			if (sublayer) sublayer.visible = layerVisibility.hkhOutline;
		}

		if (layerName === 'mountainRegion' && physioLayer) {
			const sublayer = physioLayer.findSublayerById(4);
			if (sublayer) sublayer.visible = layerVisibility.mountainRegion;
		}
		if (layerName === 'glacier' && glacierLayer) {
			const sublayer = glacierLayer.findSublayerById(0);
			if (sublayer) sublayer.visible = layerVisibility.glacier;
		}
		if (layerName === 'nightTime' && nightTimeLayer) {
			const sublayer = nightTimeLayer.findSublayerById(7);
			if (sublayer) sublayer.visible = layerVisibility.nightTime;
		}
	}

	function getFullscreenElement() {
		return (
			document.fullscreenElement ||
			(document as any).webkitFullscreenElement ||
			(document as any).mozFullScreenElement ||
			(document as any).msFullscreenElement ||
			null
		);
	}

	async function toggleFullscreen() {
		if (!mapContainer) return;

		try {
			if (!getFullscreenElement()) {
				const request =
					mapContainer.requestFullscreen?.bind(mapContainer) ||
					(mapContainer as any).webkitRequestFullscreen?.bind(mapContainer) ||
					(mapContainer as any).mozRequestFullScreen?.bind(mapContainer) ||
					(mapContainer as any).msRequestFullscreen?.bind(mapContainer);
				await request?.();
			} else {
				const exit =
					document.exitFullscreen?.bind(document) ||
					(document as any).webkitExitFullscreen?.bind(document) ||
					(document as any).mozCancelFullScreen?.bind(document) ||
					(document as any).msExitFullscreen?.bind(document);
				await exit?.();
			}
		} catch (error) {
			console.error('Fullscreen error:', error);
		}
	}

	// Reset map to original camera position
	function resetMapView() {
		if (view && initialPosition) {
			view.goTo(initialPosition, {
				duration: 2000,
				easing: 'ease-out'
			});
		}
	}

	onMount(async () => {
		if (!browser) return;

		try {
			const [Map, SceneView, ElevationLayer, MapImageLayer, Legend] = await Promise.all([
				import('@arcgis/core/Map'),
				import('@arcgis/core/views/SceneView'),
				import('@arcgis/core/layers/ElevationLayer'),
				import('@arcgis/core/layers/MapImageLayer'),
				import('@arcgis/core/widgets/Legend')
			]);

			const elevationLayer = new ElevationLayer.default({
				url: '//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
			});

			hkhOutline = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Outline/MapServer',
				title: '',
				sublayers: [
					{
						id: 0,
						title: 'HKH Outline ',
						visible: true
					}
				]
			});

			physioLayer = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/Physiography/MapServer',
				title: '',
				sublayers: [
					{
						id: 4,
						title: 'Mountain Region',
						visible: layerVisibility.mountainRegion
					}
				]
			});

			glacierLayer = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/HKH/HKHGlacier/MapServer',
				title: '',
				sublayers: [
					{
						id: 0,
						title: 'Glacier 2020',
						visible: layerVisibility.glacier
					}
				]
			});

			nightTimeLayer = new MapImageLayer.default({
				url: 'https://geoapps.icimod.org/icimodarcgis/rest/services/RIS/HKH_Demography/MapServer',
				title: '',
				sublayers: [
					{
						id: 7,
						title: 'Night Light',
						visible: layerVisibility.nightTime
					}
				]
			});

			const map = new Map.default({
				basemap: 'satellite',
				ground: {
					layers: [elevationLayer],
					opacity: 1,
					surfaceColor: [255, 255, 255, 0]
				},
				layers: [nightTimeLayer, physioLayer, glacierLayer, hkhOutline]
			});

			view = new SceneView.default({
				container: mapContainer,
				map: map,
				qualityProfile: 'high',
				camera: {
					position: {
						longitude: 87,
						latitude: 30,
						z: 12000
					},
					tilt: 70
				}
			});

			const legend = new Legend.default({
				view: view,
				style: {
					type: 'classic',
					layout: 'auto'
				}
			});

			const legendContent = document.getElementById('legend-content');
			legend.container = legendContent;

			await view.when(() => {
				view.goTo(initialPosition);
			});

			view.navigation.mouseWheelZoomEnabled = false;

			const handleFullscreenChange = () => {
				isFullscreen = getFullscreenElement() === mapContainer;
			};
			fullscreenHandler = handleFullscreenChange;
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.addEventListener('mozfullscreenchange', handleFullscreenChange);
			document.addEventListener('MSFullscreenChange', handleFullscreenChange);

			// Keep SceneView in sync whenever the container size changes
			// (including enter/exit fullscreen).
			resizeObserver = new ResizeObserver(() => {
				if (view && typeof view.resize === 'function') {
					view.resize();
				}
			});
			resizeObserver.observe(mapContainer);

			wheelHandler = (event: WheelEvent) => {
				if (event.ctrlKey || event.metaKey || isFullscreen) {
					event.preventDefault();
					const delta = event.deltaY;
					const camera = view.camera.clone();
					const zoomFactor = delta > 0 ? 0.9 : 1.1;
					camera.position.z = camera.position.z * zoomFactor;
					view.goTo(camera, { duration: 0 });
				}
			};

			mapContainer.addEventListener('wheel', wheelHandler, { passive: false });

			isLoading = false;

			view.watch('camera', (camera: any) => {
				const point = camera.position;
				const spatialReference = view.spatialReference;
				const geographicPoint = point.clone();

				if (spatialReference.isWebMercator) {
					geographicPoint.spatialReference = spatialReference;
				}

				longitude = geographicPoint.longitude;
				latitude = geographicPoint.latitude;
				altitude = geographicPoint.z;
				tilt = camera.tilt;
				heading = camera.heading;
			});
		} catch (error) {
			isLoading = false;
			console.error('ArcGIS error:', error);
		}
	});

	onDestroy(() => {
		if (fullscreenHandler) {
			document.removeEventListener('fullscreenchange', fullscreenHandler);
			document.removeEventListener('webkitfullscreenchange', fullscreenHandler);
			document.removeEventListener('mozfullscreenchange', fullscreenHandler);
			document.removeEventListener('MSFullscreenChange', fullscreenHandler);
			fullscreenHandler = null;
		}
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if (mapContainer && wheelHandler) {
			mapContainer.removeEventListener('wheel', wheelHandler);
		}
		if (view && typeof view.destroy === 'function') {
			view.destroy();
			view = null;
		}
	});

	export { view, toggleLayer, layerVisibility };
</script>

<div
	class="map-3d-root map-container relative flex h-full items-center justify-center overflow-hidden rounded-[5px] bg-[#DCEAF5] sm:h-80 md:h-96 lg:h-[550px]"
	bind:this={mapContainer}
>
	{#if isLoading}
		<div class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"
				></div>
				<p class="text-gray-600">Loading 3D Map...</p>
			</div>
		</div>
	{/if}

	<div class="bg-opacity-80 absolute right-4 bottom-4 hidden rounded-lg bg-white p-3 text-sm shadow-md">
		<div class="grid grid-cols-2 gap-2">
			<div class="font-semibold">Latitude:</div>
			<div>{latitude.toFixed(6)}°</div>
			<div class="font-semibold">Longitude:</div>
			<div>{longitude.toFixed(6)}°</div>
			<div class="font-semibold">Altitude:</div>
			<div>{altitude?.toFixed(0) || 0} m</div>
			<div class="font-semibold">Tilt:</div>
			<div>{tilt?.toFixed(1) || 0}°</div>
			<div class="font-semibold">Heading:</div>
			<div>{heading?.toFixed(1) || 0}°</div>
		</div>
	</div>

	<!-- Home — beside ArcGIS zoom (top-left) -->
	<div class="absolute top-[15px] left-[60px] z-20 overflow-hidden shadow-md">
		<button
			type="button"
			class="flex size-8 cursor-pointer items-center justify-center bg-white text-gray-600 transition hover:bg-gray-50"
			onclick={resetMapView}
			title="Reset to Home View"
			aria-label="Reset to Home View"
		>
			<HomeIcon class="h-4 w-4" />
		</button>
	</div>

	<!-- Fullscreen — top-right -->
	<div class="absolute top-[15px] right-[15px] z-20 overflow-hidden shadow-md">
		<button
			type="button"
			class="flex size-8 cursor-pointer items-center justify-center bg-white text-gray-600 transition hover:bg-gray-50"
			onclick={toggleFullscreen}
			title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
			aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
		>
			{#if isFullscreen}
				<Minimize2 class="h-4 w-4" />
			{:else}
				<Maximize2 class="h-4 w-4" />
			{/if}
		</button>
	</div>

	<!-- Legend overlay -->
	<div
		class="absolute right-2 bottom-6 w-[150px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300"
		style="max-height: {legendCollapsed ? '37px' : '260px'}"
	>
		<button
			type="button"
			class="flex w-full cursor-pointer items-center justify-between gap-2 border-b border-[#E5EAF0] bg-[#F8FAFC] px-2.5 py-1.5"
			onclick={() => (legendCollapsed = !legendCollapsed)}
		>
			<span
				class="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#46637A] uppercase"
			>
				<List class="h-3.5 w-3.5" />
				Legend
			</span>
			<ChevronDown
				class="h-3.5 w-3.5 shrink-0 text-[#8A9BAD] transition-transform duration-200 {legendCollapsed
					? '-rotate-90'
					: ''}"
			/>
		</button>

		<div
			class="overflow-y-auto bg-white p-1.5 transition-all duration-300"
			style="max-height: {legendCollapsed ? '0px' : '220px'}"
		>
			<div id="legend-content"></div>
		</div>
	</div>
</div>

<style>
	/* Fill the real viewport while fullscreen — use 100vh/100vw so ArcGIS gets a non-zero size */
	:global(.map-3d-root:fullscreen),
	:global(.map-3d-root:-webkit-full-screen) {
		width: 100vw !important;
		height: 100vh !important;
		max-width: 100vw !important;
		max-height: 100vh !important;
		border-radius: 0 !important;
		background: #0b1a28;
	}

	:global(.map-3d-root:fullscreen .esri-view),
	:global(.map-3d-root:fullscreen .esri-view-root),
	:global(.map-3d-root:fullscreen .esri-view-surface),
	:global(.map-3d-root:-webkit-full-screen .esri-view),
	:global(.map-3d-root:-webkit-full-screen .esri-view-root),
	:global(.map-3d-root:-webkit-full-screen .esri-view-surface) {
		width: 100% !important;
		height: 100% !important;
		border-radius: 0 !important;
	}

	:global(.esri-view-root) {
		width: 100% !important;
		height: 100% !important;
		overflow: hidden !important;
		border-radius: 5px;
	}

	:global(.esri-view),
	:global(.esri-view-surface) {
		overflow: hidden !important;
		border-radius: 5px;
	}

	:global(#legend-content .esri-legend) {
		padding: 0 !important;
		font-family: inherit !important;
	}
	:global(#legend-content .esri-legend__service) {
		padding: 0 !important;
	}
	:global(#legend-content .esri-legend__layer) {
		margin-bottom: 3px !important;
	}
	:global(#legend-content .esri-legend__layer:last-child) {
		margin-bottom: 0 !important;
	}
	:global(#legend-content .esri-legend__layer-caption) {
		margin: 0 0 1px !important;
		padding: 0 !important;
		font-size: 10.5px !important;
		font-weight: 700 !important;
		color: #31506a !important;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	:global(#legend-content .esri-legend__layer-table),
	:global(#legend-content .esri-legend__layer-body) {
		margin: 0 !important;
		border-spacing: 0 !important;
	}
	:global(#legend-content .esri-legend__layer-child-table) {
		margin-bottom: 8px !important;
	}
	:global(#legend-content .esri-legend__layer-row) {
		line-height: 1.05 !important;
	}
	:global(#legend-content .esri-legend__layer-cell) {
		padding: 0 !important;
	}
	:global(#legend-content .esri-legend__layer-cell--symbols) {
		padding-right: 4px !important;
	}
	:global(#legend-content .esri-legend__layer-cell--info) {
		padding: 0 !important;
		font-size: 10.5px !important;
		color: #64788b !important;
	}
</style>
