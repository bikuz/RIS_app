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
			<div class="grid gap-10 md:grid-cols-3">
				<div class="md:col-span-2">
					<div class="mb-4">
						<h3 class="text-3xl font-bold">Hi-RIS</h3>
						<p class="text-sm">HKH Regional Information Services</p>
					</div>
					<p>
						Providing access to comprehensive geospatial information from the Hindu Kush Himalaya
						region.
					</p>
					<!-- Planned footer sections: About, Data Policy, API, Contact, Tutorials, Documentation, Support, FAQ -->
				</div>
				<div>
					<h4 class="mb-4 text-lg font-semibold">Connect</h4>
					<p class="mb-2">info@icimod.org</p>
					<p>ICIMOD, Nepal</p>
				</div>
			</div>
			<div class="border-white-800 mt-8 border-t pt-8 text-center">
				<p>&copy; {currentYear} ICIMOD. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
