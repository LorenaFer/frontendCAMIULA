<script lang="ts">
	import type { CitaEstado } from '$shared/types/appointments.js';
	import Badge from '$shared/components/badge/Badge.svelte';

	interface Props {
		status: CitaEstado;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();

	type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

	const config: Record<CitaEstado, { label: string; variant: BadgeVariant }> = {
		pendiente:   { label: 'Pendiente',   variant: 'warning' },
		confirmada:  { label: 'Confirmada',  variant: 'info' },
		atendida:    { label: 'Atendida',    variant: 'success' },
		cancelada:   { label: 'Cancelada',   variant: 'danger' },
		no_asistio:  { label: 'No asistió',  variant: 'default' }
	};

	const entry = $derived(config[status] ?? { label: String(status), variant: 'default' as BadgeVariant });
</script>

<Badge variant={entry.variant} style="soft" size="sm" dot class={className}>
	{entry.label}
</Badge>
