<script lang="ts">
	const stockGradients = {
		success: { start: '#10b981', end: '#34d399' },
		warning: { start: '#f59e0b', end: '#fbbf24' },
		danger: { start: '#ef4444', end: '#f87171' }
	};

	let {
		current,
		max,
		reorderLevel,
		size = 'sm',
		class: className = ''
	}: {
		current: number;
		max: number;
		reorderLevel?: number;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	let percentage = $derived((current / max) * 100);
	let threshold = $derived(reorderLevel ? (reorderLevel / max) * 100 : 25);

	let colorKey = $derived.by((): 'success' | 'warning' | 'danger' => {
		if (percentage <= threshold) return 'danger';
		if (percentage <= threshold * 2) return 'warning';
		return 'success';
	});

	const sizeStyles = {
		sm: { width: 48, height: 6 },
		md: { width: 72, height: 8 },
		lg: { width: 100, height: 10 }
	};

	let dimensions = $derived(sizeStyles[size]);
	let gradientId = $derived(
		`stock-gradient-${colorKey}-${Math.random().toString(36).substr(2, 9)}`
	);
	let colors = $derived(stockGradients[colorKey]);

	let trackColor = $derived(
		colorKey === 'danger' ? '#fee2e2' : colorKey === 'warning' ? '#fef3c7' : '#d1fae5'
	);
</script>

<div class="flex items-center gap-2 {className}">
	<svg
		width={dimensions.width}
		height={dimensions.height}
		viewBox="0 0 {dimensions.width} {dimensions.height}"
	>
		<defs>
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color={colors.start} />
				<stop offset="100%" stop-color={colors.end} />
			</linearGradient>
		</defs>
		<!-- Background track -->
		<rect
			x={0}
			y={0}
			width={dimensions.width}
			height={dimensions.height}
			rx={dimensions.height / 2}
			fill={trackColor}
		/>
		<!-- Progress fill with gradient -->
		<rect
			x={0}
			y={0}
			width={Math.max((percentage / 100) * dimensions.width, dimensions.height)}
			height={dimensions.height}
			rx={dimensions.height / 2}
			fill="url(#{gradientId})"
			style="transition: width 0.4s ease-out;"
		/>
	</svg>
	<!-- Pulsing dot for critical status -->
	{#if percentage <= threshold}
		<span class="relative flex h-2 w-2">
			<span
				class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
			></span>
			<span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
		</span>
	{/if}
</div>
