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

<div
	class="flex items-center justify-between gap-4 pt-3 mt-3 border-t border-border-subtle/60 {className}"
>
	{@render children()}
</div>
