<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Dispatch, DispatchValidation } from '$domain/inventory/types.js';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import DispatchForms, { type ActivePrescription } from '$domain/inventory/components/forms/DispatchForms.svelte';
	import DispatchTable from '$domain/inventory/components/tables/DispatchTable.svelte';
	import DispatchConfirmDialog from '$domain/inventory/components/dialogs/DispatchConfirmDialog.svelte';
	import DispatchDetailDialog from '$domain/inventory/components/dialogs/DispatchDetailDialog.svelte';
	import DispatchCancelDialog from '$domain/inventory/components/dialogs/DispatchCancelDialog.svelte';
	import type { DispatchStatusFilter } from '$domain/inventory/components/filters/DispatchFilters.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showConfirmDialog = $state(false);
	let dispatching = $state(false);
	let submitDispatch = $state<() => void>(() => {});

	// Persiste la última validación recibida para que el panel no desaparezca
	// después de que ejecutarDespacho devuelva un error (form.validation sería undefined).
	let _lastValidation = $state<DispatchValidation | null>(null);
	let _lastPrescription = $state<ActivePrescription | null>(null);

	$effect(() => {
		const v = (form as { validation?: DispatchValidation })?.validation;
		const p = (form as { prescription?: ActivePrescription })?.prescription;
		if (v) _lastValidation = v;
		if (p) _lastPrescription = p;
	});

	const activeValidation = $derived<DispatchValidation | null>(
		(form as { validation?: DispatchValidation })?.validation ?? _lastValidation ?? data.validation ?? null
	);
	const activePrescription = $derived<ActivePrescription | null>(
		(form as { prescription?: ActivePrescription })?.prescription
			?? _lastPrescription
			?? null
	);

	let viewingDispatch = $state<Dispatch | null>(null);
	let cancellingDispatch = $state<Dispatch | null>(null);

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	const activeStatus = $derived<DispatchStatusFilter>(
		(($page.url.searchParams.get('status') as DispatchStatusFilter) ?? 'all')
	);

	function setStatusFilter(status: DispatchStatusFilter) {
		const qs = new URLSearchParams($page.url.searchParams);
		if (status === 'all') qs.delete('status');
		else qs.set('status', status);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Despachos — Inventario</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Farmacia', href: '/inventory' },
		{ label: 'Despachos' }
	]} />

	<div>
		<h1 class="text-lg sm:text-xl font-bold text-ink">Despachos de Farmacia</h1>
		<p class="text-sm text-ink-muted mt-0.5">Validación y entrega de medicamentos con receta</p>
	</div>

	<!-- Panel de búsqueda y validación de receta -->
	<DispatchForms
		{activeValidation}
		{activePrescription}
		onRequestConfirm={() => { showConfirmDialog = true; }}
		onDispatchSettled={() => { showConfirmDialog = false; }}
		bind:submitDispatch
		bind:dispatching
	/>

	<!-- Historial de despachos -->
	<DispatchTable
		pagination={data.dispatches}
		{activeStatus}
		onStatusChange={setStatusFilter}
		onPageChange={(p) => changePage(p)}
		onPageSizeChange={(ps) => changePage(1, ps)}
		onView={(row) => { viewingDispatch = { ...row }; }}
		onCancel={(row) => { cancellingDispatch = { ...row }; }}
	/>
</div>

<!-- Diálogo de confirmación de despacho -->
{#if showConfirmDialog && activeValidation && activePrescription}
	<DispatchConfirmDialog
		validation={activeValidation}
		prescription={activePrescription}
		{dispatching}
		onClose={() => { showConfirmDialog = false; }}
		onConfirm={() => { submitDispatch(); }}
	/>
{/if}

<!-- Modal de detalle de despacho -->
{#if viewingDispatch}
	<DispatchDetailDialog
		dispatch={viewingDispatch}
		onClose={() => { viewingDispatch = null; }}
		onCancel={(d) => { cancellingDispatch = d; viewingDispatch = null; }}
	/>
{/if}

<!-- Modal de cancelación de despacho -->
{#if cancellingDispatch}
	<DispatchCancelDialog
		dispatch={cancellingDispatch}
		onClose={() => { cancellingDispatch = null; }}
		onCancelled={() => { cancellingDispatch = null; }}
	/>
{/if}
