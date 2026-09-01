<script lang="ts">
	let { source }: { source: string } = $props();

	const URL_REGEX = /(https?:\/\/[^\s)]+)/g;

	type SourcePart = { type: 'text' | 'link'; value: string };

	function linkify(text: string): SourcePart[] {
		const parts: SourcePart[] = [];
		let lastIndex = 0;

		for (const match of text.matchAll(URL_REGEX)) {
			const url = match[0];
			const index = match.index ?? 0;

			if (index > lastIndex) {
				parts.push({ type: 'text', value: text.slice(lastIndex, index) });
			}

			parts.push({ type: 'link', value: url });
			lastIndex = index + url.length;
		}

		if (lastIndex < text.length) {
			parts.push({ type: 'text', value: text.slice(lastIndex) });
		}

		return parts.length > 0 ? parts : [{ type: 'text', value: text }];
	}

	const parts = $derived(linkify(source));
</script>

{#each parts as part, index (index)}
	{#if part.type === 'link'}
		<a
			href={part.value}
			target="_blank"
			rel="noopener noreferrer"
			class="text-[#2563EB] underline-offset-2 hover:underline"
		>
			{part.value}
		</a>
	{:else}
		{part.value}
	{/if}
{/each}
