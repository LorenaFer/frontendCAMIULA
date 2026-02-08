<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = ''
	}: {
		children: Snippet;
		class?: string;
	} = $props();
</script>

<p class="text-sm text-ink-muted mt-0.5 {className}">
	{@render children()}
</p>
