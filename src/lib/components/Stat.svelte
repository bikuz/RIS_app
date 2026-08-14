<script lang="ts">
	let { value, label, note }: { value: string; label: string; note: string } = $props();
</script>

<div class="border-l border-[#D8E1EA] pl-4">
	<div class="font-mono text-2xl font-bold tracking-tight text-[#17324D]">{value}</div>
	<div class="mt-1 text-sm font-medium text-[#46637A]">{label}</div>
	<div class="mt-1 text-[11px] text-[#8A9BAD]">{note}</div>
</div>
