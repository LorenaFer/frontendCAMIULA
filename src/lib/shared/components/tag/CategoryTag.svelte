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
		gray: 'bg-slate-100 text-slate-600',
		blue: 'bg-slate-100 text-slate-600',
		green: 'bg-slate-100 text-slate-600',
		red: 'bg-slate-100 text-slate-600',
		amber: 'bg-slate-100 text-slate-600',
		purple: 'bg-slate-100 text-slate-600',
		pink: 'bg-slate-100 text-slate-600'
	};
</script>

<span
	class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded {categoryColors[
		color
	]} {className}"
>
	{@render children()}
</span>
