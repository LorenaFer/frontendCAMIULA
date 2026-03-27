<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { Medication } from '$shared/types/inventory.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type MedicationRow = Medication & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import MedicationBadge from '$shared/components/inventory/MedicationBadge.svelte';
	import StockIndicator from '$shared/components/inventory/StockIndicator.svelte';
	import InventoryFilters from '$shared/components/inventory/InventoryFilters.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
	let creating = $state(false);

	const statsTotal  = $derived(data.medications.total);
	const statsActive = $derived(
		(data.medications.data as Medication[]).filter((m) => m.medication_status === 'active').length
	);
	const statsCritical = $derived(
		(data.medications.data as Medication[]).filter((m) => m.current_stock < 10).length
	);

	function applyFilters(filters: { search?: string; status?: string }) {
		const qs = new URLSearchParams();
		if (filters.search) qs.set('search', filters.search);
		if (filters.status) qs.set('status', filters.status);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Catálogo de Medicamentos — Inventario</title>
</svelte:head>

{#snippet statusCell(_v: unknown, row: MedicationRow)}
	<MedicationBadge status={row.medication_status as Medication['medication_status']} />
{/snippet}

{#snippet stockCell(_v: unknown, row: MedicationRow)}
	<StockIndicator stock={row.current_stock as number} />
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Catálogo de Medicamentos</h1>
			<p class="text-xs text-ink-muted mt-0.5">Gestión de medicamentos e insumos médicos</p>
		</div>
		<Button variant="primary" size="sm" onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancelar' : '+ Agregar medicamento'}
		</Button>
	</div>

	<!-- Stats -->
	<div class="flex flex-wrap gap-2 sm:gap-4">
		<div class="bg-surface-elevated border border-border rounded-lg px-4 py-2.5 min-w-[100px]">
			<p class="text-[11px] text-ink-muted">Total</p>
			<p class="text-lg font-bold text-ink tabular-nums">{statsTotal}</p>
		</div>
		<div class="bg-surface-elevated border border-border rounded-lg px-4 py-2.5 min-w-[100px]">
			<p class="text-[11px] text-ink-muted">Activos</p>
			<p class="text-lg font-bold text-ink tabular-nums">{statsActive}</p>
		</div>
		<div class="bg-surface-elevated border border-{statsCritical > 0 ? 'red-200' : 'border'} rounded-lg px-4 py-2.5 min-w-[100px]">
			<p class="text-[11px] text-ink-muted">Stock crítico</p>
			<p class="text-lg font-bold {statsCritical > 0 ? 'text-red-600' : 'text-ink'} tabular-nums">{statsCritical}</p>
		</div>
	</div>

	<!-- Formulario de creación -->
	{#if showCreateForm}
		<Card padding="md">
			<h2 class="text-sm font-semibold text-ink mb-4">Nuevo medicamento</h2>

			{#if form?.error}
				<p class="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
					{form.error}
				</p>
			{/if}
			{#if form?.success}
				<p class="mb-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
					Medicamento creado correctamente.
				</p>
			{/if}

			<form
				method="POST"
				action="?/crearMedicamento"
				use:enhance={() => {
					creating = true;
					return async ({ result, update }) => {
						creating = false;
						await update();
						if (result.type === 'success') {
							showCreateForm = false;
							await invalidateAll();
						}
					};
				}}
				class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
			>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="code">Código *</label>
					<input id="code" name="code" type="text" required placeholder="MED-XXX"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60 uppercase"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="generic_name">Nombre genérico *</label>
					<input id="generic_name" name="generic_name" type="text" required
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="commercial_name">Nombre comercial</label>
					<input id="commercial_name" name="commercial_name" type="text"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="pharmaceutical_form">Forma farmacéutica *</label>
					<input id="pharmaceutical_form" name="pharmaceutical_form" type="text" required placeholder="Tableta, Cápsula..."
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="concentration">Concentración</label>
					<input id="concentration" name="concentration" type="text" placeholder="500mg"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="unit_measure">Unidad de medida *</label>
					<input id="unit_measure" name="unit_measure" type="text" required placeholder="tabletas, cápsulas..."
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="therapeutic_class">Clase terapéutica</label>
					<input id="therapeutic_class" name="therapeutic_class" type="text" placeholder="Antibiótico..."
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<input type="hidden" name="controlled_substance" value="false" />
				<input type="hidden" name="requires_refrigeration" value="false" />

				<div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
					<Button type="button" variant="ghost" size="sm" onclick={() => (showCreateForm = false)}>Cancelar</Button>
					<Button type="submit" variant="primary" size="sm" isLoading={creating}>Crear medicamento</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- Filtros -->
	<div class="bg-surface-elevated rounded-xl border border-border p-3 sm:p-4">
		<InventoryFilters value={data.filters} onchange={applyFilters} />
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'code',               header: 'Código',       width: '100px' },
				{ key: 'generic_name',       header: 'Nombre genérico' },
				{ key: 'pharmaceutical_form', header: 'Forma farm.',  width: '120px' },
				{ key: 'therapeutic_class',  header: 'Clase',        width: '140px' },
				{ key: 'medication_status',  header: 'Estado',       width: '110px', align: 'center', render: statusCell },
				{ key: 'current_stock',      header: 'Stock',        width: '100px', align: 'right',  render: stockCell }
			] satisfies DataTableColumn<MedicationRow>[]}
			data={data.medications.data as MedicationRow[]}
			rowKey="id"
			emptyMessage="No hay medicamentos que coincidan con los filtros."
		/>

		{#if data.medications.total > data.medications.pageSize}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border">
				<span class="text-[11px] sm:text-xs text-ink-muted">
					{(data.medications.page - 1) * data.medications.pageSize + 1}–{Math.min(
						data.medications.page * data.medications.pageSize,
						data.medications.total
					)} de {data.medications.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" disabled={data.medications.page <= 1}
						onclick={() => changePage(data.medications.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="sm" disabled={!data.medications.hasNext}
						onclick={() => changePage(data.medications.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>
