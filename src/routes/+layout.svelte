<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();
	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	{@render children?.()}

	<footer class=" bg-gradient-to-r from-blue-800 to-green-800 py-12 text-white">
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
				<p>&copy; {currentYear} ICIMOD. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
