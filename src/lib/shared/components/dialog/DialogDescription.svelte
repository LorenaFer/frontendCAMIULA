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

<p class="mt-1 text-sm text-gray-500 {className}">
	{@render children()}
</p>
