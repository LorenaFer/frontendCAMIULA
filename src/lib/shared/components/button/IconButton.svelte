<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'soft';
	type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

	const variantStyles: Record<ButtonVariant, string> = {
		primary: `
			bg-viking-600 text-white btn-shine
			border border-viking-700/20
			shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]
			hover:bg-viking-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.12)]
			active:bg-viking-800 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
			focus-visible:ring-2 focus-visible:ring-viking-500/40 focus-visible:ring-offset-1
		`,
		secondary: `
			bg-white text-slate-700
			border border-slate-200
			shadow-[0_1px_2px_rgba(0,0,0,0.04)]
			hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)]
			active:bg-slate-100 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]
			focus-visible:ring-2 focus-visible:ring-slate-400/20 focus-visible:ring-offset-1
		`,
		soft: `
			bg-viking-50/80 text-viking-700
			border border-viking-100/50
			hover:bg-viking-100/80 hover:border-viking-200/50
			active:bg-viking-150
			focus-visible:ring-2 focus-visible:ring-viking-500/20 focus-visible:ring-offset-1
		`,
		ghost: `
			bg-transparent text-slate-600
			hover:bg-slate-100/70 hover:text-slate-800
			active:bg-slate-200/50
			focus-visible:ring-2 focus-visible:ring-slate-400/20 focus-visible:ring-offset-1
		`,
		danger: `
			bg-red-600 text-white btn-shine
			border border-red-700/20
			shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]
			hover:bg-red-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.12)]
			active:bg-red-800
			focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:ring-offset-1
		`,
		success: `
			bg-emerald-600 text-white btn-shine
			border border-emerald-700/20
			shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]
			hover:bg-emerald-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.12)]
			active:bg-emerald-800
			focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-1
		`
	};

	const iconSizeStyles: Record<ButtonSize, string> = {
		xs: 'w-3 h-3',
		sm: 'w-3.5 h-3.5',
		md: 'w-4 h-4',
		lg: 'w-4 h-4'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		xs: 'w-7 h-7',
		sm: 'w-8 h-8',
		md: 'w-9 h-9',
		lg: 'w-10 h-10'
	};

	let {
		icon,
		variant = 'ghost',
		size = 'md',
		label,
		class: className = '',
		...restProps
	}: {
		icon: Snippet;
		variant?: ButtonVariant;
		size?: ButtonSize;
		label: string;
		class?: string;
	} & HTMLButtonAttributes = $props();
</script>

<button
	aria-label={label}
	title={label}
	class="
		inline-flex items-center justify-center
		rounded-lg
		transition-all duration-100 ease-out
		focus:outline-none
		disabled:opacity-50 disabled:cursor-not-allowed
		{variantStyles[variant]}
		{sizeClasses[size]}
		{className}
	"
	{...restProps}
>
	<span class={iconSizeStyles[size]}>{@render icon()}</span>
</button>
