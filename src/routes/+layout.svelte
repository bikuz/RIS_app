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
							class="ml-1 scale-x-110 bg-gradient-to-r from-blue-500 to-green-500
						bg-clip-text text-6xl leading-none font-bold tracking-[0.1em] text-transparent"
						>
							RIS
						</div> -->
						<div class="text-3xl font-bold text-[#036CB6]">HiRIS (HKH Regional Information System)</div>
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

	<footer class=" bg-gradient-to-r from-blue-600 to-green-600 py-12 text-white">
		<div class="container mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid gap-10 md:grid-cols-5">
				<div class="col-span-2">
					<div class="mb-4 flex items-center space-x-2">
						<!-- <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
								<Database class="w-5 h-5 text-white" />
							</div> -->
						<div>
							<h3 class="text-3xl font-bold">Hi-RIS</h3>
							<p class="text-sm  ">HKH Regional Information Services</p>
						</div>
					</div>
					<p class=" ">
						Providing access to comprehensive geospatial information from the Hindu Kush Himalaya
						region.
					</p>
				</div>
				<div>
					<!-- <h4 class="mb-4 text-lg font-semibold">Quick Links</h4>
					<ul class="space-y-2 ">
						<li><a href="/about" class="hover:text-white">About</a></li>
						<li><a href="/data-policy" class="hover:text-white">Data Policy</a></li>
						<li><a href="/api" class="hover:text-white">API Documentation</a></li>
						<li><a href="/contact" class="hover:text-white">Contact</a></li>
					</ul> -->
				</div>
				<div>
					<!-- <h4 class="mb-4 text-lg font-semibold">Resources</h4>
					<ul class="space-y-2 ">
						<li><a href="/tutorials" class="hover:text-white">Tutorials</a></li>
						<li><a href="/documentation" class="hover:text-white">Documentation</a></li>
						<li><a href="/support" class="hover:text-white">Support</a></li>
						<li><a href="/faq" class="hover:text-white">FAQ</a></li>
					</ul> -->
				</div>
				<div>
					<h4 class="mb-4 text-lg font-semibold">Connect</h4>
					<p class="mb-2">info@icimod.org</p>
					<p class=" ">ICIMOD, Nepal</p>
				</div>
			</div>
			<div class="border-white-800 mt-8 border-t pt-8 text-center">
				<p>&copy; 2024 ICIMOD. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
