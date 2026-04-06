<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { MedicationCategory } from '$domain/inventory/types.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type CategoryRow = MedicationCategory & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import { toastSuccess, toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data }: { data: PageData } = $props();

	let showCreateForm = $state(false);
	let creating = $state(false);
	let editingCat = $state<MedicationCategory | null>(null);
	let deletingCat = $state<MedicationCategory | null>(null);
	let saving = $state(false);
	let search = $state(data.search ?? '');

	function closeAllModals() {
		editingCat = null;
		deletingCat = null;
	}

	function openEdit(row: MedicationCategory) {
		closeAllModals();
		editingCat = { ...row };
	}

	function openDelete(row: MedicationCategory) {
		closeAllModals();
		deletingCat = { ...row };
	}

	const categoryMenu: RowMenuItem<CategoryRow>[] = [
		{ label: 'Editar', icon: 'edit', onclick: (row) => openEdit(row as unknown as MedicationCategory) },
		{ label: 'Eliminar', icon: 'delete', variant: 'danger', onclick: (row) => openDelete(row as unknown as MedicationCategory) }
	];

	function doSearch() {
		const qs = new URLSearchParams();
		if (search.trim()) qs.set('search', search.trim());
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	const pagination = $derived(data.categories);
	const pageSizeOptions = [10, 25, 50, 100];

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString('es-VE', {
				day: '2-digit', month: '2-digit', year: 'numeric'
			});
		} catch { return iso; }
	}
</script>

{#snippet dateCell(_v: unknown, row: CategoryRow, _index: number)}
	<span class="text-xs text-ink-muted">{formatDate(row.created_at as string)}</span>
{/snippet}

{#snippet descriptionCell(_v: unknown, row: CategoryRow, _index: number)}
	<span class="text-sm text-ink-muted">{(row.description as string) ?? '—'}</span>
{/snippet}

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
	<title>Categorías — Inventario</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: '/inventory' },
		{ label: 'Categorías' }
	]} />

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Categorías de Medicamentos</h1>
			<p class="text-sm text-ink-muted mt-0.5">Clasificación de medicamentos e insumos médicos</p>
		</div>
		<Button variant="primary" size="md" onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancelar' : '+ Nueva categoría'}
		</Button>
	</div>

	<!-- Formulario de creación -->
	{#if showCreateForm}
		<Card padding="md">
			<h2 class="text-sm font-semibold text-ink mb-4">Nueva categoría</h2>
			<form
				method="POST"
				action="?/crearCategoria"
				use:enhance={() => {
					creating = true;
					return async ({ result, update }) => {
						creating = false;
						await update();
						if (result.type === 'success') {
							toastSuccess('Categoría creada', 'La categoría fue registrada correctamente.');
							showCreateForm = false;
							await invalidateAll();
						} else if (result.type === 'failure') {
							toastError('Error al crear', (result.data as { error?: string })?.error ?? 'No se pudo crear la categoría.');
						}
					};
				}}
				class="grid grid-cols-1 sm:grid-cols-2 gap-3"
			>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="cat-name">Nombre *</label>
					<input id="cat-name" name="name" type="text" required placeholder="Ej: Antibiótico"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="cat-desc">Descripción</label>
					<input id="cat-desc" name="description" type="text" placeholder="Descripción opcional"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div class="sm:col-span-2 flex justify-end gap-2 pt-1">
					<Button type="button" variant="ghost" size="md" onclick={() => (showCreateForm = false)}>Cancelar</Button>
					<Button type="submit" variant="primary" size="md" isLoading={creating}>Crear categoría</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- Buscador -->
	<div class="bg-surface-elevated rounded-xl border border-border p-3 sm:p-4">
		<div class="flex gap-2">
			<input
				type="search"
				placeholder="Buscar categoría..."
				bind:value={search}
				onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }}
				class="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-surface text-ink
				       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
			/>
			<button type="button" onclick={doSearch}
				class="h-9 px-4 text-sm font-medium rounded-lg bg-viking-600 text-white hover:bg-viking-700 transition-colors
				       shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
				Buscar
			</button>
		</div>
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'name',        header: 'Nombre',      width: '200px' },
				{ key: 'description', header: 'Descripción', render: descriptionCell },
				{ key: 'created_at',  header: 'Creada',      width: '120px', render: dateCell }
			] as DataTableColumn<CategoryRow>[]}
			data={data.categories.data as CategoryRow[]}
			rowKey="id"
			rowMenu={categoryMenu}
			emptyMessage="No hay categorías registradas."
		/>

		{@render paginationBar()}
	</Card>
</div>

<!-- Modal de edición -->
{#if editingCat}
	<Dialog open={true} onClose={() => { editingCat = null; }} size="md">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Editar categoría</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/editarCategoria"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					await update();
					if (result.type === 'success') {
						toastSuccess('Categoría actualizada', 'Los cambios fueron guardados correctamente.');
						editingCat = null;
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al editar', (result.data as { error?: string })?.error ?? 'No se pudo actualizar la categoría.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={editingCat.id} />
			<DialogBody>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-cat-name">Nombre *</label>
						<input
							id="edit-cat-name"
							name="name"
							type="text"
							required
							value={editingCat.name}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-cat-desc">Descripción</label>
						<input
							id="edit-cat-desc"
							name="description"
							type="text"
							value={editingCat.description ?? ''}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>
				</div>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { editingCat = null; }}>Cancelar</Button>
				<Button type="submit" variant="primary" size="md" isLoading={saving}>Guardar cambios</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}

<!-- Modal de confirmación de eliminación -->
{#if deletingCat}
	<Dialog open={true} onClose={() => { deletingCat = null; }} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Eliminar categoría</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/eliminarCategoria"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						toastWarning('Categoría eliminada', `"${deletingCat!.name}" fue eliminada.`);
						deletingCat = null;
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al eliminar', (result.data as { error?: string })?.error ?? 'No se pudo eliminar la categoría.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={deletingCat.id} />
			<DialogBody>
				<p class="text-sm text-ink">
					¿Está seguro de que desea eliminar la categoría <strong>{deletingCat.name}</strong>?
				</p>
				<p class="text-sm text-ink-muted mt-2">
					Los medicamentos asociados quedarán sin categoría.
				</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { deletingCat = null; }}>Cancelar</Button>
				<Button type="submit" variant="danger" size="md">Eliminar</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
