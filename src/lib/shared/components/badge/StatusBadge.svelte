<script lang="ts">
	import Badge from './Badge.svelte';

	type StatusType =
		| 'admitted'
		| 'discharged'
		| 'observation'
		| 'critical'
		| 'pending'
		| 'confirmed'
		| 'cancelled'
		| 'completed';

	type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
	type BadgeStyle = 'ghost' | 'outline' | 'soft' | 'solid';

	let {
		status,
		class: className = ''
	}: {
		status: StatusType;
		class?: string;
	} = $props();

	const statusConfig: Record<
		StatusType,
		{
			label: string;
			variant: BadgeVariant;
			dot?: boolean;
			pulse?: boolean;
			style?: BadgeStyle;
		}
	> = {
		admitted: { label: 'Admitted', variant: 'success', dot: true, style: 'ghost' },
		observation: { label: 'Observation', variant: 'warning', dot: true, style: 'ghost' },
		critical: { label: 'Critical', variant: 'danger', dot: true, pulse: true, style: 'solid' },
		discharged: { label: 'Discharged', variant: 'default', style: 'outline' },
		completed: { label: 'Completed', variant: 'success', style: 'outline' },
		pending: { label: 'Pending', variant: 'default', dot: true, style: 'ghost' },
		confirmed: { label: 'Confirmed', variant: 'success', dot: true, style: 'ghost' },
		cancelled: { label: 'Cancelled', variant: 'default', style: 'outline' }
	};

	const config = $derived(statusConfig[status]);
</script>

<Badge
	variant={config.variant}
	style={config.style || 'ghost'}
	dot={config.dot}
	pulse={config.pulse}
	size="xs"
	class={className}
>
	{config.label}
</Badge>
