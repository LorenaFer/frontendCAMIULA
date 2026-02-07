<script lang="ts">
	import type { Snippet } from 'svelte';

	type TagVariant = 'default' | 'primary' | 'outline';
	type TagSize = 'sm' | 'md';

	let {
		children,
		variant = 'default',
		size = 'md',
		removable = false,
		onremove,
		class: className = ''
	}: {
		children: Snippet;
		variant?: TagVariant;
		size?: TagSize;
		removable?: boolean;
		onremove?: () => void;
		class?: string;
	} = $props();

	const variantStyles: Record<TagVariant, string> = {
		default: 'bg-slate-100 text-slate-700 hover:bg-slate-200/80',
		primary: 'bg-slate-700 text-white hover:bg-slate-800',
		outline: 'bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50'
	};

	const sizeStyles: Record<TagSize, string> = {
		sm: 'px-2 py-0.5 text-xs gap-1',
		md: 'px-2.5 py-1 text-sm gap-1.5'
	};
</script>

<span
	class="inline-flex items-center font-medium rounded-md transition-colors {variantStyles[
		variant
	]} {sizeStyles[size]} {className}"
>
	{@render children()}
	{#if removable}
		<button
			onclick={onremove}
			class="ml-0.5 p-0.5 rounded hover:bg-black/10 transition-colors"
			aria-label="Remove"
		>
			<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
		</button>
	{/if}
</span>
