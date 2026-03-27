<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { PurchaseOrder } from '$shared/types/inventory.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type OrderRow = PurchaseOrder & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let receivingId = $state<string | null>(null);

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}

	const statusLabels: Record<string, { label: string; classes: string }> = {
		draft:     { label: 'Borrador',  classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
		sent:      { label: 'Enviada',   classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
		partial:   { label: 'Parcial',   classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
		received:  { label: 'Recibida',  classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
		cancelled: { label: 'Cancelada', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
	};
</script>

<svelte:head>
	<title>Órdenes de Compra — Inventario</title>
</svelte:head>

{#snippet statusCell(_v: unknown, row: OrderRow)}
	{@const s = statusLabels[row.order_status as string] ?? { label: String(row.order_status), classes: '' }}
	<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {s.classes}">{s.label}</span>
{/snippet}

{#snippet actionsCell(_v: unknown, row: OrderRow)}
	{#if row.order_status === 'sent' || row.order_status === 'partial'}
		<form
			method="POST"
			action="?/recibirOrden"
			use:enhance={() => {
				receivingId = row.id as string;
				return async ({ update }) => {
					receivingId = null;
					await update();
					await invalidateAll();
				};
			}}
		>
			<input type="hidden" name="order_id" value={row.id} />
			<Button
				type="submit"
				variant="ghost"
				size="sm"
				isLoading={receivingId === (row.id as string)}
			>
				Registrar recepción
			</Button>
		</form>
	{/if}
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Órdenes de Compra</h1>
			<p class="text-xs text-ink-muted mt-0.5">Seguimiento de compras y recepciones de inventario</p>
		</div>
	</div>

	{#if form?.error}
		<p class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
			{form.error}
		</p>
	{/if}
	{#if form?.success}
		<p class="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
			Recepción registrada correctamente.
		</p>
	{/if}

	<!-- Nota: creación de órdenes requiere backend -->
	<div class="flex items-start gap-2.5 p-3 rounded-lg bg-canvas-subtle border border-border text-xs text-ink-muted">
		<svg class="w-4 h-4 shrink-0 mt-0.5 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
		</svg>
		<span>La creación de nuevas órdenes de compra estará disponible con la integración al backend. Por ahora puede registrar recepciones de órdenes existentes.</span>
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'order_number', header: 'N° Orden',   width: '130px' },
				{ key: 'supplier',     header: 'Proveedor',  render: (_v, row) => (row.supplier as { name: string }).name },
				{ key: 'order_date',   header: 'Fecha',      width: '110px' },
				{ key: 'expected_date', header: 'Esperada',  width: '110px' },
				{ key: 'order_status', header: 'Estado',     width: '110px', align: 'center', render: statusCell },
				{ key: '_actions',     header: '',           width: '160px', align: 'right',  render: actionsCell }
			] satisfies DataTableColumn<OrderRow>[]}
			data={data.orders.data as OrderRow[]}
			rowKey="id"
			emptyMessage="No hay órdenes de compra registradas."
		/>

		{#if data.orders.total > data.orders.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-xs text-ink-muted">
					{(data.orders.page - 1) * data.orders.pageSize + 1}–{Math.min(
						data.orders.page * data.orders.pageSize, data.orders.total
					)} de {data.orders.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" disabled={data.orders.page <= 1}
						onclick={() => changePage(data.orders.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="sm" disabled={!data.orders.hasNext}
						onclick={() => changePage(data.orders.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>
