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

	let search = $state('');

	const allItems = $derived(data.stockReport.items);

	const searchResults = $derived(
		search.trim()
			? allItems.filter((i) =>
					i.generic_name.toLowerCase().includes(search.trim().toLowerCase()) ||
					i.code?.toLowerCase().includes(search.trim().toLowerCase())
				)
			: []
	);

	const criticalItems = $derived(
		allItems.filter((i) => i.stock_alert === 'critical' || i.stock_alert === 'expired')
	);
</script>

<svelte:head>
	<title>Inventario — Dashboard</title>
</svelte:head>

{#snippet stockCell(_v: unknown, row: StockRow, _index: number)}
	<StockIndicator stock={row.total_available as number} />
{/snippet}

{#snippet alertCell(_v: unknown, row: StockRow, _index: number)}
	{#if row.stock_alert === 'critical'}
		<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
			<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
			Crítico
		</span>
	{:else if row.stock_alert === 'expired'}
		<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
			<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" /></svg>
			Vencido
		</span>
	{:else if row.stock_alert === 'low'}
		<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300">
			<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
			Bajo
		</span>
	{:else}
		<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium bg-sage-100 text-sage-800 dark:bg-sage-900/30 dark:text-sage-300">
			<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" /></svg>
			OK
		</span>
	{/if}
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div>
		<h1 class="text-lg sm:text-xl font-bold text-ink">Inventario Farmacia</h1>
		<p class="text-sm text-ink-muted mt-0.5">Resumen de stock actual</p>
	</div>

	<!-- Buscador rápido -->
	<div class="bg-surface-elevated rounded-xl border border-border p-3 sm:p-4">
		<label for="dashboard-search" class="block text-sm font-medium text-ink-muted mb-1">Buscar medicamento</label>
		<input
			id="dashboard-search"
			type="search"
			placeholder="Nombre o código del medicamento..."
			bind:value={search}
			class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
			       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
		/>
	</div>

	<!-- Resultados de búsqueda -->
	{#if search.trim() && searchResults.length > 0}
		<Card padding="none">
			<div class="px-4 py-3 border-b border-border">
				<h2 class="text-sm font-semibold text-ink">{searchResults.length} resultado(s) para "{search.trim()}"</h2>
			</div>
			<DataTable
				columns={[
					{ key: 'generic_name',       header: 'Medicamento' },
					{ key: 'pharmaceutical_form', header: 'Forma',  width: '120px' },
					{ key: 'total_available',     header: 'Stock',  width: '100px', align: 'right',  render: stockCell },
					{ key: 'stock_alert',         header: 'Estado', width: '100px', align: 'center', render: alertCell }
				] as DataTableColumn<StockRow>[]}
				data={searchResults as StockRow[]}
				rowKey="medication_id"
				emptyMessage="Sin resultados."
			/>
		</Card>
	{:else if search.trim() && searchResults.length === 0}
		<div class="text-center py-6 text-sm text-ink-muted">
			No se encontraron medicamentos para "{search.trim()}"
		</div>
	{/if}

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
			{ href: `/${tenantId}/inventory/suppliers`,   label: 'Proveedores' }
		] as link}
			<a
				href={link.href}
				class="flex items-center justify-center gap-2 p-5 rounded-xl border border-border
				       bg-surface-elevated hover:bg-canvas-subtle/70 transition-colors text-center min-h-[56px]"
			>
				<span class="text-sm font-medium text-ink">{link.label}</span>
			</a>
		{/each}
	</div>

	<!-- Alertas de stock crítico -->
	{#if criticalItems.length > 0}
		<Card padding="none">
			<div class="px-4 py-3 border-b border-border flex items-center justify-between">
				<h2 class="text-sm font-semibold text-ink">Alertas de inventario</h2>
				<span class="text-sm text-red-600 font-medium">{criticalItems.length} alerta(s)</span>
			</div>
			<DataTable
				columns={[
					{ key: 'generic_name',       header: 'Medicamento' },
					{ key: 'pharmaceutical_form', header: 'Forma',  width: '120px' },
					{ key: 'total_available',     header: 'Stock',  width: '100px', align: 'right',  render: stockCell },
					{ key: 'stock_alert',         header: 'Estado', width: '100px', align: 'center', render: alertCell }
				] as DataTableColumn<StockRow>[]}
				data={criticalItems as StockRow[]}
				rowKey="medication_id"
				emptyMessage="Sin alertas activas."
			/>
		</Card>
	{/if}
</div>
