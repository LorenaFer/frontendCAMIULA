<script lang="ts">
	import Badge from './Badge.svelte';

	type PriorityType = 'urgent' | 'high' | 'normal' | 'low';
	type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
	type BadgeStyle = 'ghost' | 'outline' | 'soft' | 'solid';

	let {
		priority,
		class: className = ''
	}: {
		priority: PriorityType;
		class?: string;
	} = $props();

	const priorityConfig: Record<
		PriorityType,
		{
			label: string;
			variant: BadgeVariant;
			style: BadgeStyle;
			dot?: boolean;
			pulse?: boolean;
		}
	> = {
		urgent: { label: 'Urgent', variant: 'danger', style: 'solid', dot: true, pulse: true },
		high: { label: 'High', variant: 'warning', style: 'ghost', dot: true },
		normal: { label: 'Normal', variant: 'default', style: 'ghost' },
		low: { label: 'Low', variant: 'default', style: 'outline' }
	};

	const config = $derived(priorityConfig[priority]);
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
