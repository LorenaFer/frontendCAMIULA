<script lang="ts">
	import type { Dispatch, InventoryPaginatedResponse } from '$domain/inventory/types.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import PaginationBar from '$shared/components/table/PaginationBar.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';
	import DispatchFilters, { type DispatchStatusFilter } from '$domain/inventory/components/filters/DispatchFilters.svelte';

	type DispatchRow = Dispatch & Record<string, unknown>;

	interface Props {
		pagination: InventoryPaginatedResponse<Dispatch>;
		activeStatus: DispatchStatusFilter;
		onStatusChange: (status: DispatchStatusFilter) => void;
		onPageChange: (page: number) => void;
		onPageSizeChange: (pageSize: number) => void;
		onView: (row: Dispatch) => void;
		onCancel: (row: Dispatch) => void;
	}

	let {
		pagination,
		activeStatus,
		onStatusChange,
		onPageChange,
		onPageSizeChange,
		onView,
		onCancel
	}: Props = $props();

	const dispatchMenu: RowMenuItem<DispatchRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => onView(row as unknown as Dispatch) },
		{ label: 'Cancelar despacho', icon: 'delete', variant: 'danger', onclick: (row) => {
			if ((row as unknown as Dispatch).dispatch_status === 'completed') {
				onCancel(row as unknown as Dispatch);
			}
		}}
	];
</script>

{#snippet statusCell(_v: unknown, row: DispatchRow, _index: number)}
	<StatusBadge status={row.dispatch_status as string} />
{/snippet}

<Card padding="none">
	<div class="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<h2 class="text-sm font-semibold text-ink">Historial de despachos</h2>
		<DispatchFilters active={activeStatus} onchange={onStatusChange} />
	</div>
	<DataTable
		columns={[
			{ key: 'prescription_number', header: 'Receta',     width: '140px' },
			{ key: 'patient_name',         header: 'Paciente' },
			{ key: 'dispatch_date',        header: 'Fecha',     width: '110px' },
			{ key: 'pharmacist_name',      header: 'Farmacéutico', width: '170px' },
			{ key: 'dispatch_status',      header: 'Estado',    width: '110px', align: 'center', render: statusCell }
		] as DataTableColumn<DispatchRow>[]}
		data={pagination.data as DispatchRow[]}
		rowKey="id"
		rowMenu={dispatchMenu}
		emptyMessage="No hay despachos registrados."
	/>

	<PaginationBar
		page={pagination.page}
		total={pagination.total}
		pageSize={pagination.pageSize}
		pageSizeOptions={[10, 25, 50, 100]}
		onPageChange={(p) => onPageChange(p)}
		onPageSizeChange={(ps) => onPageSizeChange(ps)}
	/>
</Card>
