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

	export interface EspecialidadesPagination {
		items: Especialidad[];
		total: number;
		page: number;
		pageSize: number;
	}

	export interface EspecialidadesSchemaHelpers {
		getForEsp: (esp: Especialidad) => MedicalFormSchema | undefined;
		countFields: (schema: MedicalFormSchema) => number;
	}

	interface Props {
		pagination: EspecialidadesPagination;
		helpers: EspecialidadesSchemaHelpers;
		onNew: () => void;
		onEdit: (esp: Especialidad) => void;
		onPageChange: (p: number) => void;
		onPageSizeChange: (ps: number) => void;
	}

	let {
		pagination,
		helpers,
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
	{@const schema = helpers.getForEsp(row as Especialidad)}
	{#if schema}
		<span class="text-xs text-ink-muted">{helpers.countFields(schema)} campos</span>
	{:else}
		<span class="text-xs text-ink-subtle">—</span>
	{/if}
{/snippet}

<div class="flex items-center justify-between">
	<p class="text-sm text-ink-muted">{pagination.total} especialidades registradas</p>
	<Button variant="primary" size="sm" onclick={onNew}>+ Nueva Especialidad</Button>
</div>

<Card padding="none">
	<DataTable
		columns={[
			{ key: 'nombre', header: 'Nombre' },
			{ key: 'activo', header: 'Estado', width: '100px', align: 'center', render: espStatusCell },
			{ key: 'id', header: 'Formulario', width: '120px', align: 'center', render: espSchemaCell }
		] satisfies DataTableColumn<EspRow>[]}
		data={pagination.items as EspRow[]}
		rowKey="id"
		rowMenu={[
			{ label: 'Editar', icon: 'edit', onclick: (row) => onEdit(row as unknown as Especialidad) }
		] satisfies RowMenuItem<EspRow>[]}
		emptyMessage="No hay especialidades registradas."
	/>
	<PaginationBar
		page={pagination.page}
		total={pagination.total}
		pageSize={pagination.pageSize}
		pageSizeOptions={[10, 25, 50]}
		onPageChange={onPageChange}
		onPageSizeChange={onPageSizeChange}
	/>
</Card>
