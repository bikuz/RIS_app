<script lang="ts">
	import icimodLogo from '$lib/assets/logo/logo-icimod_white.png';
</script>

<section
	class="relative min-h-[250px] overflow-hidden bg-gradient-to-r from-blue-800 to-green-800 bg-cover bg-center bg-no-repeat text-white"
>
	<div class="absolute top-12 left-6 z-10 md:top-8 md:left-10">
		<h1 class="text-lg font-bold text-white md:text-4xl">
			Hi-RIS (HKH Regional Information System)
		</h1>
	</div>

	<div class="absolute top-4 right-4 z-10 md:top-6 md:right-6">
		<img src={icimodLogo} alt="ICIMOD Logo" class="h-6 w-auto md:h-10" />
	</div>

	<div class="relative flex h-full items-center px-10 pt-32 md:pt-26">
		<div class="w-full text-left md:w-1/5">
			<p class="mb-8 max-w-none text-base leading-relaxed text-white md:text-2xl">
				A comprehensive platform that integrates critical information about HKH region
			</p>
		</div>
	</div>
</section>
