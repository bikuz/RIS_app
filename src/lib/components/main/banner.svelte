
<script lang="ts">
    import banner from '$lib/assets/images/banner.jpg';
</script>

<section class=" relative overflow-hidden bg-cover bg-center bg-no-repeat text-white min-h-[400px]" 
  style="background-image: url({banner});">
    <!-- Dark gradient overlay from left to right -->
    <div class="absolute inset-0 bg-gradient-to-r from-gray-900/100 via-gray-900/20 to-transparent"></div>
    
    <div class="container mx-auto relative py-16 md:py-20 h-full flex items-center">
      <!-- Text container taking 1/3 of screen width on left side -->
      <div class="w-full md:w-2/5 text-left">
        <p class="text-xl md:text-2xl mb-8 text-white max-w-none leading-relaxed">
          RIS is a comprehensive platform that integrates, processes, and disseminates critical information 
          about the Hindu Kush Himalaya region. Our mission is to support evidence-based decision-making 
          through accessible, reliable, and timely regional data.
        </p>
      </div>
    </div>
  </section>