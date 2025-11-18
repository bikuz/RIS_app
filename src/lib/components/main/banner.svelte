
<script lang="ts">
    import banner from '$lib/assets/images/banner.jpg';
    import icimodLogo from '$lib/assets/logo/logo-icimod_white.png';
</script>

<section class=" relative overflow-hidden bg-cover bg-center  bg-gradient-to-r from-blue-800 to-green-800 bg-no-repeat text-white min-h-[250px]" 
  >
    <!-- Dark gradient overlay from left to right -->
    <div class="absolute inset-0 "></div>
    
    <!-- Title at top left corner -->
    <div class="absolute top-12 left-6 md:top-8 md:left-10 z-10">
        <h1 class="text-lg md:text-4xl font-bold text-white">Hi-RIS (HKH Regional Information System)</h1>
    </div>
    
    <!-- Logo at top right corner -->
    <div class="absolute top-4 right-4 md:top-6 md:right-6 z-10">
        <img src={icimodLogo} alt="ICIMOD Logo" class="h-6 md:h-10 w-auto" />
    </div>
    
    <div class="px-10 relative pt-12 md:pt-26 h-full flex items-center">
      <!-- Text container taking 1/3 of screen width on left side -->
      <div class="w-full md:w-1/5 text-left">
        <p class="text-xl md:text-2xl mb-8 text-white max-w-none leading-relaxed">
          A comprehensive platform that integrates crtical information about HKH region
           
        </p>
      </div>
    </div>
  </section>