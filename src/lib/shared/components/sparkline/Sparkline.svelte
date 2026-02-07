<script lang="ts">
	const colorMap = {
		default: { stroke: '#64748b', fill: '#64748b', dot: '#475569' },
		success: { stroke: '#059669', fill: '#059669', dot: '#047857' },
		danger: { stroke: '#dc2626', fill: '#dc2626', dot: '#b91c1c' },
		warning: { stroke: '#d97706', fill: '#d97706', dot: '#b45309' },
		blue: { stroke: '#2563eb', fill: '#2563eb', dot: '#1d4ed8' }
	};

	let {
		data,
		width = 96,
		height = 40,
		color = 'default',
		variant = 'line',
		class: className = ''
	}: {
		data: number[];
		width?: number;
		height?: number;
		color?: 'default' | 'success' | 'danger' | 'warning' | 'blue';
		variant?: 'line' | 'bars';
		class?: string;
	} = $props();

	const padding = { x: 4, y: 6 };

	let min = $derived(Math.min(...data));
	let max = $derived(Math.max(...data));
	let range = $derived(max - min || 1);

	let chartWidth = $derived(width - padding.x * 2);
	let chartHeight = $derived(height - padding.y * 2);

	let colors = $derived(colorMap[color]);

	let points = $derived(
		data.map((value, index) => ({
			x: padding.x + (index / (data.length - 1)) * chartWidth,
			y: padding.y + chartHeight - ((value - min) / range) * chartHeight,
			value
		}))
	);

	let linePath = $derived(
		points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
	);

	let barWidth = $derived(Math.max(2, chartWidth / data.length - 2));
	let barGap = $derived((chartWidth - barWidth * data.length) / (data.length - 1));
</script>

{#if data.length >= 2}
	{#if variant === 'bars'}
		<svg {width} {height} class={className} viewBox="0 0 {width} {height}">
			{#each data as value, index}
				{@const barHeight = Math.max(2, ((value - min) / range) * chartHeight)}
				{@const x = padding.x + index * (barWidth + barGap)}
				{@const y = height - padding.y - barHeight}
				{@const isLast = index === data.length - 1}
				<rect
					{x}
					{y}
					width={barWidth}
					height={barHeight}
					rx={1}
					fill={colors.fill}
					fill-opacity={isLast ? 1 : 0.35}
				/>
			{/each}
		</svg>
	{:else}
		<svg {width} {height} class={className} viewBox="0 0 {width} {height}">
			<!-- Baseline reference -->
			<line
				x1={padding.x}
				y1={height - padding.y}
				x2={width - padding.x}
				y2={height - padding.y}
				stroke={colors.stroke}
				stroke-opacity="0.1"
				stroke-width="1"
			/>

			<!-- Data line - straight segments -->
			<path
				d={linePath}
				fill="none"
				stroke={colors.stroke}
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>

			<!-- Data points -->
			{#each points as point, index}
				<circle
					cx={point.x}
					cy={point.y}
					r={index === points.length - 1 ? 3 : 1.5}
					fill={index === points.length - 1 ? colors.dot : colors.stroke}
					fill-opacity={index === points.length - 1 ? 1 : 0.6}
				/>
			{/each}

			<!-- End value highlight ring -->
			<circle
				cx={points[points.length - 1].x}
				cy={points[points.length - 1].y}
				r={5}
				fill="none"
				stroke={colors.stroke}
				stroke-width="1"
				stroke-opacity="0.2"
			/>
		</svg>
	{/if}
{/if}
