<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		action,
		class: className = ''
	}: {
		children: Snippet;
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="flex items-center justify-between gap-4 {className}">
	<div class="flex-1 min-w-0">
		{@render children()}
	</div>
	{#if action}
		<div class="flex-shrink-0">
			{@render action()}
		</div>
	{/if}
</div>
