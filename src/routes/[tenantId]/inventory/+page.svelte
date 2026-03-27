<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import ReportCard from '$shared/components/inventory/ReportCard.svelte';
	import StockIndicator from '$shared/components/inventory/StockIndicator.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import type { StockItem } from '$shared/types/inventory.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type StockRow = StockItem & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';

	let { data }: { data: PageData } = $props();

	const tenantId = $derived($page.params.tenantId);

	const criticalItems = $derived(
		data.stockReport.items.filter((i) => i.stock_alert === 'critical' || i.stock_alert === 'expired')
	);
</script>

<svelte:head>
	<title>Inventario — Dashboard</title>
</svelte:head>

{#snippet stockCell(_v: unknown, row: StockRow)}
	<StockIndicator stock={row.total_available as number} />
{/snippet}

{#snippet alertCell(_v: unknown, row: StockRow)}
	{#if row.stock_alert === 'critical'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Crítico</span>
	{:else if row.stock_alert === 'expired'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Vencido</span>
	{:else if row.stock_alert === 'low'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Bajo</span>
	{:else}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">OK</span>
	{/if}
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div>
		<h1 class="text-lg sm:text-xl font-bold text-ink">Inventario Farmacia</h1>
		<p class="text-xs text-ink-muted mt-0.5">Resumen de stock actual</p>
	</div>

	<!-- KPIs -->
	<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
		<ReportCard
			title="Medicamentos registrados"
			value={data.stockReport.total_medications}
			subtitle="en catálogo activo"
		/>
		<ReportCard
			title="Stock crítico"
			value={data.stockReport.critical_count}
			subtitle="por debajo del mínimo"
			alert={data.stockReport.critical_count > 0}
		/>
		<ReportCard
			title="Lotes vencidos"
			value={data.stockReport.expired_count}
			subtitle="requieren retiro"
			alert={data.stockReport.expired_count > 0}
		/>
	</div>

	<!-- Accesos rápidos -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
		{#each [
			{ href: `/${tenantId}/inventory/medications`, label: 'Medicamentos' },
			{ href: `/${tenantId}/inventory/batches`,     label: 'Stock y Lotes' },
			{ href: `/${tenantId}/inventory/dispatches`,  label: 'Despachos' },
			{ href: `/${tenantId}/inventory/reports`,     label: 'Reportes' }
		] as link}
			<a
				href={link.href}
				class="flex items-center justify-center gap-2 p-4 rounded-xl border border-border
				       bg-surface-elevated hover:bg-canvas-subtle/70 transition-colors text-center"
			>
				<span class="text-xs font-medium text-ink">{link.label}</span>
			</a>
		{/each}
	</div>

	<!-- Alertas de stock crítico -->
	{#if criticalItems.length > 0}
		<Card padding="none">
			<div class="px-4 py-3 border-b border-border flex items-center justify-between">
				<h2 class="text-sm font-semibold text-ink">Alertas de inventario</h2>
				<span class="text-xs text-red-600 font-medium">{criticalItems.length} alerta(s)</span>
			</div>
			<DataTable
				columns={[
					{ key: 'generic_name',       header: 'Medicamento' },
					{ key: 'pharmaceutical_form', header: 'Forma',  width: '120px' },
					{ key: 'total_available',     header: 'Stock',  width: '100px', align: 'right',  render: stockCell },
					{ key: 'stock_alert',         header: 'Estado', width: '100px', align: 'center', render: alertCell }
				] satisfies DataTableColumn<StockRow>[]}
				data={criticalItems as StockRow[]}
				rowKey="medication_id"
				emptyMessage="Sin alertas activas."
			/>
		</Card>
	{/if}
</div>
