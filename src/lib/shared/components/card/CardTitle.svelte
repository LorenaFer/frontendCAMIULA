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

<h3 class="text-sm font-medium text-ink {className}">
	{@render children()}
</h3>
