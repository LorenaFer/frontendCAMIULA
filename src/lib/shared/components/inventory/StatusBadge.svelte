<script lang="ts">
	import Badge from '$shared/components/badge/Badge.svelte';
	import type { MedicationStatus, DispatchStatus, PurchaseOrderStatus } from '$shared/types/inventory.js';

	type SupplierStatus = 'active' | 'inactive';
	type StockAlert = 'critical' | 'low' | 'expired' | 'ok';
	type AllStatus = MedicationStatus | DispatchStatus | PurchaseOrderStatus | SupplierStatus | StockAlert;

	let {
		status,
		class: className = ''
	}: {
		status: AllStatus | (string & {});
		class?: string;
	} = $props();

	type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

	const config: Record<string, { label: string; variant: BadgeVariant }> = {
		// Dispatch
		completed:    { label: 'Completado',    variant: 'success' },
		cancelled:    { label: 'Cancelado',     variant: 'danger' },
		pending:      { label: 'Pendiente',     variant: 'warning' },
		// Medication
		active:       { label: 'Activo',        variant: 'success' },
		discontinued: { label: 'Descontinuado', variant: 'danger' },
		// pending ya está arriba
		// Supplier
		inactive:     { label: 'Inactivo',      variant: 'default' },
		// active ya está arriba
		// Stock alerts
		critical:     { label: 'Crítico',       variant: 'danger' },
		low:          { label: 'Bajo',          variant: 'warning' },
		expired:      { label: 'Vencido',       variant: 'default' },
		ok:           { label: 'OK',            variant: 'success' },
		// Purchase order
		draft:        { label: 'Borrador',      variant: 'default' },
		sent:         { label: 'Enviada',       variant: 'info' },
		partial:      { label: 'Parcial',       variant: 'warning' },
		received:     { label: 'Recibida',      variant: 'success' },
		// cancelled ya está arriba
	};

	const entry = $derived(config[status] ?? { label: String(status), variant: 'default' as BadgeVariant });
</script>

<Badge variant={entry.variant} style="soft" size="sm" dot class={className}>
	{entry.label}
</Badge>
