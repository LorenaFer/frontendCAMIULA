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
	class="flex-shrink-0 flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 {className}"
>
	{@render children()}
</div>
