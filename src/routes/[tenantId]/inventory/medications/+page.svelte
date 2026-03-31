<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { Medication } from '$shared/types/inventory.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type MedicationRow = Medication & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import MedicationBadge from '$shared/components/inventory/MedicationBadge.svelte';
	import StockIndicator from '$shared/components/inventory/StockIndicator.svelte';
	import InventoryFilters from '$shared/components/inventory/InventoryFilters.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const tenantId = $derived($page.params.tenantId);

	let showCreateForm = $state(false);
	let creating = $state(false);
	let editingMed = $state<Medication | null>(null);
	let viewingMed = $state<Medication | null>(null);
	let saving = $state(false);

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

{#snippet statusCell(_v: unknown, row: MedicationRow, _index: number)}
	<MedicationBadge status={row.medication_status as Medication['medication_status']} />
{/snippet}

{#snippet stockCell(_v: unknown, row: MedicationRow, _index: number)}
	<StockIndicator stock={row.current_stock as number} />
{/snippet}


<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: `/${tenantId}/inventory` },
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
				<p class="mb-3 text-sm text-sage-700 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-lg px-3 py-2">
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
					<label class="block text-sm font-medium text-ink-muted mb-1" for="code">Código *</label>
					<input id="code" name="code" type="text" required placeholder="MED-XXX"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60 uppercase"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="generic_name">Nombre genérico *</label>
					<input id="generic_name" name="generic_name" type="text" required
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="commercial_name">Nombre comercial</label>
					<input id="commercial_name" name="commercial_name" type="text"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="pharmaceutical_form">Forma farmacéutica *</label>
					<select id="pharmaceutical_form" name="pharmaceutical_form" required
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					>
						<option value="">Seleccionar...</option>
						<option value="Tableta">Tableta</option>
						<option value="Cápsula">Cápsula</option>
						<option value="Jarabe">Jarabe</option>
						<option value="Inyectable">Inyectable</option>
						<option value="Crema">Crema</option>
						<option value="Ungüento">Ungüento</option>
						<option value="Gotas">Gotas</option>
						<option value="Suspensión">Suspensión</option>
						<option value="Solución">Solución</option>
						<option value="Supositorio">Supositorio</option>
						<option value="Parche">Parche</option>
						<option value="Inhalador">Inhalador</option>
						<option value="Polvo">Polvo</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="concentration">Concentración</label>
					<input id="concentration" name="concentration" type="text" placeholder="500mg"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="unit_measure">Unidad de medida *</label>
					<select id="unit_measure" name="unit_measure" required
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					>
						<option value="">Seleccionar...</option>
						<option value="tabletas">Tabletas</option>
						<option value="cápsulas">Cápsulas</option>
						<option value="mL">mL (mililitros)</option>
						<option value="mg">mg (miligramos)</option>
						<option value="g">g (gramos)</option>
						<option value="unidades">Unidades</option>
						<option value="ampollas">Ampollas</option>
						<option value="sobres">Sobres</option>
						<option value="parches">Parches</option>
						<option value="dosis">Dosis</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="therapeutic_class">Clase terapéutica</label>
					<select id="therapeutic_class" name="therapeutic_class"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					>
						<option value="">Seleccionar (opcional)...</option>
						<option value="Analgésico">Analgésico</option>
						<option value="Antibiótico">Antibiótico</option>
						<option value="Antiinflamatorio">Antiinflamatorio</option>
						<option value="Antihipertensivo">Antihipertensivo</option>
						<option value="Antidiabético">Antidiabético</option>
						<option value="Antihistamínico">Antihistamínico</option>
						<option value="Antipirético">Antipirético</option>
						<option value="Ansiolítico">Ansiolítico</option>
						<option value="Broncodilatador">Broncodilatador</option>
						<option value="Corticosteroide">Corticosteroide</option>
						<option value="Diurético">Diurético</option>
						<option value="Gastroprotector">Gastroprotector</option>
						<option value="Vitamina/Suplemento">Vitamina/Suplemento</option>
						<option value="Otro">Otro</option>
					</select>
				</div>
				<input type="hidden" name="controlled_substance" value="false" />
				<input type="hidden" name="requires_refrigeration" value="false" />

				<div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
					<Button type="button" variant="ghost" size="md" onclick={() => (showCreateForm = false)}>Cancelar</Button>
					<Button type="submit" variant="primary" size="md" isLoading={creating}>Crear medicamento</Button>
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
				{ key: 'pharmaceutical_form', header: 'Forma farmacéutica',  width: '120px' },
				{ key: 'therapeutic_class',  header: 'Clase',        width: '140px' },
				{ key: 'medication_status',  header: 'Estado',       width: '110px', align: 'center', render: statusCell },
				{ key: 'current_stock',      header: 'Stock',        width: '100px', align: 'right',  render: stockCell }
			] as DataTableColumn<MedicationRow>[]}
			data={data.medications.data as MedicationRow[]}
			rowKey="id"
			rowMenu={medicationMenu}
			emptyMessage="No hay medicamentos que coincidan con los filtros."
		/>

		{#if data.medications.total > data.medications.pageSize}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border">
				<span class="text-sm text-ink-muted">
					{(data.medications.page - 1) * data.medications.pageSize + 1}–{Math.min(
						data.medications.page * data.medications.pageSize,
						data.medications.total
					)} de {data.medications.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="md" disabled={data.medications.page <= 1}
						onclick={() => changePage(data.medications.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="md" disabled={!data.medications.hasNext}
						onclick={() => changePage(data.medications.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>

<!-- Modal de edición de medicamento -->
{#if editingMed}
	<Dialog open={true} onClose={() => { editingMed = null; }} size="lg">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">Código: {editingMed.code}</p>
			<h2 class="text-base font-semibold text-ink">Editar medicamento</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/editarMedicamento"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					await update();
					if (result.type === 'success') {
						editingMed = null;
						await invalidateAll();
					}
				};
			}}
		>
			<input type="hidden" name="id" value={editingMed.id} />
			<DialogBody>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#if form?.error}
						<p class="sm:col-span-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
							{form.error}
						</p>
					{/if}

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-code">Código</label>
						<input
							id="edit-code"
							type="text"
							disabled
							value={editingMed.code}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-canvas-subtle text-ink-muted cursor-not-allowed"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-generic-name">Nombre genérico *</label>
						<input
							id="edit-generic-name"
							name="generic_name"
							type="text"
							required
							value={editingMed.generic_name}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-commercial-name">Nombre comercial</label>
						<input
							id="edit-commercial-name"
							name="commercial_name"
							type="text"
							value={editingMed.commercial_name ?? ''}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-pharmaceutical-form">Forma farmacéutica *</label>
						<select
							id="edit-pharmaceutical-form"
							name="pharmaceutical_form"
							required
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Seleccionar...</option>
							{#each ['Tableta', 'Cápsula', 'Jarabe', 'Inyectable', 'Crema', 'Ungüento', 'Gotas', 'Suspensión', 'Solución', 'Supositorio', 'Parche', 'Inhalador', 'Polvo'] as opt}
								<option value={opt} selected={editingMed.pharmaceutical_form === opt}>{opt}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-concentration">Concentración</label>
						<input
							id="edit-concentration"
							name="concentration"
							type="text"
							value={editingMed.concentration ?? ''}
							placeholder="500mg"
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-unit-measure">Unidad de medida *</label>
						<select
							id="edit-unit-measure"
							name="unit_measure"
							required
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Seleccionar...</option>
							{#each [['tabletas', 'Tabletas'], ['cápsulas', 'Cápsulas'], ['mL', 'mL (mililitros)'], ['mg', 'mg (miligramos)'], ['g', 'g (gramos)'], ['unidades', 'Unidades'], ['ampollas', 'Ampollas'], ['sobres', 'Sobres'], ['parches', 'Parches'], ['dosis', 'Dosis']] as [val, label]}
								<option value={val} selected={editingMed.unit_measure === val}>{label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-therapeutic-class">Clase terapéutica</label>
						<select
							id="edit-therapeutic-class"
							name="therapeutic_class"
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Sin clase</option>
							{#each ['Analgésico', 'Antibiótico', 'Antiinflamatorio', 'Antihipertensivo', 'Antidiabético', 'Antihistamínico', 'Antipirético', 'Ansiolítico', 'Broncodilatador', 'Corticosteroide', 'Diurético', 'Gastroprotector', 'Vitamina/Suplemento', 'Otro'] as opt}
								<option value={opt} selected={editingMed.therapeutic_class === opt}>{opt}</option>
							{/each}
						</select>
					</div>
				</div>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { editingMed = null; }}>Cancelar</Button>
				<Button type="submit" variant="primary" size="md" isLoading={saving}>Guardar cambios</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}

<!-- Modal de detalle de medicamento -->
{#if viewingMed}
	<Dialog open={true} onClose={() => { viewingMed = null; }} size="md">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal font-mono">{viewingMed.code}</p>
			<h2 class="text-base font-semibold text-ink">{viewingMed.generic_name}</h2>
		</DialogHeader>
		<DialogBody>
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-ink-muted">Nombre comercial</p>
					<p class="font-medium text-ink">{viewingMed.commercial_name ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Estado</p>
					<MedicationBadge status={viewingMed.medication_status} />
				</div>
				<div>
					<p class="text-ink-muted">Forma farmacéutica</p>
					<p class="font-medium text-ink">{viewingMed.pharmaceutical_form}</p>
				</div>
				<div>
					<p class="text-ink-muted">Concentración</p>
					<p class="font-medium text-ink">{viewingMed.concentration ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Unidad de medida</p>
					<p class="font-medium text-ink">{viewingMed.unit_measure}</p>
				</div>
				<div>
					<p class="text-ink-muted">Clase terapéutica</p>
					<p class="font-medium text-ink">{viewingMed.therapeutic_class ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Stock actual</p>
					<div class="mt-0.5"><StockIndicator stock={viewingMed.current_stock} /></div>
				</div>
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { viewingMed = null; }}>Cerrar</Button>
			<Button type="button" variant="primary" size="md" onclick={() => { const med = viewingMed!; openEdit(med); }}>Editar</Button>
		</DialogFooter>
	</Dialog>
{/if}

<!-- Modal de confirmación de eliminación -->
{#if deletingMed}
	<Dialog open={true} onClose={() => { deletingMed = null; }} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Desactivar medicamento</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/desactivarMedicamento"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						deletingMed = null;
						await invalidateAll();
					}
				};
			}}
		>
			<input type="hidden" name="id" value={deletingMed.id} />
			<DialogBody>
				<p class="text-sm text-ink">
					¿Está seguro de que desea desactivar el medicamento
					<strong>{deletingMed.generic_name}</strong> ({deletingMed.code})?
				</p>
				<p class="text-sm text-ink-muted mt-2">
					El medicamento quedará como "Descontinuado" y no aparecerá en nuevas recetas ni órdenes.
				</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { deletingMed = null; }}>Cancelar</Button>
				<Button type="submit" variant="danger" size="md">Desactivar</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
