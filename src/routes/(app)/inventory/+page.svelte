<script lang="ts">
	import type { PageData } from './$types';
	import StockIndicator from '$domain/inventory/components/widgets/StockIndicator.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import type { StockItem } from '$domain/inventory/types.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type StockRow = StockItem & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import InventoryQuickLinks from '$domain/inventory/components/widgets/InventoryQuickLinks.svelte';
	import InventoryDashboard from '$domain/inventory/components/widgets/InventoryDashboard.svelte';
	import InventoryAlertsTable from '$domain/inventory/components/widgets/InventoryAlertsTable.svelte';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let showBI = $state(true);

	const stock = $derived(data.stockReport);
	const allItems = $derived(stock.items);
	const expiration = $derived(data.expirationReport);
	const consumption = $derived(data.consumptionReport);

	// ─── Búsqueda ─────────────────────────────────────────────
	const searchResults = $derived(
		search.trim()
			? allItems.filter((i) =>
					i.generic_name.toLowerCase().includes(search.trim().toLowerCase()) ||
					i.code?.toLowerCase().includes(search.trim().toLowerCase())
				)
			: []
	);

	// ─── Métricas BI ──────────────────────────────────────────
	const criticalItems = $derived(allItems.filter(i => i.stock_alert === 'critical'));
	const expiredItems = $derived(allItems.filter(i => i.stock_alert === 'expired'));
	const lowItems = $derived(allItems.filter(i => i.stock_alert === 'low'));
	const normalItems = $derived(allItems.filter(i => i.stock_alert === 'ok' || !i.stock_alert));
	const alertItems = $derived([...expiredItems, ...criticalItems, ...lowItems]);

	// Stock por forma farmacéutica
	const byForm = $derived.by(() => {
		const map = new Map<string, { count: number; stock: number }>();
		for (const i of allItems) {
			const form = i.pharmaceutical_form || 'Otro';
			const existing = map.get(form) ?? { count: 0, stock: 0 };
			existing.count++;
			existing.stock += i.total_available;
			map.set(form, existing);
		}
		return [...map.entries()]
			.map(([form, data]) => ({ form, ...data }))
			.sort((a, b) => b.count - a.count);
	});
	const maxFormCount = $derived(byForm.length > 0 ? byForm[0].count : 1);

	// Próximos a vencer (lotes con vencimiento dentro de 90 días)
	const expiringBatches = $derived(expiration.batches.length);

	// Consumo top del mes
	const topConsumed = $derived(
		[...consumption.items].sort((a, b) => b.total_dispatched - a.total_dispatched).slice(0, 5)
	);
	const maxConsumed = $derived(topConsumed.length > 0 ? topConsumed[0].total_dispatched : 1);

	// Distribución de alertas para donut
	const alertDistribution = $derived([
		{ label: 'Normal', count: normalItems.length, color: '#10b981', dot: 'bg-emerald-500' },
		{ label: 'Bajo', count: lowItems.length, color: '#fbbf24', dot: 'bg-amber-400' },
		{ label: 'Crítico', count: criticalItems.length, color: '#f87171', dot: 'bg-red-400' },
		{ label: 'Vencido', count: expiredItems.length, color: '#94a3b8', dot: 'bg-slate-400' }
	].filter(a => a.count > 0));

	// Total units
	const totalUnits = $derived(allItems.reduce((sum, i) => sum + i.total_available, 0));
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

<svelte:head>
	<title>Inventario — Dashboard</title>
</svelte:head>

<div class="space-y-4 animate-fade-in-up">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Inventario Farmacia</h1>
			<p class="text-xs text-ink-muted mt-0.5">Resumen de stock y movimientos</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors {showBI ? 'bg-viking-50 dark:bg-viking-900/20 border-viking-200 dark:border-viking-800 text-viking-700 dark:text-viking-300' : 'border-border/60 text-ink-muted hover:text-ink hover:bg-canvas-subtle'}"
				onclick={() => { showBI = !showBI; }}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
				</svg>
				Analítica
			</button>
		</div>
	</div>

	<!-- Buscador rápido -->
	<div class="bg-surface-elevated rounded-xl border border-border/60 p-3 sm:p-4">
		<Input
			label="Buscar medicamento"
			placeholder="Nombre o código..."
			bind:value={search}
			inputSize="lg"
		/>
	</div>

	<!-- Resultados de búsqueda -->
	{#if search.trim()}
		<Card padding="none">
			<div class="px-4 py-3 border-b border-border/60">
				<h2 class="text-sm font-semibold text-ink">
					{searchResults.length > 0 ? `${searchResults.length} resultado(s)` : 'Sin resultados'}
					<span class="text-ink-muted font-normal ml-1">para "{search.trim()}"</span>
				</h2>
			</div>
			{#if searchResults.length > 0}
				<DataTable
					columns={[
						{ key: 'generic_name',        header: 'Medicamento' },
						{ key: 'pharmaceutical_form', header: 'Forma',       width: '120px' },
						{ key: 'total_available',      header: 'Stock',       width: '90px', align: 'right',  render: stockCell },
						{ key: 'days_to_expiration',   header: 'Vence',       width: '80px', align: 'center', render: expirationCell },
						{ key: 'stock_alert',          header: 'Estado',      width: '100px', align: 'center', render: alertCell }
					] as DataTableColumn<StockRow>[]}
					data={searchResults as StockRow[]}
					rowKey="medication_id"
				/>
			{/if}
		</Card>
	{/if}

	<!-- KPIs -->
	<div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
		<StatCard title="Medicamentos" value={stock.total_medications} subtitle="en catálogo" />
		<StatCard title="Unidades" value={totalUnits.toLocaleString()} subtitle="stock total" accent="viking" />
		<StatCard
			title="Stock crítico"
			value={stock.critical_count}
			subtitle="bajo mínimo"
			accent={stock.critical_count > 0 ? 'honey' : undefined}
		/>
		<StatCard
			title="Lotes por vencer"
			value={expiringBatches}
			subtitle="próx. 90 días"
			accent={expiringBatches > 0 ? 'honey' : undefined}
		/>
		<StatCard
			title="Vencidos"
			value={stock.expired_count}
			subtitle="requieren retiro"
			accent={stock.expired_count > 0 ? undefined : undefined}
			trend={stock.expired_count > 0 ? { value: 'Acción requerida', direction: 'down' } : undefined}
		/>
	</div>

	<!-- Accesos rápidos -->
	<InventoryQuickLinks />

	<!-- ═══ BI SECTION ═══ -->
	{#if showBI}
		<InventoryDashboard
			{allItems}
			{alertDistribution}
			formStats={{ items: byForm, max: maxFormCount }}
			consumption={{ items: topConsumed, max: maxConsumed, period: consumption.period }}
			expirationStats={{ report: expiration, count: expiringBatches }}
		/>
	{/if}

	<!-- Alertas de stock (tabla paginada) -->
	{#if alertItems.length > 0}
		<InventoryAlertsTable
			{alertItems}
			{expiredItems}
			{criticalItems}
			{lowItems}
		/>
	{/if}
</div>
