<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { InventoryMovement, MovementType } from '$domain/inventory/types.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type MovementRow = InventoryMovement & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import PaginationBar from '$shared/components/table/PaginationBar.svelte';

	let { data }: { data: PageData } = $props();

	// ─── Filtros ────────────────────────────────────
	let medicationFilter = $state(data.filters.medication_id ?? '');
	let typeFilter = $state(data.filters.movement_type ?? '');
	let dateFrom = $state(data.filters.date_from ?? '');
	let dateTo = $state(data.filters.date_to ?? '');

	function applyFilters() {
		const qs = new URLSearchParams();
		if (medicationFilter) qs.set('medication_id', medicationFilter);
		if (typeFilter) qs.set('movement_type', typeFilter);
		if (dateFrom) qs.set('date_from', dateFrom);
		if (dateTo) qs.set('date_to', dateTo);
		qs.set('page', '1');
		qs.set('page_size', String(data.movements.pageSize));
		goto(`?${qs}`, { replaceState: true });
	}

	function clearFilters() {
		medicationFilter = '';
		typeFilter = '';
		dateFrom = '';
		dateTo = '';
		goto('?', { replaceState: true });
	}

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	// ─── Helpers ────────────────────────────────────
	const typeLabels: Record<MovementType, string> = {
		entry: 'Entrada',
		exit: 'Salida',
		adjustment: 'Ajuste',
		expiration: 'Vencimiento'
	};

	const typeColors: Record<MovementType, string> = {
		entry: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
		exit: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
		adjustment: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
		expiration: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400'
	};

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString('es-VE', {
				day: '2-digit', month: '2-digit', year: 'numeric'
			});
		} catch { return iso; }
	}

	function formatDateTime(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('es-VE', {
				day: '2-digit', month: '2-digit', year: 'numeric',
				hour: '2-digit', minute: '2-digit'
			});
		} catch { return iso; }
	}

	const hasActiveFilters = $derived(
		!!medicationFilter || !!typeFilter || !!dateFrom || !!dateTo
	);
</script>

{#snippet typeCell(_v: unknown, row: MovementRow, _index: number)}
	{@const t = row.movement_type as MovementType}
	<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {typeColors[t] ?? 'bg-canvas-subtle text-ink-muted'}">
		{#if t === 'entry'}
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
		{:else if t === 'exit'}
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
		{:else if t === 'adjustment'}
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
		{:else}
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
		{/if}
		{typeLabels[t] ?? t}
	</span>
{/snippet}

{#snippet quantityCell(_v: unknown, row: MovementRow, _index: number)}
	{@const t = row.movement_type as MovementType}
	{@const qty = row.quantity as number}
	<span class="font-mono text-sm {t === 'entry' ? 'text-emerald-600 dark:text-emerald-400' : t === 'exit' || t === 'expiration' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}">
		{t === 'entry' ? '+' : t === 'exit' || t === 'expiration' ? '-' : '~'}{qty}
	</span>
{/snippet}

{#snippet balanceCell(_v: unknown, row: MovementRow, _index: number)}
	<span class="font-mono text-sm text-ink font-medium">{row.balance_after}</span>
{/snippet}

{#snippet dateCell(_v: unknown, row: MovementRow, _index: number)}
	<span class="text-xs text-ink-muted">{formatDateTime(row.movement_date as string)}</span>
{/snippet}

{#snippet referenceCell(_v: unknown, row: MovementRow, _index: number)}
	{@const ref = row.reference as string | null}
	{@const lot = row.lot_number as string | null}
	<div class="flex flex-col gap-0.5">
		{#if ref}
			<span class="text-xs text-ink-muted truncate max-w-[200px]" title={ref}>{ref}</span>
		{/if}
		{#if lot}
			<span class="text-xs text-ink-subtle font-mono">Lote: {lot}</span>
		{/if}
		{#if !ref && !lot}
			<span class="text-xs text-ink-subtle">—</span>
		{/if}
	</div>
{/snippet}

<svelte:head>
	<title>Kardex de Movimientos — Inventario</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: '/inventory' },
		{ label: 'Kardex de Movimientos' }
	]} />

	<div>
		<h1 class="text-lg sm:text-xl font-bold text-ink">Kardex de Movimientos</h1>
		<p class="text-sm text-ink-muted mt-0.5">Trazabilidad de entradas, salidas y ajustes de inventario</p>
	</div>

	<!-- Filtros -->
	<Card>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
			<div>
				<label for="med-filter" class="block text-xs font-medium text-ink-muted mb-1">Medicamento</label>
				<select id="med-filter" bind:value={medicationFilter}
					class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
					       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60">
					<option value="">Todos</option>
					{#each data.medicationOptions as med}
						<option value={med.id}>{med.generic_name} ({med.code})</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="type-filter" class="block text-xs font-medium text-ink-muted mb-1">Tipo</label>
				<select id="type-filter" bind:value={typeFilter}
					class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
					       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60">
					<option value="">Todos</option>
					<option value="entry">Entrada</option>
					<option value="exit">Salida</option>
					<option value="adjustment">Ajuste</option>
					<option value="expiration">Vencimiento</option>
				</select>
			</div>

			<div>
				<label for="date-from" class="block text-xs font-medium text-ink-muted mb-1">Desde</label>
				<input id="date-from" type="date" bind:value={dateFrom}
					class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
					       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60" />
			</div>

			<div>
				<label for="date-to" class="block text-xs font-medium text-ink-muted mb-1">Hasta</label>
				<input id="date-to" type="date" bind:value={dateTo}
					class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
					       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60" />
			</div>

			<div class="flex items-end gap-2">
				<button type="button" onclick={applyFilters}
					class="h-9 px-4 text-sm font-medium rounded-lg bg-viking-600 text-white hover:bg-viking-700 transition-colors
					       shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
					Filtrar
				</button>
				{#if hasActiveFilters}
					<button type="button" onclick={clearFilters}
						class="h-9 px-3 text-sm font-medium rounded-lg border border-border text-ink-muted hover:bg-canvas-subtle transition-colors">
						Limpiar
					</button>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'movement_date',  header: 'Fecha',        width: '150px', render: dateCell },
				{ key: 'movement_type',  header: 'Tipo',         width: '120px', render: typeCell },
				{ key: 'medication_name', header: 'Medicamento' },
				{ key: 'quantity',       header: 'Cantidad',     width: '100px', align: 'right', render: quantityCell },
				{ key: 'balance_after',  header: 'Balance',      width: '100px', align: 'right', render: balanceCell },
				{ key: 'reference',      header: 'Referencia',   width: '200px', render: referenceCell }
			] as DataTableColumn<MovementRow>[]}
			data={data.movements.data as MovementRow[]}
			rowKey="id"
			emptyMessage="No hay movimientos registrados con los filtros aplicados."
		/>

		<PaginationBar
			page={data.movements.page}
			total={data.movements.total}
			pageSize={data.movements.pageSize}
			pageSizeOptions={[10, 25, 50, 100]}
			onPageChange={(p) => changePage(p)}
			onPageSizeChange={(ps) => changePage(1, ps)}
		/>
	</Card>
</div>
