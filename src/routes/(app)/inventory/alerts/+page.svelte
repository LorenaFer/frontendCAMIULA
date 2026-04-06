<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { StockAlertRecord, AlertLevel, AlertStatus } from '$domain/inventory/types.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type AlertRow = StockAlertRecord & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import PaginationBar from '$shared/components/table/PaginationBar.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	let { data }: { data: PageData } = $props();

	// ─── Filtros ────────────────────────────────────
	let statusFilter = $state(data.filters.alert_status ?? '');
	let levelFilter = $state(data.filters.alert_level ?? '');
	let medicationFilter = $state(data.filters.medication_id ?? '');

	let generating = $state(false);

	function applyFilters() {
		const qs = new URLSearchParams();
		if (statusFilter) qs.set('alert_status', statusFilter);
		if (levelFilter) qs.set('alert_level', levelFilter);
		if (medicationFilter) qs.set('medication_id', medicationFilter);
		qs.set('page', '1');
		qs.set('page_size', String(data.alerts.pageSize));
		goto(`?${qs}`, { replaceState: true });
	}

	function clearFilters() {
		statusFilter = '';
		levelFilter = '';
		medicationFilter = '';
		goto('?', { replaceState: true });
	}

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	// ─── Acciones ───────────────────────────────────
	async function doAction(action: string, alertId?: string) {
		try {
			const body: Record<string, string> = { action };
			if (alertId) body.alert_id = alertId;

			const res = await fetch('/inventory/alerts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!res.ok) throw new Error('Error en la acción');

			const result = await res.json();

			if (action === 'generate') {
				toastSuccess('Alertas generadas', `${result.new_alerts ?? 0} nuevas alertas`);
			} else if (action === 'acknowledge') {
				toastSuccess('Alerta vista', 'Alerta marcada como vista');
			} else if (action === 'resolve') {
				toastSuccess('Alerta resuelta', 'La alerta ha sido resuelta');
			}

			await invalidateAll();
		} catch {
			toastError('Error', 'Error al ejecutar la acción');
		}
	}

	async function generateAlerts() {
		generating = true;
		await doAction('generate');
		generating = false;
	}

	const alertMenu: RowMenuItem<AlertRow>[] = [
		{
			label: 'Marcar como vista',
			icon: 'view',
			onclick: (row) => {
				if ((row.alert_status as AlertStatus) === 'active') {
					doAction('acknowledge', row.id as string);
				}
			}
		},
		{
			label: 'Resolver',
			icon: 'edit',
			onclick: (row) => {
				const s = row.alert_status as AlertStatus;
				if (s === 'active' || s === 'acknowledged') {
					doAction('resolve', row.id as string);
				}
			}
		},
		{
			label: 'Ver Kardex',
			icon: 'view',
			onclick: (row) => goto(`/inventory/movements?medication_id=${row.fk_medication_id}`)
		}
	];

	// ─── Helpers ────────────────────────────────────
	const levelLabels: Record<AlertLevel, string> = {
		low: 'Bajo',
		critical: 'Crítico',
		expired: 'Agotado'
	};

	const levelColors: Record<AlertLevel, string> = {
		low: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
		critical: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
		expired: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
	};

	const statusLabels: Record<AlertStatus, string> = {
		active: 'Activa',
		acknowledged: 'Vista',
		resolved: 'Resuelta'
	};

	const statusColors: Record<AlertStatus, string> = {
		active: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
		acknowledged: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
		resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
	};

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('es-VE', {
				day: '2-digit', month: '2-digit', year: 'numeric',
				hour: '2-digit', minute: '2-digit'
			});
		} catch { return iso; }
	}

	const hasActiveFilters = $derived(
		!!statusFilter || !!levelFilter || !!medicationFilter
	);
</script>

{#snippet levelCell(_v: unknown, row: AlertRow, _index: number)}
	{@const level = row.alert_level as AlertLevel}
	<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {levelColors[level] ?? 'bg-canvas-subtle text-ink-muted'}">
		{#if level === 'expired'}
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
		{:else if level === 'critical'}
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
		{:else}
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
		{/if}
		{levelLabels[level] ?? level}
	</span>
{/snippet}

{#snippet statusCell(_v: unknown, row: AlertRow, _index: number)}
	{@const s = row.alert_status as AlertStatus}
	<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColors[s] ?? 'bg-canvas-subtle text-ink-muted'}">
		{statusLabels[s] ?? s}
	</span>
{/snippet}

{#snippet stockCell(_v: unknown, row: AlertRow, _index: number)}
	{@const stock = row.current_stock as number}
	{@const threshold = row.threshold as number}
	<div class="flex flex-col items-end">
		<span class="font-mono text-sm font-medium {stock === 0 ? 'text-red-600 dark:text-red-400' : stock <= threshold ? 'text-orange-600 dark:text-orange-400' : 'text-ink'}">{stock}</span>
		<span class="text-[10px] text-ink-subtle">umbral: {threshold}</span>
	</div>
{/snippet}

{#snippet detectedCell(_v: unknown, row: AlertRow, _index: number)}
	<span class="text-xs text-ink-muted">{formatDate(row.detected_at as string)}</span>
{/snippet}

{#snippet medicationCell(_v: unknown, row: AlertRow, _index: number)}
	<div class="flex flex-col">
		<span class="text-sm text-ink">{row.medication_name ?? '—'}</span>
		{#if row.medication_code}
			<span class="text-xs text-ink-subtle font-mono">{row.medication_code}</span>
		{/if}
	</div>
{/snippet}

<svelte:head>
	<title>Alertas de Stock — Inventario</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: '/inventory' },
		{ label: 'Alertas de Stock' }
	]} />

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Alertas de Stock</h1>
			<p class="text-sm text-ink-muted mt-0.5">Monitoreo de niveles críticos y agotamiento de medicamentos</p>
		</div>

		<div class="flex items-center gap-2">
			<!-- Contadores rápidos -->
			{#if data.alerts.active_count > 0}
				<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/40">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
					{data.alerts.active_count} activas
				</span>
			{/if}

			<button type="button" onclick={generateAlerts} disabled={generating}
				class="h-9 px-4 text-sm font-medium rounded-lg border border-border text-ink hover:bg-canvas-subtle transition-colors disabled:opacity-50">
				{generating ? 'Generando...' : 'Regenerar alertas'}
			</button>
		</div>
	</div>

	<!-- Filtros -->
	<Card>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
			<div>
				<label for="status-filter" class="block text-xs font-medium text-ink-muted mb-1">Estado</label>
				<select id="status-filter" bind:value={statusFilter}
					class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
					       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60">
					<option value="">Todos</option>
					<option value="active">Activa</option>
					<option value="acknowledged">Vista</option>
					<option value="resolved">Resuelta</option>
				</select>
			</div>

			<div>
				<label for="level-filter" class="block text-xs font-medium text-ink-muted mb-1">Nivel</label>
				<select id="level-filter" bind:value={levelFilter}
					class="w-full h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-ink
					       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60">
					<option value="">Todos</option>
					<option value="low">Bajo</option>
					<option value="critical">Crítico</option>
					<option value="expired">Agotado</option>
				</select>
			</div>

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
				{ key: 'alert_level',     header: 'Nivel',        width: '110px', render: levelCell },
				{ key: 'alert_status',    header: 'Estado',       width: '100px', render: statusCell },
				{ key: 'medication_name', header: 'Medicamento',  render: medicationCell },
				{ key: 'current_stock',   header: 'Stock',        width: '100px', align: 'right', render: stockCell },
				{ key: 'message',         header: 'Mensaje' },
				{ key: 'detected_at',     header: 'Detectada',    width: '150px', render: detectedCell }
			] as DataTableColumn<AlertRow>[]}
			data={data.alerts.items as AlertRow[]}
			rowKey="id"
			emptyMessage="No hay alertas de stock con los filtros aplicados."
			rowMenu={alertMenu}
		/>

		<PaginationBar
			page={data.alerts.page}
			total={data.alerts.total}
			pageSize={data.alerts.pageSize}
			pageSizeOptions={[10, 25, 50, 100]}
			onPageChange={(p) => changePage(p)}
			onPageSizeChange={(ps) => changePage(1, ps)}
		/>
	</Card>
</div>
