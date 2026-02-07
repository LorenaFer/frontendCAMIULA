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

<h3 class="text-sm font-medium text-slate-700 {className}">
	{@render children()}
</h3>
