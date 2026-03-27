<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { StockItem, Batch } from '$shared/types/inventory.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type StockRow = StockItem & Record<string, unknown>;
	type BatchRow = Batch & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import StockIndicator from '$shared/components/inventory/StockIndicator.svelte';
	import BatchTag from '$shared/components/inventory/BatchTag.svelte';

	let { data }: { data: PageData } = $props();

	function switchView(v: 'stock' | 'batches') {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('view', v);
		qs.delete('page');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Stock y Lotes — Inventario</title>
</svelte:head>

{#snippet stockCell(_v: unknown, row: StockRow)}
	<StockIndicator stock={row.total_available as number} />
{/snippet}

{#snippet batchTagCell(_v: unknown, row: BatchRow)}
	<BatchTag
		lot_number={row.lot_number as string}
		status={row.batch_status as Batch['batch_status']}
		expiration_date={row.expiration_date as string}
	/>
{/snippet}

{#snippet alertCell(_v: unknown, row: StockRow)}
	{#if row.stock_alert === 'critical'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Crítico</span>
	{:else if row.stock_alert === 'low'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Bajo</span>
	{:else if row.stock_alert === 'expired'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">Vencido</span>
	{:else}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">OK</span>
	{/if}
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Stock y Lotes</h1>
			<p class="text-xs text-ink-muted mt-0.5">Control de inventario por lote y vencimiento</p>
		</div>
		<!-- Selector de vista -->
		<div class="flex gap-1 p-1 bg-canvas-subtle rounded-lg border border-border">
			<button
				onclick={() => switchView('stock')}
				class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors
				       {data.view === 'stock'
				         ? 'bg-surface-elevated text-ink shadow-sm border border-border/60'
				         : 'text-ink-muted hover:text-ink'}"
			>
				Stock consolidado
			</button>
			<button
				onclick={() => switchView('batches')}
				class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors
				       {data.view === 'batches'
				         ? 'bg-surface-elevated text-ink shadow-sm border border-border/60'
				         : 'text-ink-muted hover:text-ink'}"
			>
				Por lote
			</button>
		</div>
	</div>

	<!-- Vista: stock consolidado -->
	{#if data.view === 'stock' && data.stockItems}
		<Card padding="none">
			<DataTable
				columns={[
					{ key: 'code',               header: 'Código',      width: '100px' },
					{ key: 'generic_name',       header: 'Medicamento' },
					{ key: 'pharmaceutical_form', header: 'Forma',       width: '110px' },
					{ key: 'total_available',    header: 'Stock',       width: '100px', align: 'right',  render: stockCell },
					{ key: 'batch_count',        header: 'Lotes',       width: '70px',  align: 'center' },
					{ key: 'nearest_expiration', header: 'Próx. vence', width: '130px' },
					{ key: 'stock_alert',        header: 'Alerta',      width: '100px', align: 'center', render: alertCell }
				] satisfies DataTableColumn<StockRow>[]}
				data={data.stockItems as StockRow[]}
				rowKey="medication_id"
				emptyMessage="No hay datos de stock disponibles."
			/>
		</Card>
	{/if}

	<!-- Vista: por lote -->
	{#if data.view === 'batches' && data.batches}
		<Card padding="none">
			<DataTable
				columns={[
					{ key: 'lot_number',         header: 'Lote',        width: '180px', render: batchTagCell },
					{ key: 'fk_medication_id',   header: 'Medicamento', render: (_v, row) => undefined },
					{ key: 'quantity_available', header: 'Disponible',  width: '100px', align: 'right' },
					{ key: 'quantity_received',  header: 'Recibido',    width: '100px', align: 'right' },
					{ key: 'supplier_name',      header: 'Proveedor',   width: '180px' },
					{ key: 'received_at',        header: 'Recibido el', width: '120px' }
				] satisfies DataTableColumn<BatchRow>[]}
				data={data.batches.data as BatchRow[]}
				rowKey="id"
				emptyMessage="No hay lotes registrados."
			/>

			{#if data.batches.total > data.batches.pageSize}
				<div class="flex items-center justify-between px-4 py-3 border-t border-border">
					<span class="text-xs text-ink-muted">
						{(data.batches.page - 1) * data.batches.pageSize + 1}–{Math.min(
							data.batches.page * data.batches.pageSize, data.batches.total
						)} de {data.batches.total}
					</span>
					<div class="flex gap-2">
						<Button variant="ghost" size="sm" disabled={data.batches.page <= 1}
							onclick={() => changePage(data.batches.page - 1)}>Anterior</Button>
						<Button variant="ghost" size="sm" disabled={!data.batches.hasNext}
							onclick={() => changePage(data.batches.page + 1)}>Siguiente</Button>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</div>
