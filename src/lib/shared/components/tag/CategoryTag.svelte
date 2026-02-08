<script lang="ts">
	import type { Snippet } from 'svelte';

	type CategoryColor = 'gray' | 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'pink';

	let {
		children,
		color = 'gray',
		class: className = ''
	}: {
		children: Snippet;
		color?: CategoryColor;
		class?: string;
	} = $props();

	const categoryColors: Record<CategoryColor, string> = {
		gray: 'bg-canvas-subtle text-ink-muted',
		blue: 'bg-canvas-subtle text-ink-muted',
		green: 'bg-canvas-subtle text-ink-muted',
		red: 'bg-canvas-subtle text-ink-muted',
		amber: 'bg-canvas-subtle text-ink-muted',
		purple: 'bg-canvas-subtle text-ink-muted',
		pink: 'bg-canvas-subtle text-ink-muted'
	};
</script>

<span
	class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded {categoryColors[
		color
	]} {className}"
>
	{@render children()}
</span>
