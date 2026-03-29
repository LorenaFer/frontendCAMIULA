<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { Supplier } from '$shared/types/inventory.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type SupplierRow = Supplier & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
	let creating = $state(false);

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
	{#if row.supplier_status === 'active'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sage-100 text-sage-800 dark:bg-sage-900/30 dark:text-sage-300">Activo</span>
	{:else}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Inactivo</span>
	{/if}
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Proveedores</h1>
			<p class="text-xs text-ink-muted mt-0.5">Gestión de proveedores de medicamentos e insumos</p>
		</div>
		<Button variant="primary" size="sm" onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancelar' : '+ Agregar proveedor'}
		</Button>
	</div>

	<!-- Formulario de creación -->
	{#if showCreateForm}
		<Card padding="md">
			<h2 class="text-sm font-semibold text-ink mb-4">Nuevo proveedor</h2>

			{#if form?.error}
				<p class="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
					{form.error}
				</p>
			{/if}
			{#if form?.success}
				<p class="mb-3 text-sm text-sage-700 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-lg px-3 py-2">
					Proveedor creado correctamente.
				</p>
			{/if}

			<form
				method="POST"
				action="?/crearProveedor"
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
					<label class="block text-xs font-medium text-ink-muted mb-1" for="name">Nombre *</label>
					<input id="name" name="name" type="text" required
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="rif">RIF *</label>
					<input id="rif" name="rif" type="text" required placeholder="J-12345678-9"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60 uppercase"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="contact_name">Contacto</label>
					<input id="contact_name" name="contact_name" type="text"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="phone">Teléfono</label>
					<input id="phone" name="phone" type="tel"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="email">Correo</label>
					<input id="email" name="email" type="email"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1" for="payment_terms">Condiciones de pago</label>
					<input id="payment_terms" name="payment_terms" type="text" placeholder="ej: 30 días"
						class="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
					/>
				</div>

				<div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
					<Button type="button" variant="ghost" size="sm" onclick={() => (showCreateForm = false)}>Cancelar</Button>
					<Button type="submit" variant="primary" size="sm" isLoading={creating}>Crear proveedor</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'name',            header: 'Nombre' },
				{ key: 'rif',             header: 'RIF',        width: '150px' },
				{ key: 'contact_name',    header: 'Contacto',   width: '160px' },
				{ key: 'phone',           header: 'Teléfono',   width: '140px' },
				{ key: 'payment_terms',   header: 'Pago',       width: '120px' },
				{ key: 'supplier_status', header: 'Estado',     width: '100px', align: 'center', render: statusCell }
			] as DataTableColumn<SupplierRow>[]}
			data={data.suppliers.data as SupplierRow[]}
			rowKey="id"
			emptyMessage="No hay proveedores registrados."
		/>

		{#if data.suppliers.total > data.suppliers.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-xs text-ink-muted">
					{(data.suppliers.page - 1) * data.suppliers.pageSize + 1}–{Math.min(
						data.suppliers.page * data.suppliers.pageSize, data.suppliers.total
					)} de {data.suppliers.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" disabled={data.suppliers.page <= 1}
						onclick={() => changePage(data.suppliers.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="sm" disabled={!data.suppliers.hasNext}
						onclick={() => changePage(data.suppliers.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>
