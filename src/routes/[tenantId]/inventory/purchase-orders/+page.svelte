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
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import NewOrderForm from './NewOrderForm.svelte';
	import ReceiveOrderModal from './ReceiveOrderModal.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tenantId = $derived($page.params.tenantId);
	let showNewOrderForm = $state(false);
	let orderToReceive = $state<PurchaseOrder | null>(null);
	let orderDetail = $state<PurchaseOrder | null>(null);
	let search = $state('');
	let statusFilter = $state('');

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

	const formError = $derived(form && 'error' in form ? (form as Record<string, unknown>).error as string | undefined : undefined);
	const formSuccess = $derived(form && 'success' in form ? true : false);
	const formAction = $derived(form && 'action' in form ? (form as Record<string, unknown>).action as string | undefined : undefined);
	const isMockError = $derived(typeof formError === 'string' && formError.includes('backend'));
</script>

<svelte:head>
	<title>Órdenes de Compra — Inventario</title>
</svelte:head>

{#snippet orderNumberCell(_v: unknown, row: OrderRow, _index: number)}
	<button
		type="button"
		class="text-sm font-mono text-viking-600 dark:text-viking-400 hover:underline cursor-pointer"
		onclick={() => { orderDetail = row as unknown as PurchaseOrder; }}
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

{#snippet actionsCell(_v: unknown, row: OrderRow, _index: number)}
	<div class="flex gap-2 justify-end">
		{#if row.order_status === 'draft'}
			<form
				method="POST"
				action="?/enviarOrden"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						await invalidateAll();
					};
				}}
			>
				<input type="hidden" name="order_id" value={row.id} />
				<Button type="submit" variant="soft" size="md">
					Enviar al proveedor
				</Button>
			</form>
		{/if}
		{#if row.order_status === 'sent' || row.order_status === 'partial'}
			<Button
				type="button"
				variant="soft"
				size="md"
				onclick={() => { orderToReceive = row as unknown as PurchaseOrder; }}
			>
				Registrar recepción
			</Button>
		{/if}
	</div>
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

	{#if formError}
		<p class="text-sm rounded-lg px-3 py-2 border {isMockError
			? 'text-honey-800 bg-honey-50 dark:bg-honey-900/20 border-honey-200 dark:border-honey-800'
			: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}">
			{formError}
		</p>
	{/if}
	{#if formSuccess}
		<p class="text-sm text-sage-700 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-lg px-3 py-2">
			{#if formAction === 'created'}
				Orden de compra creada correctamente.
			{:else if formAction === 'sent'}
				Orden enviada al proveedor correctamente.
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
				{ key: 'order_status', header: 'Estado',     width: '110px', align: 'center', render: statusCell },
				{ key: '_actions',     header: '',           width: '200px', align: 'right',  render: actionsCell }
			] as DataTableColumn<OrderRow>[]}
			data={filteredOrders() as OrderRow[]}
			rowKey="id"
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
			<h2 class="text-base font-semibold text-ink">Detalle de orden</h2>
		</DialogHeader>
		<DialogBody>
			<div class="space-y-4">
				<!-- Info general -->
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div>
						<p class="text-ink-muted">Proveedor</p>
						<p class="font-medium text-ink">{order.supplier?.name ?? '—'}</p>
					</div>
					<div>
						<p class="text-ink-muted">Estado</p>
						<span class="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium {s.classes}">{s.label}</span>
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

				<!-- Ítems -->
				<div>
					<h3 class="text-sm font-semibold text-ink mb-2">Medicamentos ({order.items.length})</h3>
					<div class="space-y-2">
						{#each order.items as item}
							<div class="bg-canvas-subtle rounded-lg border border-border p-3 flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-ink">{item.medication.generic_name}</p>
									<p class="text-sm text-ink-muted">
										Pedido: {item.quantity_ordered} · Recibido: {item.quantity_received}
									</p>
								</div>
								<div class="text-right">
									<p class="text-sm font-mono text-ink">{item.unit_cost.toFixed(2)}</p>
									<p class="text-sm text-ink-muted">c/u</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				{#if order.total_amount > 0}
					<div class="flex justify-end pt-2 border-t border-border">
						<p class="text-sm font-semibold text-ink">
							Total: <span class="font-mono">{order.total_amount.toFixed(2)}</span>
						</p>
					</div>
				{/if}
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { orderDetail = null; }}>Cerrar</Button>
			{#if order.order_status === 'draft'}
				<form
					method="POST"
					action="?/enviarOrden"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
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
