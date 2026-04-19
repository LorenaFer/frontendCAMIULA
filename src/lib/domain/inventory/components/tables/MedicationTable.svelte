<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Medication } from '$domain/inventory/types.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type MedicationRow = Medication & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';
	import StockIndicator from '$domain/inventory/components/widgets/StockIndicator.svelte';

	interface PaginationData {
		data: Medication[];
		total: number;
		page: number;
		pageSize: number;
		hasNext: boolean;
	}

	interface Props {
		pagination: PaginationData;
		rowMenu: RowMenuItem<MedicationRow>[];
	}

	let { pagination, rowMenu }: Props = $props();

	const pageSizeOptions = [10, 25, 50, 100];

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}
</script>

{#snippet categoryCell(_v: unknown, row: MedicationRow, _index: number)}
	{@const name = (row.category_name as string | null)}
	{#if name}
		<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-viking-50 text-viking-700 dark:bg-viking-900/20 dark:text-viking-400">{name}</span>
	{:else}
		<span class="text-xs text-ink-subtle">—</span>
	{/if}
{/snippet}

{#snippet statusCell(_v: unknown, row: MedicationRow, _index: number)}
	<StatusBadge status={row.medication_status as string} />
{/snippet}

{#snippet stockCell(_v: unknown, row: MedicationRow, _index: number)}
	<StockIndicator stock={row.current_stock as number} />
{/snippet}

{#snippet paginationBar()}
	{#if pagination.total > 0}
		<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 border-t border-border/30 bg-canvas-subtle/30">
			<div class="flex items-center gap-3">
				<p class="text-xs text-ink-muted">
					{((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
				</p>
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-subtle">Mostrar</span>
					<select
						class="text-xs border border-border/60 rounded-md px-1.5 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-viking-500/40"
						value={pagination.pageSize}
						onchange={(e) => changePage(1, Number((e.target as HTMLSelectElement).value))}
					>
						{#each pageSizeOptions as size}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</div>
			</div>
			{#if pagination.total > pagination.pageSize}
				{@const pages = Math.ceil(pagination.total / pagination.pageSize)}
				<div class="flex items-center gap-1">
					<button type="button" disabled={pagination.page <= 1} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changePage(pagination.page - 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
					</button>
					{#each Array.from({ length: Math.min(pages, 7) }, (_, i) => {
						const start = Math.max(1, Math.min(pagination.page - 3, pages - 6));
						return start + i;
					}) as p}
						<button type="button" class="w-7 h-7 rounded-md text-xs font-medium transition-colors {p === pagination.page ? 'bg-viking-600 text-white' : 'text-ink-muted hover:bg-canvas-subtle'}" onclick={() => changePage(p)}>
							{p}
						</button>
					{/each}
					<button type="button" disabled={!pagination.hasNext} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changePage(pagination.page + 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
					</button>
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

<Card padding="none">
	<DataTable
		columns={[
			{ key: 'code',               header: 'Código',       width: '100px' },
			{ key: 'generic_name',       header: 'Nombre genérico' },
			{ key: 'pharmaceutical_form', header: 'Forma',        width: '110px' },
			{ key: 'category_name',      header: 'Categoría',    width: '140px', render: categoryCell },
			{ key: 'medication_status',  header: 'Estado',       width: '110px', align: 'center', render: statusCell },
			{ key: 'current_stock',      header: 'Stock',        width: '100px', align: 'right',  render: stockCell }
		] as DataTableColumn<MedicationRow>[]}
		data={pagination.data as MedicationRow[]}
		rowKey="id"
		rowMenu={rowMenu}
		emptyMessage="No hay medicamentos que coincidan con los filtros."
	/>

	{@render paginationBar()}
</Card>
