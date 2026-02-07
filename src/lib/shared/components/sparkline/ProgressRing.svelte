<script lang="ts">
	const colorMap = {
		default: { stroke: '#64748b', fill: '#64748b', dot: '#475569' },
		success: { stroke: '#059669', fill: '#059669', dot: '#047857' },
		danger: { stroke: '#dc2626', fill: '#dc2626', dot: '#b91c1c' },
		warning: { stroke: '#d97706', fill: '#d97706', dot: '#b45309' },
		blue: { stroke: '#2563eb', fill: '#2563eb', dot: '#1d4ed8' }
	};

	let {
		value,
		max = 100,
		size = 44,
		strokeWidth = 4,
		color = 'default',
		showValue = false,
		bgOpacity = 0.1,
		class: className = '',
		...restProps
	}: {
		value: number;
		max?: number;
		size?: number;
		strokeWidth?: number;
		color?: 'default' | 'success' | 'danger' | 'warning' | 'blue';
		showValue?: boolean;
		bgOpacity?: number;
		class?: string;
		[key: string]: unknown;
	} = $props();

	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(radius * 2 * Math.PI);
	let percentage = $derived(Math.min((value / max) * 100, 100));
	let offset = $derived(circumference - (percentage / 100) * circumference);
	let colors = $derived(colorMap[color]);
</script>

<svg
	width={size}
	height={size}
	class={className}
	viewBox="0 0 {size} {size}"
	{...restProps}
>
	<!-- Background circle -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke={colors.stroke}
		stroke-opacity={bgOpacity}
		stroke-width={strokeWidth}
	/>
	<!-- Progress circle -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke={colors.stroke}
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-dasharray={circumference}
		stroke-dashoffset={offset}
		transform="rotate(-90 {size / 2} {size / 2})"
		style="transition: stroke-dashoffset 0.5s ease-out;"
	/>
	{#if showValue}
		<text
			x="50%"
			y="50%"
			text-anchor="middle"
			dominant-baseline="middle"
			class="text-[11px] font-semibold fill-gray-700"
		>
			{Math.round(percentage)}%
		</text>
	{/if}
</svg>
