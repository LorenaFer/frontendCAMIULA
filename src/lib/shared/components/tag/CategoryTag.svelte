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
		blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
		green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
		red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
		amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
		purple: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
		pink: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400'
	};
</script>

<span
	class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded {categoryColors[
		color
	]} {className}"
>
	{@render children()}
</span>
