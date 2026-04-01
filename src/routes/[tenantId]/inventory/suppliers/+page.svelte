<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { Supplier } from '$shared/types/inventory.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type SupplierRow = Supplier & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import StatusBadge from '$shared/components/inventory/StatusBadge.svelte';
	import { toastSuccess, toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tenantId = $derived($page.params.tenantId);
	let showCreateForm = $state(false);
	let creating = $state(false);
	let search = $state('');
	let editingSupplier = $state<Supplier | null>(null);
	let viewingSupplier = $state<Supplier | null>(null);
	let saving = $state(false);

	let deletingSupplier = $state<Supplier | null>(null);

	function closeAllModals() {
		viewingSupplier = null;
		editingSupplier = null;
		deletingSupplier = null;
	}

	function openEdit(row: Supplier) {
		closeAllModals();
		editingSupplier = { ...row };
	}
	function openDetail(row: Supplier) {
		closeAllModals();
		viewingSupplier = { ...row };
	}
	function openDelete(row: Supplier) {
		closeAllModals();
		deletingSupplier = { ...row };
	}

	const supplierMenu: RowMenuItem<SupplierRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => openDetail(row as unknown as Supplier) },
		{ label: 'Editar', icon: 'edit', onclick: (row) => openEdit(row as unknown as Supplier) },
		{ label: 'Eliminar', icon: 'delete', variant: 'danger', onclick: (row) => openDelete(row as unknown as Supplier) }
	];

	const filteredSuppliers = $derived(
		search.trim()
			? (data.suppliers.data as Supplier[]).filter((s) => {
					const q = search.trim().toLowerCase();
					return s.name.toLowerCase().includes(q) ||
						s.rif?.toLowerCase().includes(q) ||
						s.contact_name?.toLowerCase().includes(q) ||
						s.phone?.toLowerCase().includes(q);
				})
			: (data.suppliers.data as Supplier[])
	);

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Proveedores — Inventario</title>
</svelte:head>

{#snippet statusCell(_v: unknown, row: SupplierRow, _index: number)}
	<StatusBadge status={row.supplier_status as string} />
{/snippet}


<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: `/${tenantId}/inventory` },
		{ label: 'Proveedores' }
	]} />

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Proveedores</h1>
			<p class="text-sm text-ink-muted mt-0.5">Gestión de proveedores de medicamentos e insumos</p>
		</div>
		<Button variant="primary" size="md" onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancelar' : '+ Agregar proveedor'}
		</Button>
	</div>

	<!-- Formulario de creación -->
	{#if showCreateForm}
		<Card padding="md">
			<h2 class="text-sm font-semibold text-ink mb-4">Nuevo proveedor</h2>

			<form
				method="POST"
				action="?/crearProveedor"
				use:enhance={() => {
					creating = true;
					return async ({ result, update }) => {
						creating = false;
						await update();
						if (result.type === 'success') {
							toastSuccess('Proveedor creado', 'El proveedor fue registrado correctamente.');
							showCreateForm = false;
							await invalidateAll();
						} else if (result.type === 'failure') {
							toastError('Error al crear', (result.data as { error?: string })?.error ?? 'No se pudo crear el proveedor.');
						}
					};
				}}
				class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
			>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="name">Nombre *</label>
					<input id="name" name="name" type="text" required
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="rif">RIF *</label>
					<input id="rif" name="rif" type="text" required placeholder="J-12345678-9"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60 uppercase"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="contact_name">Contacto</label>
					<input id="contact_name" name="contact_name" type="text"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="phone">Teléfono</label>
					<input id="phone" name="phone" type="tel"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="email">Correo</label>
					<input id="email" name="email" type="email"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="payment_terms">Condiciones de pago</label>
					<input id="payment_terms" name="payment_terms" type="text" placeholder="ej: 30 días"
						class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>

				<div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
					<Button type="button" variant="ghost" size="md" onclick={() => (showCreateForm = false)}>Cancelar</Button>
					<Button type="submit" variant="primary" size="md" isLoading={creating}>Crear proveedor</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- Buscador -->
	<div class="bg-surface-elevated rounded-xl border border-border p-3 sm:p-4">
		<label for="supplier-search" class="block text-sm font-medium text-ink-muted mb-1">Buscar proveedor</label>
		<input
			id="supplier-search"
			type="search"
			placeholder="Nombre, RIF o contacto..."
			bind:value={search}
			class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
			       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
		/>
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'name',            header: 'Nombre' },
				{ key: 'rif',             header: 'RIF',        width: '150px' },
				{ key: 'contact_name',    header: 'Contacto',   width: '160px' },
				{ key: 'phone',           header: 'Teléfono',   width: '140px' },
				{ key: 'payment_terms',   header: 'Condiciones', width: '130px' },
				{ key: 'supplier_status', header: 'Estado',     width: '100px', align: 'center', render: statusCell }
			] as DataTableColumn<SupplierRow>[]}
			data={filteredSuppliers as SupplierRow[]}
			rowMenu={supplierMenu}
			rowKey="id"
			emptyMessage="No hay proveedores registrados."
		/>

		{#if data.suppliers.total > data.suppliers.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-sm text-ink-muted">
					{(data.suppliers.page - 1) * data.suppliers.pageSize + 1}–{Math.min(
						data.suppliers.page * data.suppliers.pageSize, data.suppliers.total
					)} de {data.suppliers.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="md" disabled={data.suppliers.page <= 1}
						onclick={() => changePage(data.suppliers.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="md" disabled={!data.suppliers.hasNext}
						onclick={() => changePage(data.suppliers.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>

<!-- Modal de edición de proveedor -->
{#if editingSupplier}
	<Dialog open={true} onClose={() => { editingSupplier = null; }} size="md">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">RIF: {editingSupplier.rif}</p>
			<h2 class="text-base font-semibold text-ink">Editar proveedor</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/editarProveedor"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					await update();
					if (result.type === 'success') {
						toastSuccess('Proveedor actualizado', 'Los cambios fueron guardados correctamente.');
						editingSupplier = null;
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al editar', (result.data as { error?: string })?.error ?? 'No se pudo actualizar el proveedor.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={editingSupplier.id} />
			<DialogBody>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-name">Nombre *</label>
						<input id="edit-name" name="name" type="text" required value={editingSupplier.name}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-contact">Contacto</label>
						<input id="edit-contact" name="contact_name" type="text" value={editingSupplier.contact_name ?? ''}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-phone">Teléfono</label>
							<input id="edit-phone" name="phone" type="tel" value={editingSupplier.phone ?? ''}
								class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
								       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-email">Correo</label>
							<input id="edit-email" name="email" type="email" value={editingSupplier.email ?? ''}
								class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
								       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-payment">Condiciones de pago</label>
						<input id="edit-payment" name="payment_terms" type="text" value={editingSupplier.payment_terms ?? ''}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>
				</div>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { editingSupplier = null; }}>Cancelar</Button>
				<Button type="submit" variant="primary" size="md" isLoading={saving}>Guardar cambios</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}

<!-- Modal de detalle de proveedor -->
{#if viewingSupplier}
	<Dialog open={true} onClose={() => { viewingSupplier = null; }} size="md">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal font-mono">{viewingSupplier.rif}</p>
			<h2 class="text-base font-semibold text-ink">{viewingSupplier.name}</h2>
		</DialogHeader>
		<DialogBody>
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-ink-muted">Contacto</p>
					<p class="font-medium text-ink">{viewingSupplier.contact_name ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Estado</p>
					<StatusBadge status={viewingSupplier.supplier_status} />
				</div>
				<div>
					<p class="text-ink-muted">Teléfono</p>
					<p class="font-medium text-ink">{viewingSupplier.phone ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Correo</p>
					<p class="font-medium text-ink">{viewingSupplier.email ?? '—'}</p>
				</div>
				<div class="col-span-2">
					<p class="text-ink-muted">Condiciones de pago</p>
					<p class="font-medium text-ink">{viewingSupplier.payment_terms ?? '—'}</p>
				</div>
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { viewingSupplier = null; }}>Cerrar</Button>
			<Button type="button" variant="primary" size="md" onclick={() => { const s = viewingSupplier!; openEdit(s); }}>Editar</Button>
		</DialogFooter>
	</Dialog>
{/if}

<!-- Modal de confirmación de eliminación -->
{#if deletingSupplier}
	<Dialog open={true} onClose={() => { deletingSupplier = null; }} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Desactivar proveedor</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/desactivarProveedor"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						toastWarning('Proveedor desactivado', `${deletingSupplier!.name} (${deletingSupplier!.rif}) fue desactivado.`);
						deletingSupplier = null;
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al desactivar', (result.data as { error?: string })?.error ?? 'No se pudo desactivar el proveedor.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={deletingSupplier.id} />
			<DialogBody>
				<p class="text-sm text-ink">
					¿Está seguro de que desea desactivar al proveedor
					<strong>{deletingSupplier.name}</strong> ({deletingSupplier.rif})?
				</p>
				<p class="text-sm text-ink-muted mt-2">
					El proveedor quedará como "Inactivo" y no estará disponible para nuevas órdenes de compra.
				</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { deletingSupplier = null; }}>Cancelar</Button>
				<Button type="submit" variant="danger" size="md">Desactivar</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
