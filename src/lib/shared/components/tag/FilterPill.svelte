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
		? 'bg-slate-900 text-white'
		: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'} {className}"
>
	{#if icon}
		<span class="w-4 h-4">{@render icon()}</span>
	{/if}
	{@render children()}
	{#if count !== undefined}
		<span
			class="ml-1 px-1.5 py-0.5 text-xs font-medium rounded {active
				? 'bg-white/15 text-white'
				: 'bg-slate-100 text-slate-500'}"
		>
			{count}
		</span>
	{/if}
</button>
