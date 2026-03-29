<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PurchaseOrder } from '$shared/types/inventory.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type OrderRow = PurchaseOrder & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import NewOrderForm from './NewOrderForm.svelte';
	import ReceiveOrderModal from './ReceiveOrderModal.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showNewOrderForm = $state(false);
	let orderToReceive = $state<PurchaseOrder | null>(null);

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}

	const statusLabels: Record<string, { label: string; classes: string }> = {
		draft:     { label: 'Borrador',  classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
		sent:      { label: 'Enviada',   classes: 'bg-iris-100 text-iris-700 dark:bg-iris-900/30 dark:text-iris-300' },
		partial:   { label: 'Parcial',   classes: 'bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300' },
		received:  { label: 'Recibida',  classes: 'bg-sage-100 text-sage-800 dark:bg-sage-900/30 dark:text-sage-300' },
		cancelled: { label: 'Cancelada', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
	};

	const isMockError = $derived(
		typeof (form as { error?: string })?.error === 'string' &&
		(form as { error?: string }).error!.includes('backend')
	);
</script>

<svelte:head>
	<title>Órdenes de Compra — Inventario</title>
</svelte:head>

{#snippet supplierNameCell(_v: unknown, row: OrderRow, _index: number)}
	<span class="text-sm text-ink">{(row.supplier as { name: string })?.name ?? '—'}</span>
{/snippet}

{#snippet statusCell(_v: unknown, row: OrderRow, _index: number)}
	{@const s = statusLabels[row.order_status as string] ?? { label: String(row.order_status), classes: '' }}
	<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {s.classes}">{s.label}</span>
{/snippet}

{#snippet actionsCell(_v: unknown, row: OrderRow, _index: number)}
	{#if row.order_status === 'sent' || row.order_status === 'partial'}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onclick={() => { orderToReceive = row as unknown as PurchaseOrder; }}
		>
			Registrar recepción
		</Button>
	{/if}
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Órdenes de Compra</h1>
			<p class="text-xs text-ink-muted mt-0.5">Seguimiento de compras y recepciones de inventario</p>
		</div>
		{#if !showNewOrderForm}
			<Button variant="primary" size="sm" onclick={() => { showNewOrderForm = true; }}>
				Nueva orden
			</Button>
		{/if}
	</div>

	{#if (form as { error?: string })?.error}
		<p class="text-sm rounded-lg px-3 py-2 border {isMockError
			? 'text-honey-800 bg-honey-50 dark:bg-honey-900/20 border-honey-200 dark:border-honey-800'
			: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}">
			{(form as { error?: string }).error}
		</p>
	{/if}
	{#if (form as { success?: boolean })?.success}
		<p class="text-sm text-sage-700 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-lg px-3 py-2">
			{#if (form as { action?: string })?.action === 'created'}
				Orden de compra creada correctamente.
			{:else}
				Recepción registrada correctamente.
			{/if}
		</p>
	{/if}

	{#if showNewOrderForm}
		<NewOrderForm
			supplierOptions={data.supplierOptions}
			medicationOptions={data.medicationOptions}
			onCancel={() => { showNewOrderForm = false; }}
		/>
	{/if}

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'order_number', header: 'N° Orden',   width: '130px' },
				{ key: 'supplier',     header: 'Proveedor',  render: supplierNameCell },
				{ key: 'order_date',   header: 'Fecha',      width: '110px' },
				{ key: 'expected_date', header: 'Esperada',  width: '110px' },
				{ key: 'order_status', header: 'Estado',     width: '110px', align: 'center', render: statusCell },
				{ key: '_actions',     header: '',           width: '160px', align: 'right',  render: actionsCell }
			] as DataTableColumn<OrderRow>[]}
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

{#if orderToReceive}
	<ReceiveOrderModal
		order={orderToReceive}
		onClose={() => { orderToReceive = null; }}
	/>
{/if}
