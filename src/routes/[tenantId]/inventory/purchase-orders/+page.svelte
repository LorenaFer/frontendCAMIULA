<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { PurchaseOrder } from '$shared/types/inventory.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type OrderRow = PurchaseOrder & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import StatusBadge from '$shared/components/inventory/StatusBadge.svelte';
	import NewOrderForm from './NewOrderForm.svelte';
	import ReceiveOrderModal from './ReceiveOrderModal.svelte';
	import { toastSuccess, toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tenantId = $derived($page.params.tenantId);
	let showNewOrderForm = $state(false);
	let orderToReceive = $state<PurchaseOrder | null>(null);
	let orderDetail = $state<PurchaseOrder | null>(null);
	let search = $state('');
	let statusFilter = $state('');

	function openDetail(row: PurchaseOrder) {
		orderDetail = { ...row };
	}

	function formatDateTime(iso?: string) {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
		} catch { return iso; }
	}

	const orderMenu: RowMenuItem<OrderRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => openDetail(row as unknown as PurchaseOrder) }
	];

	const filteredOrders = $derived(() => {
		let items = data.orders.data as PurchaseOrder[];
		const q = search.trim().toLowerCase();
		if (q) {
			items = items.filter((o) =>
				o.order_number?.toLowerCase().includes(q) ||
				(o.supplier as { name?: string })?.name?.toLowerCase().includes(q)
			);
		}
		if (statusFilter) {
			items = items.filter((o) => o.order_status === statusFilter);
		}
		return items;
	});

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


</script>

<svelte:head>
	<title>Órdenes de Compra — Inventario</title>
</svelte:head>

{#snippet orderNumberCell(_v: unknown, row: OrderRow, _index: number)}
	<button
		type="button"
		class="text-sm font-mono text-viking-600 dark:text-viking-400 hover:underline cursor-pointer"
		onclick={() => openDetail(row as unknown as PurchaseOrder)}
	>
		{row.order_number}
	</button>
{/snippet}

{#snippet supplierNameCell(_v: unknown, row: OrderRow, _index: number)}
	<span class="text-sm text-ink">{(row.supplier as { name: string })?.name ?? '—'}</span>
{/snippet}

{#snippet statusCell(_v: unknown, row: OrderRow, _index: number)}
	{@const status = row.order_status as string}
	{@const steps = ['draft', 'sent', 'received']}
	{@const isCancelled = status === 'cancelled'}
	{@const currentIdx = status === 'partial' ? 1.5 : steps.indexOf(status)}
	{#if isCancelled}
		<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
			<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" /></svg>
			Cancelada
		</span>
	{:else}
		<div class="flex items-center gap-1">
			{#each steps as step, i}
				{@const isPast = i < currentIdx}
				{@const isCurrent = (status === 'partial' && step === 'sent') || (i === currentIdx)}
				<div class="flex items-center gap-1">
					<div class="w-2.5 h-2.5 rounded-full {isPast ? 'bg-sage-500' : isCurrent ? 'bg-viking-500 ring-2 ring-viking-200 dark:ring-viking-800' : 'bg-border'}"></div>
					{#if i < steps.length - 1}
						<div class="w-3 h-0.5 {isPast ? 'bg-sage-400' : 'bg-border'}"></div>
					{/if}
				</div>
			{/each}
			<span class="ml-1 text-sm text-ink-muted">
				{statusLabels[status]?.label ?? status}
			</span>
		</div>
	{/if}
{/snippet}


<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: `/${tenantId}/inventory` },
		{ label: 'Órdenes de Compra' }
	]} />

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Órdenes de Compra</h1>
			<p class="text-sm text-ink-muted mt-0.5">Seguimiento de compras y recepciones de inventario</p>
		</div>
		{#if !showNewOrderForm}
			<Button variant="primary" size="md" onclick={() => { showNewOrderForm = true; }}>
				Nueva orden
			</Button>
		{/if}
	</div>

	{#if showNewOrderForm}
		<NewOrderForm
			supplierOptions={data.supplierOptions}
			medicationOptions={data.medicationOptions}
			onCancel={() => { showNewOrderForm = false; }}
		/>
	{/if}

	<!-- Filtros -->
	<div class="bg-surface-elevated rounded-xl border border-border p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
		<div class="flex-1">
			<label for="order-search" class="block text-sm font-medium text-ink-muted mb-1">Buscar orden</label>
			<input
				id="order-search"
				type="search"
				placeholder="N° orden o proveedor..."
				bind:value={search}
				class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
				       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
			/>
		</div>
		<div class="w-full sm:w-48">
			<label for="order-status-filter" class="block text-sm font-medium text-ink-muted mb-1">Estado</label>
			<select
				id="order-status-filter"
				bind:value={statusFilter}
				class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
				       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
			>
				<option value="">Todos</option>
				<option value="draft">Borrador</option>
				<option value="sent">Enviada</option>
				<option value="partial">Parcial</option>
				<option value="received">Recibida</option>
				<option value="cancelled">Cancelada</option>
			</select>
		</div>
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'order_number', header: 'N° Orden',   width: '130px', render: orderNumberCell },
				{ key: 'supplier',     header: 'Proveedor',  render: supplierNameCell },
				{ key: 'order_date',   header: 'Fecha',      width: '110px' },
				{ key: 'expected_date', header: 'Esperada',  width: '110px' },
				{ key: 'order_status', header: 'Estado',     width: '150px', align: 'center', render: statusCell }
			] as DataTableColumn<OrderRow>[]}
			data={filteredOrders() as OrderRow[]}
			rowKey="id"
			rowMenu={orderMenu}
			emptyMessage="No hay órdenes de compra registradas."
		/>

		{#if data.orders.total > data.orders.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-sm text-ink-muted">
					{(data.orders.page - 1) * data.orders.pageSize + 1}–{Math.min(
						data.orders.page * data.orders.pageSize, data.orders.total
					)} de {data.orders.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="md" disabled={data.orders.page <= 1}
						onclick={() => changePage(data.orders.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="md" disabled={!data.orders.hasNext}
						onclick={() => changePage(data.orders.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>

<!-- Modal de detalle de orden -->
{#if orderDetail}
	{@const order = orderDetail}
	{@const s = statusLabels[order.order_status] ?? { label: order.order_status, classes: '' }}
	<Dialog open={true} onClose={() => { orderDetail = null; }} size="lg">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal font-mono">{order.order_number}</p>
			<h2 class="text-base font-semibold text-ink">Detalle de orden de compra</h2>
		</DialogHeader>
		<DialogBody>
			<div class="space-y-5">
				<!-- Info general -->
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
					<div>
						<p class="text-ink-muted">Proveedor</p>
						<p class="font-medium text-ink">{order.supplier?.name ?? '—'}</p>
					</div>
					<div>
						<p class="text-ink-muted">Estado</p>
						<StatusBadge status={order.order_status} />
					</div>
					<div>
						<p class="text-ink-muted">Monto total</p>
						<p class="font-medium text-ink font-mono">{order.total_amount.toFixed(2)}</p>
					</div>
					<div>
						<p class="text-ink-muted">Fecha de orden</p>
						<p class="font-medium text-ink">{order.order_date}</p>
					</div>
					<div>
						<p class="text-ink-muted">Fecha esperada</p>
						<p class="font-medium text-ink">{order.expected_date ?? '—'}</p>
					</div>
				</div>

				{#if order.notes}
					<div class="text-sm">
						<p class="text-ink-muted">Notas</p>
						<p class="text-ink">{order.notes}</p>
					</div>
				{/if}

				<!-- Trazabilidad -->
				<div>
					<h3 class="text-sm font-semibold text-ink mb-2">Historial de la orden</h3>
					<div class="relative pl-4 border-l-2 border-border space-y-3">
						<!-- Creada -->
						<div class="relative">
							<div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-400 border-2 border-surface-elevated"></div>
							<p class="text-sm font-medium text-ink">Creada</p>
							<p class="text-sm text-ink-muted">{formatDateTime(order.created_at)} {order.created_by ? `por ${order.created_by}` : ''}</p>
						</div>
						<!-- Enviada -->
						{#if order.sent_at}
							<div class="relative">
								<div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-iris-500 border-2 border-surface-elevated"></div>
								<p class="text-sm font-medium text-ink">Enviada al proveedor</p>
								<p class="text-sm text-ink-muted">{formatDateTime(order.sent_at)} {order.sent_by ? `por ${order.sent_by}` : ''}</p>
							</div>
						{/if}
						<!-- Recibida -->
						{#if order.received_at}
							<div class="relative">
								<div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-sage-500 border-2 border-surface-elevated"></div>
								<p class="text-sm font-medium text-ink">Recibida</p>
								<p class="text-sm text-ink-muted">{formatDateTime(order.received_at)} {order.received_by ? `por ${order.received_by}` : ''}</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Ítems -->
				<div>
					<h3 class="text-sm font-semibold text-ink mb-2">Medicamentos ({order.items.length})</h3>
					{#if order.items.length === 0}
						<p class="text-sm text-ink-muted py-3 text-center">No hay ítems en esta orden.</p>
					{:else}
						<div class="space-y-2">
							{#each order.items as item}
								{@const pct = item.quantity_ordered > 0 ? Math.round((item.quantity_received / item.quantity_ordered) * 100) : 0}
								<div class="bg-canvas-subtle rounded-lg border border-border p-3">
									<div class="flex items-start justify-between mb-1.5">
										<div>
											<p class="text-sm font-medium text-ink">{item.medication.generic_name}</p>
											<p class="text-sm text-ink-muted">{item.medication.pharmaceutical_form} · {item.medication.unit_measure}</p>
										</div>
										<p class="text-sm font-mono text-ink shrink-0">{item.unit_cost.toFixed(2)} c/u</p>
									</div>
									<div class="flex items-center gap-3">
										<div class="flex-1 bg-border/40 rounded-full h-2 overflow-hidden">
											<div
												class="h-full rounded-full transition-all {pct >= 100 ? 'bg-sage-500' : pct > 0 ? 'bg-honey-500' : 'bg-border'}"
												style="width: {Math.min(pct, 100)}%"
											></div>
										</div>
										<span class="text-sm text-ink-muted shrink-0 tabular-nums">
											{item.quantity_received}/{item.quantity_ordered}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { orderDetail = null; }}>Cerrar</Button>
			{#if order.order_status === 'draft'}
				<form
					method="POST"
					action="?/enviarOrden"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								toastSuccess('Orden enviada', `La orden ${order.order_number} fue enviada al proveedor.`);
							} else if (result.type === 'failure') {
								toastError('Error al enviar', (result.data as { error?: string })?.error ?? 'No se pudo enviar la orden.');
							}
							orderDetail = null;
							await invalidateAll();
						};
					}}
				>
					<input type="hidden" name="order_id" value={order.id} />
					<Button type="submit" variant="soft" size="md">Enviar al proveedor</Button>
				</form>
			{/if}
			{#if order.order_status === 'sent' || order.order_status === 'partial'}
				<Button
					type="button"
					variant="primary"
					size="md"
					onclick={() => { orderDetail = null; orderToReceive = order; }}
				>
					Registrar recepción
				</Button>
			{/if}
		</DialogFooter>
	</Dialog>
{/if}

{#if orderToReceive}
	<ReceiveOrderModal
		order={orderToReceive}
		onClose={() => { orderToReceive = null; }}
	/>
{/if}
