<script lang="ts">
	import type { PageData } from './$types';
	import StockIndicator from '$domain/inventory/components/StockIndicator.svelte';
	import StatusBadge from '$domain/inventory/components/StatusBadge.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import type { StockItem } from '$domain/inventory/types.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type StockRow = StockItem & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let showBI = $state(true);

	const stock = $derived(data.stockReport);
	const allItems = $derived(stock.items);
	const expiration = $derived(data.expirationReport);
	const consumption = $derived(data.consumptionReport);
	const dispatches = $derived(data.recentDispatches);

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

	// Paginación client-side para alertas
	let alertPage = $state(1);
	let alertPageSize = $state(10);
	const alertPages = $derived(Math.ceil(alertItems.length / alertPageSize));
	const alertPaginated = $derived(alertItems.slice((alertPage - 1) * alertPageSize, alertPage * alertPageSize));
	function changeAlertPage(p: number, ps?: number) {
		if (ps && ps !== alertPageSize) { alertPageSize = ps; alertPage = 1; }
		else alertPage = Math.max(1, Math.min(p, alertPages));
	}
	const alertPageSizeOptions = [10, 25, 50];

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

	// Recent dispatches count
	const dispatchTotal = $derived(dispatches.total);
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
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
		{#each [
			{ href: '/inventory/medications', label: 'Medicamentos', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5' },
			{ href: '/inventory/batches',     label: 'Stock y Lotes', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
			{ href: '/inventory/dispatches',  label: 'Despachos', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
			{ href: '/inventory/suppliers',   label: 'Proveedores', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z' }
		] as link}
			<a
				href={link.href}
				class="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/60 bg-surface-elevated hover:bg-canvas-subtle/70 transition-colors"
			>
				<svg class="w-4.5 h-4.5 text-viking-600 dark:text-viking-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d={link.icon} />
				</svg>
				<span class="text-sm font-medium text-ink">{link.label}</span>
			</a>
		{/each}
	</div>

	<!-- ═══ BI SECTION ═══ -->
	{#if showBI}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">

			<!-- Salud del inventario (donut) -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Salud del Inventario</h3>
				{#if allItems.length > 0}
					<div class="flex items-center gap-6">
						<div class="relative w-28 h-28 shrink-0">
							<svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
								{#each alertDistribution as seg, i}
									{@const totalCount = alertDistribution.reduce((s, a) => s + a.count, 0)}
									{@const pct = totalCount > 0 ? (seg.count / totalCount) * 100 : 0}
									{@const offset = alertDistribution.slice(0, i).reduce((s, a) => s + (totalCount > 0 ? (a.count / totalCount) * 100 : 0), 0) + i}
									<circle
										r="15.91549" cx="18" cy="18" fill="none"
										stroke={seg.color} stroke-width="3.5"
										stroke-dasharray="{Math.max(pct - 1, 0.5)} {100 - Math.max(pct - 1, 0.5)}"
										stroke-dashoffset={-offset} stroke-linecap="round"
									/>
								{/each}
							</svg>
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="text-xl font-bold text-ink tabular-nums">{allItems.length}</span>
								<span class="text-[10px] text-ink-muted">productos</span>
							</div>
						</div>
						<div class="flex-1 space-y-2">
							{#each alertDistribution as seg}
								{@const pct = allItems.length > 0 ? Math.round((seg.count / allItems.length) * 100) : 0}
								<div class="flex items-center gap-2">
									<span class="w-2.5 h-2.5 rounded-full shrink-0 {seg.dot}"></span>
									<span class="text-xs text-ink flex-1">{seg.label}</span>
									<span class="text-xs font-mono font-semibold text-ink tabular-nums">{seg.count}</span>
									<span class="text-[10px] text-ink-muted w-8 text-right tabular-nums">{pct}%</span>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-xs text-ink-subtle text-center py-6">Sin datos de stock disponibles</p>
				{/if}
			</Card>

			<!-- Distribución por forma farmacéutica -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Por Forma Farmacéutica</h3>
				{#if byForm.length > 0}
					<div class="space-y-2">
						{#each byForm.slice(0, 8) as item}
							{@const widthPct = (item.count / maxFormCount) * 100}
							<div class="flex items-center gap-2">
								<span class="text-xs text-ink w-24 truncate shrink-0">{item.form}</span>
								<div class="flex-1 h-5 bg-canvas-subtle rounded overflow-hidden relative">
									<div class="h-full bg-viking-300 dark:bg-viking-700 rounded" style:width="{widthPct}%"></div>
									<span class="absolute inset-y-0 left-2 flex items-center text-[10px] font-mono font-semibold text-ink">{item.count}</span>
								</div>
								<span class="text-[10px] text-ink-muted tabular-nums w-16 text-right">{item.stock.toLocaleString()} uds</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-xs text-ink-subtle text-center py-6">Sin datos</p>
				{/if}
			</Card>

			<!-- Top consumo del mes -->
			<Card padding="lg">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Top Consumo del Mes</h3>
					{#if consumption.period}
						<Badge variant="info" style="soft" size="xs">{consumption.period}</Badge>
					{/if}
				</div>
				{#if topConsumed.length > 0}
					<div class="space-y-2.5">
						{#each topConsumed as item, i}
							{@const widthPct = (item.total_dispatched / maxConsumed) * 100}
							<div>
								<div class="flex items-center justify-between mb-0.5">
									<span class="text-xs text-ink font-medium truncate flex-1">
										<span class="inline-flex w-4 h-4 rounded-full bg-canvas-subtle items-center justify-center text-[9px] font-bold text-ink-muted mr-1.5">{i + 1}</span>
										{item.generic_name}
									</span>
									<span class="text-xs font-mono text-ink-muted ml-2 shrink-0">{item.total_dispatched} uds · {item.patient_count} pac.</span>
								</div>
								<div class="h-1.5 bg-canvas-subtle rounded-full overflow-hidden">
									<div class="h-full bg-iris-400 dark:bg-iris-500 rounded-full" style:width="{widthPct}%"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-xs text-ink-subtle text-center py-6">Sin despachos este mes</p>
				{/if}
			</Card>

			<!-- Vencimientos próximos -->
			<Card padding="lg">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Vencimientos Próximos</h3>
					{#if expiringBatches > 0}
						<span class="text-xs font-semibold text-amber-600 dark:text-amber-400">{expiringBatches} lotes</span>
					{/if}
				</div>
				{#if expiration.batches.length > 0}
					<div class="space-y-1.5">
						{#each expiration.batches.slice(0, 6) as batch}
							{@const daysLeft = Math.ceil((new Date(batch.expiration_date).getTime() - Date.now()) / 86400000)}
							<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg {daysLeft <= 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : daysLeft <= 30 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-canvas-subtle border border-border/40'}">
								<span class="text-xs text-ink flex-1 truncate">{batch.medication?.generic_name ?? batch.lot_number}</span>
								<span class="text-[10px] font-mono text-ink-muted">Lote {batch.lot_number}</span>
								<span class="text-xs font-mono font-semibold {daysLeft <= 0 ? 'text-red-600 dark:text-red-400' : daysLeft <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-ink-muted'}">
									{daysLeft <= 0 ? 'Vencido' : `${daysLeft}d`}
								</span>
							</div>
						{/each}
						{#if expiration.batches.length > 6}
							<a href="/inventory/batches?alert=expiring" class="block text-center text-xs text-viking-600 dark:text-viking-400 hover:underline pt-1">
								Ver todos ({expiration.batches.length})
							</a>
						{/if}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6">
						<svg class="w-8 h-8 text-emerald-400 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-xs text-ink-subtle">Sin lotes próximos a vencer</p>
					</div>
				{/if}
			</Card>
		</div>
	{/if}

	<!-- Alertas de stock (tabla paginada) -->
	{#if alertItems.length > 0}
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
	{/if}
</div>
