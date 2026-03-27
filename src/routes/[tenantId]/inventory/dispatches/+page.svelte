<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { Dispatch, DispatchValidation } from '$shared/types/inventory.js';
	import type { DataTableColumn } from '$shared/components/table/types.js';
	type DispatchRow = Dispatch & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import LimitProgressBar from '$shared/components/inventory/LimitProgressBar.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchNumber = $state('');
	let validating = $state(false);
	let dispatching = $state(false);

	// Persiste la última validación recibida para que el panel no desaparezca
	// después de que ejecutarDespacho devuelva un error (form.validation sería undefined).
	let _lastValidation = $state<DispatchValidation | null>(null);
	let _lastPrescription = $state<{ id: string; prescription_number: string; patient_name?: string } | null>(null);

	$effect(() => {
		const v = (form as { validation?: DispatchValidation })?.validation;
		const p = (form as { prescription?: { id: string; prescription_number: string; patient_name?: string } })?.prescription;
		if (v) _lastValidation = v;
		if (p) _lastPrescription = p;
	});

	const activeValidation = $derived<DispatchValidation | null>(
		(form as { validation?: DispatchValidation })?.validation ?? _lastValidation ?? data.validation ?? null
	);
	const activePrescription = $derived(
		(form as { prescription?: { id: string; prescription_number: string; patient_name?: string } })?.prescription
			?? _lastPrescription
			?? null
	);

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Despachos — Inventario</title>
</svelte:head>

{#snippet statusCell(_v: unknown, row: DispatchRow)}
	{#if row.dispatch_status === 'completed'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Completado</span>
	{:else if row.dispatch_status === 'cancelled'}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Cancelado</span>
	{:else}
		<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Pendiente</span>
	{/if}
{/snippet}

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<div>
		<h1 class="text-lg sm:text-xl font-bold text-ink">Despachos de Farmacia</h1>
		<p class="text-xs text-ink-muted mt-0.5">Validación y entrega de medicamentos con receta</p>
	</div>

	<!-- Panel de búsqueda y validación de receta -->
	<Card padding="md">
		<h2 class="text-sm font-semibold text-ink mb-3">Validar receta</h2>

		<form
			method="POST"
			action="?/validarDespacho"
			use:enhance={() => {
				validating = true;
				return async ({ update }) => {
					validating = false;
					await update({ reset: false });
				};
			}}
			class="flex gap-2"
		>
			<input
				name="prescription_number"
				type="text"
				placeholder="Número de receta (ej: RX-001)"
				bind:value={searchNumber}
				class="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
				       hover:border-border-strong focus:outline-none focus:border-viking-400
				       focus:ring-2 focus:ring-viking-100/60"
			/>
			<Button type="submit" variant="primary" size="sm" isLoading={validating}>
				Validar
			</Button>
		</form>

		<!-- Error / aviso de la Action -->
		{#if (form as { error?: string })?.error}
			{@const errMsg = (form as { error: string }).error}
			{@const isWarning = errMsg.includes('backend')}
			<p class="mt-3 text-sm rounded-lg px-3 py-2
				{isWarning
					? 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
					: 'text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}">
				{errMsg}
			</p>
		{/if}

		<!-- Resultado de validación -->
		{#if activeValidation && activePrescription}
			<div class="mt-4 space-y-3">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-ink">
							Receta <span class="font-mono">{activePrescription.prescription_number}</span>
						</p>
						{#if activePrescription.patient_name}
							<p class="text-xs text-ink-muted">Paciente: {activePrescription.patient_name}</p>
						{/if}
					</div>
					{#if activeValidation.can_dispatch}
						<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
							<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
								<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
							</svg>
							Puede despacharse
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
							<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
								<path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
							</svg>
							Bloqueado
						</span>
					{/if}
				</div>

				<!-- Ítems de la receta con estado de límite -->
				<ul class="space-y-2">
					{#each activeValidation.items as item}
						<li class="bg-canvas-subtle/60 border border-border/60 rounded-lg p-3 space-y-2">
							<div class="flex items-start justify-between gap-2">
								<div>
									<p class="text-sm font-medium text-ink">{item.generic_name}</p>
									<p class="text-xs text-ink-muted">
										Prescrito: {item.quantity_prescribed} · Disponible: {item.quantity_available}
									</p>
								</div>
								{#if !item.can_dispatch}
									<span class="text-xs text-red-600 dark:text-red-400 font-medium shrink-0">{item.block_reason}</span>
								{/if}
							</div>

							{#if item.monthly_limit}
								<LimitProgressBar
									used={item.monthly_used}
									limit={item.monthly_limit}
									unit="uds"
									medication_name="Límite mensual"
								/>
								{#if item.has_exception}
									<p class="text-[11px] text-viking-600 dark:text-viking-400">Excepción activa aplicada</p>
								{/if}
							{/if}
						</li>
					{/each}
				</ul>

				<!-- Botón de despacho -->
				{#if activeValidation.can_dispatch}
					<form
						method="POST"
						action="?/ejecutarDespacho"
						use:enhance={() => {
							dispatching = true;
							return async ({ update }) => {
								dispatching = false;
								await update();
								await invalidateAll();
							};
						}}
					>
						<input type="hidden" name="prescription_id" value={activeValidation.prescription_id} />
						<Button type="submit" variant="primary" isLoading={dispatching} class="w-full sm:w-auto">
							Ejecutar despacho
						</Button>
					</form>
				{/if}

				<!-- Confirmación de despacho -->
				{#if (form as { dispatched?: boolean })?.dispatched}
					<p class="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
						Despacho ejecutado correctamente.
					</p>
				{/if}
			</div>
		{/if}
	</Card>

	<!-- Historial de despachos -->
	<Card padding="none">
		<div class="px-4 py-3 border-b border-border">
			<h2 class="text-sm font-semibold text-ink">Historial de despachos</h2>
		</div>
		<DataTable
			columns={[
				{ key: 'prescription_number', header: 'Receta',     width: '140px' },
				{ key: 'patient_name',         header: 'Paciente' },
				{ key: 'dispatch_date',        header: 'Fecha',     width: '110px' },
				{ key: 'pharmacist_name',      header: 'Farmacéutico', width: '170px' },
				{ key: 'dispatch_status',      header: 'Estado',    width: '110px', align: 'center', render: statusCell }
			] satisfies DataTableColumn<DispatchRow>[]}
			data={data.dispatches.data as DispatchRow[]}
			rowKey="id"
			emptyMessage="No hay despachos registrados."
		/>

		{#if data.dispatches.total > data.dispatches.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-xs text-ink-muted">
					{(data.dispatches.page - 1) * data.dispatches.pageSize + 1}–{Math.min(
						data.dispatches.page * data.dispatches.pageSize, data.dispatches.total
					)} de {data.dispatches.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" disabled={data.dispatches.page <= 1}
						onclick={() => changePage(data.dispatches.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="sm" disabled={!data.dispatches.hasNext}
						onclick={() => changePage(data.dispatches.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>
