<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		active = false,
		icon,
		count,
		onclick,
		class: className = ''
	}: {
		children: Snippet;
		active?: boolean;
		icon?: Snippet;
		count?: number;
		onclick?: () => void;
		class?: string;
	} = $props();
</script>

<button
	{onclick}
	class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap {active
		? 'bg-ink text-surface-elevated'
		: 'bg-surface-elevated text-ink-muted border border-border hover:bg-canvas-subtle hover:border-border-strong'} {className}"
>
	{#if icon}
		<span class="w-4 h-4">{@render icon()}</span>
	{/if}
	{@render children()}
	{#if count !== undefined}
		<span
			class="ml-1 px-1.5 py-0.5 text-xs font-medium rounded {active
				? 'bg-surface-elevated/15 text-surface-elevated'
				: 'bg-canvas-subtle text-ink-muted'}"
		>
			{count}
		</span>
	{/if}
</button>
