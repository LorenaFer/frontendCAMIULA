<script lang="ts">
	import type { Especialidad } from '$domain/staff/types.js';
	import type { MedicalFormSchema } from '$domain/medical-records/form-schema.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import PaginationBar from '$shared/components/table/PaginationBar.svelte';

	type EspRow = Especialidad & Record<string, unknown>;

	interface Props {
		espTotal: number;
		espPaginated: Especialidad[];
		espPage: number;
		espPageSize: number;
		getSchemaForEsp: (esp: Especialidad) => MedicalFormSchema | undefined;
		countFields: (schema: MedicalFormSchema) => number;
		onNew: () => void;
		onEdit: (esp: Especialidad) => void;
		onPageChange: (p: number) => void;
		onPageSizeChange: (ps: number) => void;
	}

	let {
		espTotal,
		espPaginated,
		espPage,
		espPageSize,
		getSchemaForEsp,
		countFields,
		onNew,
		onEdit,
		onPageChange,
		onPageSizeChange
	}: Props = $props();
</script>

{#snippet espStatusCell(_v: unknown, row: EspRow)}
	<Badge variant={row.activo ? 'success' : 'danger'} style="soft" size="xs">
		{row.activo ? 'Activo' : 'Inactivo'}
	</Badge>
{/snippet}

{#snippet espSchemaCell(_v: unknown, row: EspRow)}
	{@const schema = getSchemaForEsp(row as Especialidad)}
	{#if schema}
		<span class="text-xs text-ink-muted">{countFields(schema)} campos</span>
	{:else}
		<span class="text-xs text-ink-subtle">—</span>
	{/if}
{/snippet}

<div class="flex items-center justify-between">
	<p class="text-sm text-ink-muted">{espTotal} especialidades registradas</p>
	<Button variant="primary" size="sm" onclick={onNew}>+ Nueva Especialidad</Button>
</div>

<Card padding="none">
	<DataTable
		columns={[
			{ key: 'nombre', header: 'Nombre' },
			{ key: 'activo', header: 'Estado', width: '100px', align: 'center', render: espStatusCell },
			{ key: 'id', header: 'Formulario', width: '120px', align: 'center', render: espSchemaCell }
		] satisfies DataTableColumn<EspRow>[]}
		data={espPaginated as EspRow[]}
		rowKey="id"
		rowMenu={[
			{ label: 'Editar', icon: 'edit', onclick: (row) => onEdit(row as unknown as Especialidad) }
		] satisfies RowMenuItem<EspRow>[]}
		emptyMessage="No hay especialidades registradas."
	/>
	<PaginationBar
		page={espPage}
		total={espTotal}
		pageSize={espPageSize}
		pageSizeOptions={[10, 25, 50]}
		onPageChange={onPageChange}
		onPageSizeChange={onPageSizeChange}
	/>
</Card>
