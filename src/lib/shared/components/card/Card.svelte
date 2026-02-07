<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardVariant = 'default' | 'elevated' | 'ghost' | 'flat';
	type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

	const paddingStyles: Record<CardPadding, string> = {
		none: '',
		sm: 'p-3',
		md: 'p-4',
		lg: 'p-5',
		xl: 'p-6'
	};

	const variantStyles: Record<CardVariant, string> = {
		default: 'bg-white border border-slate-200/60',
		elevated: 'bg-white border border-slate-200/50 shadow-sm',
		ghost: 'bg-slate-50/80 border border-slate-200/40',
		flat: 'bg-white'
	};

	let {
		children,
		class: className = '',
		padding = 'md',
		variant = 'default',
		hover = false,
		onclick
	}: {
		children: Snippet;
		class?: string;
		padding?: CardPadding;
		variant?: CardVariant;
		hover?: boolean;
		onclick?: () => void;
	} = $props();
</script>

{#if onclick}
	<button
		{onclick}
		class="
			rounded-xl text-left w-full
			{variantStyles[variant]}
			{paddingStyles[padding]}
			{hover ? 'hover:border-slate-300 transition-colors duration-150 cursor-pointer' : ''}
			{className}
		"
	>
		{@render children()}
	</button>
{:else}
	<div
		class="
			rounded-xl
			{variantStyles[variant]}
			{paddingStyles[padding]}
			{hover ? 'hover:border-slate-300 transition-colors duration-150 cursor-pointer' : ''}
			{className}
		"
	>
		{@render children()}
	</div>
{/if}
