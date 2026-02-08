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
		default: 'bg-ink-muted',
		success: 'bg-emerald-600',
		warning: 'bg-amber-500',
		danger: 'bg-red-500',
		info: 'bg-ink-subtle'
	};

	const trackStyles: Record<ProgressVariant, string> = {
		default: 'bg-border/60',
		success: 'bg-border/60',
		warning: 'bg-border/60',
		danger: 'bg-border/60',
		info: 'bg-border/60'
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
				<span class="text-xs font-medium text-ink-muted">{label}</span>
			{/if}
			{#if showPercentage}
				<span class="text-xs font-medium text-ink-muted tabular-nums">
					{Math.round(percentage)}%
				</span>
			{:else if showLabel}
				<span class="text-xs font-medium text-ink-muted tabular-nums">
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
