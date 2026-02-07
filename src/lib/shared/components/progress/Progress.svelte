<script lang="ts">
	type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
	type ProgressSize = 'sm' | 'md' | 'lg';

	let {
		value,
		max = 100,
		variant = 'default',
		size = 'md',
		showLabel = false,
		label,
		showPercentage = false,
		class: className = ''
	}: {
		value: number;
		max?: number;
		variant?: ProgressVariant;
		size?: ProgressSize;
		showLabel?: boolean;
		label?: string;
		showPercentage?: boolean;
		class?: string;
	} = $props();

	const barStyles: Record<ProgressVariant, string> = {
		default: 'bg-slate-600',
		success: 'bg-emerald-600',
		warning: 'bg-amber-500',
		danger: 'bg-red-500',
		info: 'bg-slate-500'
	};

	const trackStyles: Record<ProgressVariant, string> = {
		default: 'bg-slate-200/60',
		success: 'bg-slate-200/60',
		warning: 'bg-slate-200/60',
		danger: 'bg-slate-200/60',
		info: 'bg-slate-200/60'
	};

	const sizeStyles: Record<ProgressSize, string> = {
		sm: 'h-1.5',
		md: 'h-2',
		lg: 'h-2.5'
	};

	const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
</script>

<div class={className}>
	{#if showLabel || label || showPercentage}
		<div class="flex items-center justify-between mb-1.5">
			{#if label}
				<span class="text-xs font-medium text-slate-600">{label}</span>
			{/if}
			{#if showPercentage}
				<span class="text-xs font-medium text-slate-500 tabular-nums">
					{Math.round(percentage)}%
				</span>
			{:else if showLabel}
				<span class="text-xs font-medium text-slate-500 tabular-nums">
					{value}/{max}
				</span>
			{/if}
		</div>
	{/if}
	<div
		class="w-full rounded-full overflow-hidden {trackStyles[variant]} {sizeStyles[size]}"
	>
		<div
			class="{sizeStyles[size]} rounded-full {barStyles[variant]} transition-all duration-500 ease-out"
			style="width: {percentage}%"
		></div>
	</div>
</div>
