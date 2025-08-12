<script lang="ts">
	import { onMount } from 'svelte';

	let { data }: { data: any } = $props();

	onMount(() => {
		if (data && typeof data.load === 'function') {
			data.load();
		}
	});
</script>

<div>Climate Layout</div>
