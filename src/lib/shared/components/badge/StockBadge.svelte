<script lang="ts">
	import Badge from './Badge.svelte';

	type StockLevel = 'high' | 'good' | 'adequate' | 'low' | 'critical';
	type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
	type BadgeStyle = 'ghost' | 'outline' | 'soft' | 'solid';

	let {
		level,
		class: className = ''
	}: {
		level: StockLevel;
		class?: string;
	} = $props();

	const levelConfig: Record<
		StockLevel,
		{
			label: string;
			variant: BadgeVariant;
			style: BadgeStyle;
			dot?: boolean;
			pulse?: boolean;
		}
	> = {
		high: { label: 'In Stock', variant: 'success', style: 'ghost', dot: true },
		good: { label: 'Good', variant: 'success', style: 'ghost', dot: true },
		adequate: { label: 'Adequate', variant: 'default', style: 'outline' },
		low: { label: 'Low Stock', variant: 'warning', style: 'ghost', dot: true },
		critical: { label: 'Critical', variant: 'danger', style: 'solid', dot: true, pulse: true }
	};

	const config = $derived(levelConfig[level]);
</script>

<Badge
	variant={config.variant}
	style={config.style}
	dot={config.dot}
	pulse={config.pulse}
	size="xs"
	class={className}
>
	{config.label}
</Badge>
