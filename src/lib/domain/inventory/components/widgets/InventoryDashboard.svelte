<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import type { StockItem, ConsumptionItem, ExpirationReport } from '$domain/inventory/types.js';

	interface AlertSegment {
		label: string;
		count: number;
		color: string;
		dot: string;
	}

	interface FormBucket {
		form: string;
		count: number;
		stock: number;
	}

	export interface FormDistributionStats {
		items: FormBucket[];
		max: number;
	}

	export interface ConsumptionStats {
		items: ConsumptionItem[];
		max: number;
		period: string;
	}

	export interface ExpirationStats {
		report: ExpirationReport;
		count: number;
	}

	interface Props {
		allItems: StockItem[];
		alertDistribution: AlertSegment[];
		formStats: FormDistributionStats;
		consumption: ConsumptionStats;
		expirationStats: ExpirationStats;
	}

	let {
		allItems,
		alertDistribution,
		formStats,
		consumption,
		expirationStats
	}: Props = $props();
</script>

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
		{#if formStats.items.length > 0}
			<div class="space-y-2">
				{#each formStats.items.slice(0, 8) as item}
					{@const widthPct = (item.count / formStats.max) * 100}
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
		{#if consumption.items.length > 0}
			<div class="space-y-2.5">
				{#each consumption.items as item, i}
					{@const widthPct = (item.total_dispatched / consumption.max) * 100}
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
			{#if expirationStats.count > 0}
				<span class="text-xs font-semibold text-amber-600 dark:text-amber-400">{expirationStats.count} lotes</span>
			{/if}
		</div>
		{#if expirationStats.report.batches.length > 0}
			<div class="space-y-1.5">
				{#each expirationStats.report.batches.slice(0, 6) as batch}
					{@const daysLeft = Math.ceil((new Date(batch.expiration_date).getTime() - Date.now()) / 86400000)}
					<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg {daysLeft <= 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : daysLeft <= 30 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-canvas-subtle border border-border/40'}">
						<span class="text-xs text-ink flex-1 truncate">{batch.medication?.generic_name ?? batch.lot_number}</span>
						<span class="text-[10px] font-mono text-ink-muted">Lote {batch.lot_number}</span>
						<span class="text-xs font-mono font-semibold {daysLeft <= 0 ? 'text-red-600 dark:text-red-400' : daysLeft <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-ink-muted'}">
							{daysLeft <= 0 ? 'Vencido' : `${daysLeft}d`}
						</span>
					</div>
				{/each}
				{#if expirationStats.report.batches.length > 6}
					<a href="/inventory/batches?alert=expiring" class="block text-center text-xs text-viking-600 dark:text-viking-400 hover:underline pt-1">
						Ver todos ({expirationStats.report.batches.length})
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
