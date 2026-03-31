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
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import StockIndicator from '$shared/components/inventory/StockIndicator.svelte';
	import StatusBadge from '$shared/components/inventory/StatusBadge.svelte';
	import BatchTag from '$shared/components/inventory/BatchTag.svelte';

	let { data }: { data: PageData } = $props();
	const tenantId = $derived($page.params.tenantId);

	let search = $state('');

	const filteredStockItems = $derived(
		search.trim()
			? (data.stockItems ?? []).filter((item) =>
					item.generic_name.toLowerCase().includes(search.trim().toLowerCase()) ||
					item.code?.toLowerCase().includes(search.trim().toLowerCase())
				)
			: (data.stockItems ?? [])
	);

	const filteredBatches = $derived(
		search.trim()
			? (data.batches?.data ?? []).filter((b) => {
					const med = b.medication as { generic_name?: string } | undefined;
					const name = med?.generic_name ?? '';
					return name.toLowerCase().includes(search.trim().toLowerCase()) ||
						(b.lot_number as string)?.toLowerCase().includes(search.trim().toLowerCase()) ||
						(b.supplier_name as string)?.toLowerCase().includes(search.trim().toLowerCase());
				})
			: (data.batches?.data ?? [])
	);

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
	<StatusBadge status={row.stock_alert as string} />
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: `/${tenantId}/inventory` },
		{ label: 'Stock y Lotes' }
	]} />

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Stock y Lotes</h1>
			<p class="text-sm text-ink-muted mt-0.5">Control de inventario por lote y vencimiento</p>
		</div>
		<!-- Selector de vista -->
		<div class="flex gap-1 p-1 bg-canvas-subtle rounded-lg border border-border">
			<button
				onclick={() => switchView('stock')}
				class="px-4 py-2.5 text-sm font-medium rounded-md transition-colors
				       {data.view === 'stock'
				         ? 'bg-surface-elevated text-ink shadow-[var(--shadow-1)] border border-border/60'
				         : 'text-ink-muted hover:text-ink'}"
			>
				Stock consolidado
			</button>
			<button
				onclick={() => switchView('batches')}
				class="px-4 py-2.5 text-sm font-medium rounded-md transition-colors
				       {data.view === 'batches'
				         ? 'bg-surface-elevated text-ink shadow-[var(--shadow-1)] border border-border/60'
				         : 'text-ink-muted hover:text-ink'}"
			>
				Por lote
			</button>
		</div>
	</div>

	<!-- Buscador -->
	<div class="bg-surface-elevated rounded-xl border border-border p-3 sm:p-4">
		<label for="batch-search" class="block text-sm font-medium text-ink-muted mb-1">Buscar medicamento</label>
		<input
			id="batch-search"
			type="search"
			placeholder="Nombre, código o lote..."
			bind:value={search}
			class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
			       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
		/>
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
					{ key: 'nearest_expiration', header: 'Próximo vencimiento', width: '130px' },
					{ key: 'stock_alert',        header: 'Alerta',      width: '100px', align: 'center', render: alertCell }
				] as DataTableColumn<StockRow>[]}
				data={filteredStockItems as StockRow[]}
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
				data={filteredBatches as BatchRow[]}
				rowKey="id"
				emptyMessage="No hay lotes registrados."
			/>

			{@const batches = data.batches}
			{#if batches.total > batches.pageSize}
				<div class="flex items-center justify-between px-4 py-3 border-t border-border">
					<span class="text-sm text-ink-muted">
						{(batches.page - 1) * batches.pageSize + 1}–{Math.min(
							batches.page * batches.pageSize, batches.total
						)} de {batches.total}
					</span>
					<div class="flex gap-2">
						<Button variant="ghost" size="md" disabled={batches.page <= 1}
							onclick={() => changePage(batches.page - 1)}>Anterior</Button>
						<Button variant="ghost" size="md" disabled={!batches.hasNext}
							onclick={() => changePage(batches.page + 1)}>Siguiente</Button>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</div>
