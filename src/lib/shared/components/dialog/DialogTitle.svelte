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

<h2 class="text-lg font-semibold text-gray-900 {className}">
	{@render children()}
</h2>
