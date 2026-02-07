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

<div class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-2 custom-scrollbar {className}">
	{@render children()}
</div>
