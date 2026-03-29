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

{#snippet stockCell(_v: unknown, row: StockRow, _index: number)}
	<StockIndicator stock={row.total_available as number} />
{/snippet}

{#snippet medicationNameCell(_v: unknown, row: BatchRow, _index: number)}
	<span class="text-sm text-ink">{(row.medication as { generic_name: string })?.generic_name ?? '—'}</span>
{/snippet}

{#snippet batchTagCell(_v: unknown, row: BatchRow, _index: number)}
	<BatchTag
		lot_number={row.lot_number as string}
		status={row.batch_status as Batch['batch_status']}
		expiration_date={row.expiration_date as string}
	/>
{/snippet}

{#snippet alertCell(_v: unknown, row: StockRow, _index: number)}
	{#if row.stock_alert === 'critical'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Crítico</span>
	{:else if row.stock_alert === 'low'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300">Bajo</span>
	{:else if row.stock_alert === 'expired'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Vencido</span>
	{:else}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sage-100 text-sage-800 dark:bg-sage-900/30 dark:text-sage-300">OK</span>
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
				         ? 'bg-surface-elevated text-ink shadow-[var(--shadow-1)] border border-border/60'
				         : 'text-ink-muted hover:text-ink'}"
			>
				Stock consolidado
			</button>
			<button
				onclick={() => switchView('batches')}
				class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors
				       {data.view === 'batches'
				         ? 'bg-surface-elevated text-ink shadow-[var(--shadow-1)] border border-border/60'
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
				] as DataTableColumn<StockRow>[]}
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
					{ key: 'fk_medication_id',   header: 'Medicamento', render: medicationNameCell },
					{ key: 'quantity_available', header: 'Disponible',  width: '100px', align: 'right' },
					{ key: 'quantity_received',  header: 'Recibido',    width: '100px', align: 'right' },
					{ key: 'supplier_name',      header: 'Proveedor',   width: '180px' },
					{ key: 'received_at',        header: 'Recibido el', width: '120px' }
				] as DataTableColumn<BatchRow>[]}
				data={data.batches.data as BatchRow[]}
				rowKey="id"
				emptyMessage="No hay lotes registrados."
			/>

			{@const batches = data.batches}
			{#if batches.total > batches.pageSize}
				<div class="flex items-center justify-between px-4 py-3 border-t border-border">
					<span class="text-xs text-ink-muted">
						{(batches.page - 1) * batches.pageSize + 1}–{Math.min(
							batches.page * batches.pageSize, batches.total
						)} de {batches.total}
					</span>
					<div class="flex gap-2">
						<Button variant="ghost" size="sm" disabled={batches.page <= 1}
							onclick={() => changePage(batches.page - 1)}>Anterior</Button>
						<Button variant="ghost" size="sm" disabled={!batches.hasNext}
							onclick={() => changePage(batches.page + 1)}>Siguiente</Button>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</div>
