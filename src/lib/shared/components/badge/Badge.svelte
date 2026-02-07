<script lang="ts">
	import type { Snippet } from 'svelte';

	type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
	type BadgeStyle = 'ghost' | 'outline' | 'soft' | 'solid';
	type BadgeSize = 'xs' | 'sm' | 'md';

	let {
		children,
		variant = 'default',
		style = 'ghost',
		size = 'sm',
		icon,
		dot = false,
		pulse = false,
		class: className = ''
	}: {
		children: Snippet;
		variant?: BadgeVariant;
		style?: BadgeStyle;
		size?: BadgeSize;
		icon?: Snippet;
		dot?: boolean;
		pulse?: boolean;
		class?: string;
	} = $props();

	const ghostStyles: Record<BadgeVariant, string> = {
		default: 'bg-gray-50 text-gray-600',
		primary: 'bg-viking-50/50 text-viking-600',
		success: 'bg-emerald-50/50 text-emerald-600',
		warning: 'bg-amber-50/50 text-amber-600',
		danger: 'bg-red-50/50 text-red-600',
		info: 'bg-blue-50/50 text-blue-600'
	};

	const outlineStyles: Record<BadgeVariant, string> = {
		default: 'border border-gray-200 text-gray-600 bg-white',
		primary: 'border border-viking-200/60 text-viking-600 bg-white',
		success: 'border border-emerald-200/60 text-emerald-600 bg-white',
		warning: 'border border-amber-200/60 text-amber-600 bg-white',
		danger: 'border border-red-200/60 text-red-600 bg-white',
		info: 'border border-blue-200/60 text-blue-600 bg-white'
	};

	const softStyles: Record<BadgeVariant, string> = {
		default: 'bg-gray-100/80 text-gray-700',
		primary: 'bg-viking-100/60 text-viking-700',
		success: 'bg-emerald-100/60 text-emerald-700',
		warning: 'bg-amber-100/60 text-amber-700',
		danger: 'bg-red-100/60 text-red-700',
		info: 'bg-blue-100/60 text-blue-700'
	};

	const solidStyles: Record<BadgeVariant, string> = {
		default: 'bg-gray-600 text-white',
		primary: 'bg-viking-600 text-white',
		success: 'bg-emerald-600 text-white',
		warning: 'bg-amber-500 text-white',
		danger: 'bg-red-600 text-white',
		info: 'bg-blue-600 text-white'
	};

	const dotStyles: Record<BadgeVariant, string> = {
		default: 'bg-gray-400',
		primary: 'bg-viking-500',
		success: 'bg-emerald-500',
		warning: 'bg-amber-500',
		danger: 'bg-red-500',
		info: 'bg-blue-500'
	};

	const sizeStyles: Record<BadgeSize, { badge: string; dot: string; icon: string }> = {
		xs: { badge: 'px-1.5 py-0.5 text-[10px] gap-1', dot: 'w-1 h-1', icon: 'w-2.5 h-2.5' },
		sm: { badge: 'px-2 py-0.5 text-xs gap-1', dot: 'w-1.5 h-1.5', icon: 'w-3 h-3' },
		md: { badge: 'px-2.5 py-1 text-xs gap-1.5', dot: 'w-1.5 h-1.5', icon: 'w-3.5 h-3.5' }
	};

	const styleMap = {
		ghost: ghostStyles,
		outline: outlineStyles,
		soft: softStyles,
		solid: solidStyles
	};
</script>

<span
	class="inline-flex items-center font-medium rounded-lg {styleMap[style][variant]} {sizeStyles[size]
		.badge} {className}"
>
	{#if dot}
		<span class="relative flex-shrink-0">
			{#if pulse}
				<span
					class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping {dotStyles[
						variant
					]}"
				></span>
			{/if}
			<span class="relative rounded-full {sizeStyles[size].dot} {dotStyles[variant]}"></span>
		</span>
	{/if}
	{#if icon}
		<span class="flex-shrink-0 {sizeStyles[size].icon}">{@render icon()}</span>
	{/if}
	{@render children()}
</span>
