<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import StockIndicator from '$domain/inventory/components/widgets/StockIndicator.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';
	import type { StockItem } from '$domain/inventory/types.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';

	type StockRow = StockItem & Record<string, unknown>;

	interface Props {
		alertItems: StockItem[];
		expiredItems: StockItem[];
		criticalItems: StockItem[];
		lowItems: StockItem[];
	}

	let { alertItems, expiredItems, criticalItems, lowItems }: Props = $props();

	let alertPage = $state(1);
	let alertPageSize = $state(10);
	const alertPages = $derived(Math.ceil(alertItems.length / alertPageSize));
	const alertPaginated = $derived(alertItems.slice((alertPage - 1) * alertPageSize, alertPage * alertPageSize));
	function changeAlertPage(p: number, ps?: number) {
		if (ps && ps !== alertPageSize) { alertPageSize = ps; alertPage = 1; }
		else alertPage = Math.max(1, Math.min(p, alertPages));
	}
	const alertPageSizeOptions = [10, 25, 50];
</script>

{#snippet stockCell(_v: unknown, row: StockRow)}
	<StockIndicator stock={row.total_available as number} />
{/snippet}

{#snippet alertCell(_v: unknown, row: StockRow)}
	<StatusBadge status={row.stock_alert as string} />
{/snippet}

{#snippet expirationCell(_v: unknown, row: StockRow)}
	{#if row.days_to_expiration != null}
		{@const days = row.days_to_expiration as number}
		<span class="text-xs font-mono {days <= 0 ? 'text-red-600 dark:text-red-400 font-semibold' : days <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-ink-muted'}">
			{days <= 0 ? 'Vencido' : `${days}d`}
		</span>
	{:else}
		<span class="text-xs text-ink-subtle">—</span>
	{/if}
{/snippet}

<Card padding="none">
	<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
		<h2 class="text-sm font-semibold text-ink">
			Alertas de inventario
			<span class="text-ink-muted font-normal ml-1">({alertItems.length})</span>
		</h2>
		<span class="text-xs font-semibold {expiredItems.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}">
			{expiredItems.length > 0 ? `${expiredItems.length} vencidos` : ''}
			{expiredItems.length > 0 && criticalItems.length > 0 ? ' · ' : ''}
			{criticalItems.length > 0 ? `${criticalItems.length} críticos` : ''}
			{expiredItems.length === 0 && criticalItems.length === 0 && lowItems.length > 0 ? `${lowItems.length} bajos` : ''}
		</span>
	</div>
	<DataTable
		columns={[
			{ key: 'generic_name',        header: 'Medicamento' },
			{ key: 'pharmaceutical_form', header: 'Forma',       width: '120px' },
			{ key: 'total_available',      header: 'Stock',       width: '90px', align: 'right',  render: stockCell },
			{ key: 'days_to_expiration',   header: 'Vence',       width: '80px', align: 'center', render: expirationCell },
			{ key: 'stock_alert',          header: 'Estado',      width: '100px', align: 'center', render: alertCell }
		] as DataTableColumn<StockRow>[]}
		data={alertPaginated as StockRow[]}
		rowKey="medication_id"
	/>
	{#if alertItems.length > 0}
		<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 border-t border-border/30 bg-canvas-subtle/30">
			<div class="flex items-center gap-3">
				<p class="text-xs text-ink-muted">
					{((alertPage - 1) * alertPageSize) + 1}–{Math.min(alertPage * alertPageSize, alertItems.length)} de {alertItems.length}
				</p>
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-subtle">Mostrar</span>
					<select
						class="text-xs border border-border/60 rounded-md px-1.5 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-viking-500/40"
						value={alertPageSize}
						onchange={(e) => changeAlertPage(1, Number((e.target as HTMLSelectElement).value))}
					>
						{#each alertPageSizeOptions as size}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</div>
			</div>
			{#if alertPages > 1}
				<div class="flex items-center gap-1">
					<button type="button" disabled={alertPage <= 1} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changeAlertPage(alertPage - 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
					</button>
					{#each Array.from({ length: Math.min(alertPages, 7) }, (_, i) => {
						const start = Math.max(1, Math.min(alertPage - 3, alertPages - 6));
						return start + i;
					}) as p}
						<button type="button" class="w-7 h-7 rounded-md text-xs font-medium transition-colors {p === alertPage ? 'bg-viking-600 text-white' : 'text-ink-muted hover:bg-canvas-subtle'}" onclick={() => changeAlertPage(p)}>
							{p}
						</button>
					{/each}
					<button type="button" disabled={alertPage >= alertPages} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changeAlertPage(alertPage + 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
					</button>
				</div>
			{/if}
		</div>
	{/if}
</Card>
