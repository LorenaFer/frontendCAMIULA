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
	import StatusBadge from '$shared/components/inventory/StatusBadge.svelte';
	import StockIndicator from '$shared/components/inventory/StockIndicator.svelte';
	import InventoryFilters from '$shared/components/inventory/InventoryFilters.svelte';
	import { toastSuccess, toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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

	// Auto-generar código para nuevo medicamento
	const nextCode = $derived(`MED-${String(data.medications.total + 1).padStart(3, '0')}`);

	const statsTotal  = $derived(data.medications.total);
	const statsActive = $derived(
		(data.medications.data as Medication[]).filter((m) => m.medication_status === 'active').length
	);
	const statsCritical = $derived(
		(data.medications.data as Medication[]).filter((m) => m.current_stock < 10).length
	);

	function applyFilters(filters: { search?: string; status?: string; category_id?: string }) {
		const qs = new URLSearchParams();
		if (filters.search) qs.set('search', filters.search);
		if (filters.status) qs.set('status', filters.status);
		if ((filters as Record<string, string>).category_id) qs.set('category_id', (filters as Record<string, string>).category_id);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	let categoryFilter = $state(data.filters.category_id ?? '');

	function applyAllFilters(filters: { search?: string; status?: string }) {
		const qs = new URLSearchParams();
		if (filters.search) qs.set('search', filters.search);
		if (filters.status) qs.set('status', filters.status);
		if (categoryFilter) qs.set('category_id', categoryFilter);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	const pagination = $derived(data.medications);
	const pageSizeOptions = [10, 25, 50, 100];
</script>

{#snippet paginationBar()}
	{#if pagination.total > 0}
		<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 border-t border-border/30 bg-canvas-subtle/30">
			<div class="flex items-center gap-3">
				<p class="text-xs text-ink-muted">
					{((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
				</p>
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-subtle">Mostrar</span>
					<select
						class="text-xs border border-border/60 rounded-md px-1.5 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-viking-500/40"
						value={pagination.pageSize}
						onchange={(e) => changePage(1, Number((e.target as HTMLSelectElement).value))}
					>
						{#each pageSizeOptions as size}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</div>
			</div>
			{#if pagination.total > pagination.pageSize}
				{@const pages = Math.ceil(pagination.total / pagination.pageSize)}
				<div class="flex items-center gap-1">
					<button type="button" disabled={pagination.page <= 1} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changePage(pagination.page - 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
					</button>
					{#each Array.from({ length: Math.min(pages, 7) }, (_, i) => {
						const start = Math.max(1, Math.min(pagination.page - 3, pages - 6));
						return start + i;
					}) as p}
						<button type="button" class="w-7 h-7 rounded-md text-xs font-medium transition-colors {p === pagination.page ? 'bg-viking-600 text-white' : 'text-ink-muted hover:bg-canvas-subtle'}" onclick={() => changePage(p)}>
							{p}
						</button>
					{/each}
					<button type="button" disabled={!pagination.hasNext} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changePage(pagination.page + 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
					</button>
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

<svelte:head>
	<title>Catálogo de Medicamentos — Inventario</title>
</svelte:head>

{#snippet categoryCell(_v: unknown, row: MedicationRow, _index: number)}
	{@const name = (row.category_name as string | null)}
	{#if name}
		<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-viking-50 text-viking-700 dark:bg-viking-900/20 dark:text-viking-400">{name}</span>
	{:else}
		<span class="text-xs text-ink-subtle">—</span>
	{/if}
{/snippet}

{#snippet statusCell(_v: unknown, row: MedicationRow, _index: number)}
	<StatusBadge status={row.medication_status as string} />
{/snippet}

{#snippet stockCell(_v: unknown, row: MedicationRow, _index: number)}
	<StockIndicator stock={row.current_stock as number} />
{/snippet}


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

	<!-- Formulario de creación -->
	{#if showCreateForm}
		<Card padding="md">
			<h2 class="text-sm font-semibold text-ink mb-4">Nuevo medicamento</h2>

			<form
				method="POST"
				action="?/crearMedicamento"
				use:enhance={() => {
					creating = true;
					return async ({ result, update }) => {
						creating = false;
						await update();
						if (result.type === 'success') {
							toastSuccess('Medicamento creado', 'El medicamento fue registrado correctamente.');
							showCreateForm = false;
							await invalidateAll();
						} else if (result.type === 'failure') {
							toastError('Error al crear', (result.data as { error?: string })?.error ?? 'No se pudo crear el medicamento.');
						}
					};
				}}
				class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
			>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="code">Código *</label>
					<input id="code" name="code" type="text" required readonly value={nextCode}
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-canvas-subtle text-ink-muted cursor-not-allowed
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
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="fk_category_id">Categoría</label>
					<select id="fk_category_id" name="fk_category_id"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					>
						<option value="">Sin categoría</option>
						{#each data.categoryOptions as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
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
		<div class="flex flex-col sm:flex-row gap-3">
			<div class="flex-1">
				<InventoryFilters value={data.filters} onchange={applyAllFilters} />
			</div>
			<div class="sm:w-48">
				<label for="cat-filter" class="block text-xs font-medium text-ink-muted mb-1">Categoría</label>
				<select id="cat-filter" bind:value={categoryFilter}
					onchange={() => {
						const qs = new URLSearchParams($page.url.searchParams);
						if (categoryFilter) qs.set('category_id', categoryFilter);
						else qs.delete('category_id');
						qs.set('page', '1');
						goto(`?${qs}`, { replaceState: true });
					}}
					class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
					       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60">
					<option value="">Todas</option>
					{#each data.categoryOptions as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'code',               header: 'Código',       width: '100px' },
				{ key: 'generic_name',       header: 'Nombre genérico' },
				{ key: 'pharmaceutical_form', header: 'Forma',        width: '110px' },
				{ key: 'category_name',      header: 'Categoría',    width: '140px', render: categoryCell },
				{ key: 'medication_status',  header: 'Estado',       width: '110px', align: 'center', render: statusCell },
				{ key: 'current_stock',      header: 'Stock',        width: '100px', align: 'right',  render: stockCell }
			] as DataTableColumn<MedicationRow>[]}
			data={data.medications.data as MedicationRow[]}
			rowKey="id"
			rowMenu={medicationMenu}
			emptyMessage="No hay medicamentos que coincidan con los filtros."
		/>

		{@render paginationBar()}
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
						toastSuccess('Medicamento actualizado', 'Los cambios fueron guardados correctamente.');
						editingMed = null;
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al editar', (result.data as { error?: string })?.error ?? 'No se pudo actualizar el medicamento.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={editingMed.id} />
			<DialogBody>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-category">Categoría</label>
						<select
							id="edit-category"
							name="fk_category_id"
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Sin categoría</option>
							{#each data.categoryOptions as cat}
								<option value={cat.id} selected={editingMed.fk_category_id === cat.id}>{cat.name}</option>
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
					<StatusBadge status={viewingMed.medication_status} />
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
					<p class="text-ink-muted">Categoría</p>
					<p class="font-medium text-ink">{viewingMed.category_name ?? '—'}</p>
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
						toastWarning('Medicamento desactivado', `${deletingMed!.generic_name} (${deletingMed!.code}) fue desactivado.`);
						deletingMed = null;
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al desactivar', (result.data as { error?: string })?.error ?? 'No se pudo desactivar el medicamento.');
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
