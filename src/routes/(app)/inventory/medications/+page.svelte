<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { Medication } from '$domain/inventory/types.js';
	import type { RowMenuItem } from '$shared/components/table/types.js';
	type MedicationRow = Medication & Record<string, unknown>;
	import Button from '$shared/components/button/Button.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import MedicationFilters from '$domain/inventory/components/filters/MedicationFilters.svelte';
	import MedicationTable from '$domain/inventory/components/tables/MedicationTable.svelte';
	import MedicationForms from '$domain/inventory/components/forms/MedicationForms.svelte';
	import MedicationDetailDialog from '$domain/inventory/components/dialogs/MedicationDetailDialog.svelte';
	import MedicationDeleteDialog from '$domain/inventory/components/dialogs/MedicationDeleteDialog.svelte';

	let { data }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
	let editingMed = $state<Medication | null>(null);
	let viewingMed = $state<Medication | null>(null);
	let deletingMed = $state<Medication | null>(null);

	function closeAllModals() {
		viewingMed = null;
		editingMed = null;
		deletingMed = null;
	}

	function openEdit(row: Medication) {
		closeAllModals();
		editingMed = { ...row };
	}
	function openDetail(row: Medication) {
		closeAllModals();
		viewingMed = { ...row };
	}
	function openDelete(row: Medication) {
		closeAllModals();
		deletingMed = { ...row };
	}

	const medicationMenu: RowMenuItem<MedicationRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => openDetail(row as unknown as Medication) },
		{ label: 'Editar', icon: 'edit', onclick: (row) => openEdit(row as unknown as Medication) },
		{ label: 'Eliminar', icon: 'delete', variant: 'danger', onclick: (row) => openDelete(row as unknown as Medication) }
	];

	// Auto-generar código para nuevo medicamento
	const nextCode = $derived(`MED-${String(data.medications.total + 1).padStart(3, '0')}`);

	const statsTotal  = $derived(data.medications.total);
	const statsActive = $derived(
		(data.medications.data as Medication[]).filter((m) => m.medication_status === 'active').length
	);
	const statsCritical = $derived(
		(data.medications.data as Medication[]).filter((m) => m.current_stock < 10).length
	);
</script>

<svelte:head>
	<title>Catálogo de Medicamentos — Inventario</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: '/inventory' },
		{ label: 'Medicamentos' }
	]} />

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Catálogo de Medicamentos</h1>
			<p class="text-sm text-ink-muted mt-0.5">Gestión de medicamentos e insumos médicos</p>
		</div>
		<Button variant="primary" size="md" onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancelar' : '+ Agregar medicamento'}
		</Button>
	</div>

	<!-- Stats -->
	<div class="flex flex-wrap gap-2 sm:gap-4">
		<div class="bg-surface-elevated border border-border rounded-lg px-4 py-2.5 min-w-[100px]">
			<p class="text-sm text-ink-muted">Total</p>
			<p class="text-lg font-bold text-ink tabular-nums">{statsTotal}</p>
		</div>
		<div class="bg-surface-elevated border border-border rounded-lg px-4 py-2.5 min-w-[100px]">
			<p class="text-sm text-ink-muted">Activos</p>
			<p class="text-lg font-bold text-ink tabular-nums">{statsActive}</p>
		</div>
		<div class={`bg-surface-elevated border rounded-lg px-4 py-2.5 min-w-[100px] ${statsCritical > 0 ? 'border-red-200 dark:border-red-800' : 'border-border'}`}>
			<p class="text-sm text-ink-muted">Stock crítico</p>
			<p class={`text-lg font-bold tabular-nums ${statsCritical > 0 ? 'text-red-600 dark:text-red-400' : 'text-ink'}`}>{statsCritical}</p>
		</div>
	</div>

	<MedicationForms
		{showCreateForm}
		{editingMed}
		{nextCode}
		categoryOptions={data.categoryOptions}
		onCreateClose={() => (showCreateForm = false)}
		onEditClose={() => { editingMed = null; }}
	/>

	<MedicationFilters filters={data.filters} categoryOptions={data.categoryOptions} />

	<MedicationTable pagination={data.medications} rowMenu={medicationMenu} />
</div>

<MedicationDetailDialog
	{viewingMed}
	onClose={() => { viewingMed = null; }}
	onEdit={(med) => openEdit(med)}
/>

<MedicationDeleteDialog
	{deletingMed}
	onClose={() => { deletingMed = null; }}
/>
