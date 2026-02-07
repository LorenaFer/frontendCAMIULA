<script lang="ts">
	type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

	let {
		value,
		max = 100,
		size = 48,
		strokeWidth = 4,
		variant = 'default',
		showLabel = true,
		class: className = ''
	}: {
		value: number;
		max?: number;
		size?: number;
		strokeWidth?: number;
		variant?: ProgressVariant;
		showLabel?: boolean;
		class?: string;
	} = $props();

	const ringColors: Record<ProgressVariant, { stroke: string; track: string }> = {
		default: { stroke: '#475569', track: '#e2e8f0' },
		success: { stroke: '#059669', track: '#e2e8f0' },
		warning: { stroke: '#d97706', track: '#e2e8f0' },
		danger: { stroke: '#dc2626', track: '#e2e8f0' },
		info: { stroke: '#64748b', track: '#e2e8f0' }
	};

	const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(radius * 2 * Math.PI);
	const offset = $derived(circumference - (percentage / 100) * circumference);
	const colors = $derived(ringColors[variant]);
</script>

<div class="relative inline-flex items-center justify-center {className}">
	<svg width={size} height={size} class="transform -rotate-90">
		<!-- Background track -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={colors.track}
			stroke-width={strokeWidth}
		/>
		<!-- Progress arc -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={colors.stroke}
			stroke-width={strokeWidth}
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			stroke-linecap="round"
			class="transition-all duration-500 ease-out"
		/>
	</svg>
	{#if showLabel}
		<span class="absolute text-xs font-semibold text-slate-700 tabular-nums">
			{Math.round(percentage)}%
		</span>
	{/if}
</div>
