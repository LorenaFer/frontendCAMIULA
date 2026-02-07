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
		width = 64,
		height = 28,
		color = 'default',
		gap = 3,
		class: className = ''
	}: {
		data: number[];
		width?: number;
		height?: number;
		color?: 'default' | 'success' | 'danger' | 'warning' | 'blue';
		gap?: number;
		class?: string;
	} = $props();

	let max = $derived(Math.max(...data));
	let barWidth = $derived((width - gap * (data.length - 1)) / data.length);
	let colors = $derived(colorMap[color]);
</script>

{#if data.length > 0}
	<svg {width} {height} class={className} viewBox="0 0 {width} {height}">
		{#each data as value, index}
			{@const barHeight = Math.max((value / max) * height, 2)}
			{@const x = index * (barWidth + gap)}
			{@const y = height - barHeight}
			{@const isLast = index === data.length - 1}
			<rect
				{x}
				{y}
				width={barWidth}
				height={barHeight}
				rx={2}
				fill={colors.fill}
				fill-opacity={isLast ? 0.9 : 0.25}
			/>
		{/each}
	</svg>
{/if}
