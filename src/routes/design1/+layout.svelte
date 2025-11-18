<script lang="ts">
	import icimod from '$lib/assets/logo/logo-icimod_white.png';
	 
</script>

<header class="relative overflow-hidden  bg-blue-600 text-white">
    <div class="absolute inset-0 bg-black/20"></div>
    <div class="relative mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-24 items-center justify-between">
            <div class="flex items-center space-x-6">
                <div class="flex flex-col">
                     
                    <div class="text-3xl font-bold text-white">Hi-RIS: HKH Regional Information System</div>
                </div>
            </div>

            <div class="">
                <img src={icimod} alt="ICIMOD" class="h-7 w-auto" />
            </div>
        </div>
    </div>
</header>

<slot />