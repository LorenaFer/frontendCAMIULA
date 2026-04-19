<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { StockItem, Batch } from '$domain/inventory/types.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type StockRow = StockItem & Record<string, unknown>;
	type BatchRow = Batch & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import { TabGroup } from '$shared/components/tabs';
	import PaginationBar from '$shared/components/table/PaginationBar.svelte';
	import StockIndicator from '$domain/inventory/components/widgets/StockIndicator.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';
	import BatchTag from '$domain/inventory/components/widgets/BatchTag.svelte';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let activeView = $state(data.view ?? 'stock');

	// Sync view selection to URL when user switches tabs
	$effect(() => {
		if (activeView !== data.view) {
			const qs = new URLSearchParams($page.url.searchParams);
			qs.set('view', activeView);
			qs.delete('page');
			goto(`?${qs}`, { replaceState: true });
		}
	});

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

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
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
		{ label: 'Farmacia', href: '/inventory' },
		{ label: 'Stock y Lotes' }
	]} />

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Stock y Lotes</h1>
			<p class="text-sm text-ink-muted mt-0.5">Control de inventario por lote y vencimiento</p>
		</div>
		<!-- Selector de vista -->
		<TabGroup
			tabs={[
				{ id: 'stock', label: 'Stock consolidado' },
				{ id: 'batches', label: 'Por lote' }
			]}
			bind:active={activeView}
			variant="pill"
		/>
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

			<PaginationBar
				page={data.batches.page}
				total={data.batches.total}
				pageSize={data.batches.pageSize}
				pageSizeOptions={[10, 25, 50, 100]}
				onPageChange={(p) => changePage(p)}
				onPageSizeChange={(ps) => changePage(1, ps)}
			/>
		</Card>
	{/if}
</div>
