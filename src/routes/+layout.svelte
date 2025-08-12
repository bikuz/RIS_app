<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import icimod from '$lib/assets/logo/icimod_logo.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="border-b border-gray-200 bg-white shadow-sm">
		<div class=" mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex h-24 items-center justify-between">
				<!-- Left side - RDS Logo and Title -->
				<div class="flex items-center space-x-6">
					<div class="flex flex-col">
						<!-- <div
							class="scale-x-110 bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text
						text-6xl leading-none font-bold tracking-[0.1em] text-transparent"
						> -->
						<div
							class="ml-1 scale-x-110 bg-gradient-to-r from-blue-500 to-green-500
						bg-clip-text text-6xl leading-none font-bold tracking-[0.1em] text-transparent"
						>
							RIS
						</div>
						<div class="text-sm font-medium text-gray-600">Regional Information Service</div>
					</div>
				</div>

				<!-- Right side - ICIMOD Logo -->
				<div class="">
					<img src={icimod} alt="ICIMOD" class="h-7 w-auto" />
				</div>
			</div>
		</div>
	</header>

	{@render children?.()}
</div>
