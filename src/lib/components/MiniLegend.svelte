<script lang="ts">
	let { color = '#2563EB', label = 'Regional intensity' }: { color?: string; label?: string } = $props();
</script>

<div class="flex items-center gap-2 text-[11px] text-[#64788B]">
	<span class="legend-ramp" style="background: linear-gradient(90deg, {color}20, {color}55, {color})"></span>
	<span>Low</span><span>•</span><span>High</span>
	<span class="ml-1 font-medium text-[#46637A]">{label}</span>
</div>
