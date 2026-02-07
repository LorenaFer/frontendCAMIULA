<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardVariant = 'default' | 'elevated' | 'ghost' | 'flat';
	type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

	const paddingStyles: Record<CardPadding, string> = {
		none: '',
		sm: 'p-3.5',
		md: 'p-5',
		lg: 'p-6',
		xl: 'p-7'
	};

	const variantStyles: Record<CardVariant, string> = {
		default: 'bg-white border border-slate-200/60 shadow-[var(--shadow-1)]',
		elevated: 'bg-white border border-slate-200/50 shadow-[var(--shadow-2)]',
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
			rounded-xl text-left w-full transition-all duration-200
			{variantStyles[variant]}
			{paddingStyles[padding]}
			{hover ? 'hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5 cursor-pointer' : ''}
			{className}
		"
	>
		{@render children()}
	</button>
{:else}
	<div
		class="
			rounded-xl transition-all duration-200
			{variantStyles[variant]}
			{paddingStyles[padding]}
			{hover ? 'hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5 cursor-pointer' : ''}
			{className}
		"
	>
		{@render children()}
	</div>
{/if}
