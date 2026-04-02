<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { Dispatch, DispatchValidation } from '$shared/types/inventory.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type DispatchRow = Dispatch & Record<string, unknown>;
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import LimitProgressBar from '$shared/components/inventory/LimitProgressBar.svelte';
	import StatusBadge from '$shared/components/inventory/StatusBadge.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import { toastSuccess, toastError, toastWarning, toastInfo } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchNumber = $state('');
	let validating = $state(false);
	let dispatching = $state(false);
	let showConfirmDialog = $state(false);
	let dispatchFormRef = $state<HTMLFormElement | null>(null);

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

	let viewingDispatch = $state<Dispatch | null>(null);
	let cancellingDispatch = $state<Dispatch | null>(null);

	function openDetail(row: Dispatch) {
		viewingDispatch = { ...row };
	}

	function formatDateTime(iso?: string) {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
		} catch { return iso; }
	}

	const dispatchMenu: RowMenuItem<DispatchRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => openDetail(row as unknown as Dispatch) },
		{ label: 'Cancelar despacho', icon: 'delete', variant: 'danger', onclick: (row) => {
			if ((row as unknown as Dispatch).dispatch_status === 'completed') {
				cancellingDispatch = { ...row } as unknown as Dispatch;
			}
		}}
	];

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Despachos — Inventario</title>
</svelte:head>

{#snippet statusCell(_v: unknown, row: DispatchRow, _index: number)}
	<StatusBadge status={row.dispatch_status as string} />
{/snippet}

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
	<Card padding="md">
		<h2 class="text-sm font-semibold text-ink mb-3">Validar receta</h2>

		<form
			method="POST"
			action="?/validarDespacho"
			use:enhance={() => {
				validating = true;
				return async ({ result, update }) => {
					validating = false;
					await update({ reset: false });
					if (result.type === 'success') {
						toastInfo('Receta validada', 'La receta fue validada correctamente.');
					} else if (result.type === 'failure') {
						toastError('Error de validación', (result.data as { error?: string })?.error ?? 'No se pudo validar la receta.');
					}
				};
			}}
			class="flex gap-2"
		>
			<input
				name="prescription_number"
				type="text"
				placeholder="Número de receta (ej: RX-001)"
				bind:value={searchNumber}
				class="flex-1 h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
				       hover:border-border-strong focus:outline-none focus:border-viking-400
				       focus:ring-2 focus:ring-viking-100/60"
			/>
			<Button type="submit" variant="primary" size="md" isLoading={validating}>
				Validar
			</Button>
		</form>

		<!-- Resultado de validación -->
		{#if activeValidation && activePrescription}
			<div class="mt-4 space-y-3">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-ink">
							Receta <span class="font-mono">{activePrescription.prescription_number}</span>
						</p>
						{#if activePrescription.patient_name}
							<p class="text-sm text-ink-muted">Paciente: {activePrescription.patient_name}</p>
						{/if}
					</div>
					{#if activeValidation.can_dispatch}
						<Badge variant="success" style="soft" size="sm" dot>Puede despacharse</Badge>
					{:else}
						<Badge variant="danger" style="soft" size="sm" dot>Bloqueado</Badge>
					{/if}
				</div>

				<!-- Ítems de la receta con estado de límite -->
				<ul class="space-y-2">
					{#each activeValidation.items as item}
						<li class="bg-canvas-subtle/60 border border-border/60 rounded-lg p-3 space-y-2">
							<div class="flex items-start justify-between gap-2">
								<div>
									<p class="text-sm font-medium text-ink">{item.generic_name}</p>
									<p class="text-sm text-ink-muted">
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
									<p class="text-xs text-viking-600 dark:text-viking-400">Excepción activa aplicada</p>
								{/if}
							{/if}
						</li>
					{/each}
				</ul>

				<!-- Botón de despacho -->
				{#if activeValidation.can_dispatch}
					<form
						bind:this={dispatchFormRef}
						method="POST"
						action="?/ejecutarDespacho"
						use:enhance={() => {
							dispatching = true;
							return async ({ result, update }) => {
								dispatching = false;
								showConfirmDialog = false;
								await update();
								if (result.type === 'success') {
									toastSuccess('Despacho realizado', `Se despacharon los medicamentos de la receta ${activePrescription?.prescription_number ?? ''}.`);
								} else if (result.type === 'failure') {
									toastError('Error al despachar', (result.data as { error?: string })?.error ?? 'No se pudo ejecutar el despacho.');
								}
								await invalidateAll();
							};
						}}
					>
						<input type="hidden" name="prescription_id" value={activeValidation.prescription_id} />
						<Button type="button" variant="primary" size="md" onclick={() => { showConfirmDialog = true; }} class="w-full sm:w-auto">
							Ejecutar despacho
						</Button>
					</form>
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
			] as DataTableColumn<DispatchRow>[]}
			data={data.dispatches.data as DispatchRow[]}
			rowKey="id"
			rowMenu={dispatchMenu}
			emptyMessage="No hay despachos registrados."
		/>

		{#if data.dispatches.total > data.dispatches.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-sm text-ink-muted">
					{(data.dispatches.page - 1) * data.dispatches.pageSize + 1}–{Math.min(
						data.dispatches.page * data.dispatches.pageSize, data.dispatches.total
					)} de {data.dispatches.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="md" disabled={data.dispatches.page <= 1}
						onclick={() => changePage(data.dispatches.page - 1)}>Anterior</Button>
					<Button variant="ghost" size="md" disabled={!data.dispatches.hasNext}
						onclick={() => changePage(data.dispatches.page + 1)}>Siguiente</Button>
				</div>
			</div>
		{/if}
	</Card>
</div>

<!-- Diálogo de confirmación de despacho -->
{#if showConfirmDialog && activeValidation && activePrescription}
	<Dialog open={true} onClose={() => { showConfirmDialog = false; }} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Confirmar despacho</h2>
		</DialogHeader>
		<DialogBody>
			<p class="text-sm text-ink mb-3">
				¿Está seguro de que desea despachar los siguientes medicamentos?
			</p>
			<div class="bg-canvas-subtle rounded-lg border border-border p-3 space-y-2 mb-3">
				<p class="text-sm font-medium text-ink">
					Receta: <span class="font-mono">{activePrescription.prescription_number}</span>
				</p>
				{#if activePrescription.patient_name}
					<p class="text-sm text-ink-muted">Paciente: {activePrescription.patient_name}</p>
				{/if}
				<ul class="space-y-1 mt-2">
					{#each activeValidation.items as item}
						<li class="text-sm text-ink flex justify-between">
							<span>{item.generic_name}</span>
							<span class="text-ink-muted font-mono">{item.quantity_prescribed} uds</span>
						</li>
					{/each}
				</ul>
			</div>
			<p class="text-sm text-honey-700 dark:text-honey-400">
				Esta acción no se puede deshacer.
			</p>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { showConfirmDialog = false; }}>
				Cancelar
			</Button>
			<Button
				type="button"
				variant="primary"
				size="md"
				isLoading={dispatching}
				onclick={() => { dispatchFormRef?.requestSubmit(); }}
			>
				Sí, despachar
			</Button>
		</DialogFooter>
	</Dialog>
{/if}

<!-- Modal de detalle de despacho -->
{#if viewingDispatch}
	{@const d = viewingDispatch}
	<Dialog open={true} onClose={() => { viewingDispatch = null; }} size="lg">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">Receta <span class="font-mono">{d.prescription_number}</span></p>
			<h2 class="text-base font-semibold text-ink">Detalle de despacho</h2>
		</DialogHeader>
		<DialogBody>
			<div class="space-y-5">
				<!-- Info general -->
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
					<div>
						<p class="text-ink-muted">Paciente</p>
						<p class="font-medium text-ink">{d.patient_name ?? '—'}</p>
					</div>
					<div>
						<p class="text-ink-muted">Farmacéutico</p>
						<p class="font-medium text-ink">{d.pharmacist_name ?? '—'}</p>
					</div>
					<div>
						<p class="text-ink-muted">Estado</p>
						<StatusBadge status={d.dispatch_status} />
					</div>
					<div>
						<p class="text-ink-muted">Fecha de despacho</p>
						<p class="font-medium text-ink">{d.dispatch_date}</p>
					</div>
					<div>
						<p class="text-ink-muted">Registrado</p>
						<p class="font-medium text-ink">{formatDateTime(d.created_at)}</p>
					</div>
				</div>

				{#if d.notes}
					<div class="text-sm">
						<p class="text-ink-muted">Notas</p>
						<p class="text-ink">{d.notes}</p>
					</div>
				{/if}

				<!-- Ítems despachados -->
				<div>
					<h3 class="text-sm font-semibold text-ink mb-2">Medicamentos despachados ({d.items.length})</h3>
					{#if d.items.length === 0}
						<p class="text-sm text-ink-muted py-3 text-center">Sin ítems.</p>
					{:else}
						<div class="space-y-2">
							{#each d.items as item}
								<div class="bg-canvas-subtle rounded-lg border border-border p-3">
									<div class="flex items-start justify-between">
										<div>
											<p class="text-sm font-medium text-ink">{item.medication.generic_name}</p>
											<p class="text-sm text-ink-muted">{item.medication.pharmaceutical_form} · {item.medication.unit_measure}</p>
										</div>
										<p class="text-sm font-mono text-ink shrink-0">{item.quantity_dispatched} uds</p>
									</div>
									<div class="mt-1.5 flex gap-4 text-sm text-ink-muted">
										<span>Lote: <span class="font-mono text-ink">{item.lot_number}</span></span>
										<span>Vence: <span class="text-ink">{item.expiration_date}</span></span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { viewingDispatch = null; }}>Cerrar</Button>
			{#if d.dispatch_status === 'completed'}
				<Button type="button" variant="danger" size="md" onclick={() => { cancellingDispatch = d; viewingDispatch = null; }}>Cancelar despacho</Button>
			{/if}
		</DialogFooter>
	</Dialog>
{/if}

<!-- Modal de cancelación de despacho -->
{#if cancellingDispatch}
	<Dialog open={true} onClose={() => { cancellingDispatch = null; }} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Cancelar despacho</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/cancelarDespacho"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						toastWarning('Despacho cancelado', `El despacho de la receta ${cancellingDispatch!.prescription_number} fue cancelado.`);
						cancellingDispatch = null;
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al cancelar', (result.data as { error?: string })?.error ?? 'No se pudo cancelar el despacho.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={cancellingDispatch.id} />
			<DialogBody>
				<p class="text-sm text-ink mb-3">
					¿Está seguro de que desea cancelar el despacho de la receta
					<strong class="font-mono">{cancellingDispatch.prescription_number}</strong>
					para {cancellingDispatch.patient_name ?? 'paciente'}?
				</p>
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1" for="cancel-reason">Motivo de cancelación *</label>
					<textarea
						id="cancel-reason"
						name="reason"
						required
						rows="2"
						placeholder="Ej: Error en la receta, medicamento incorrecto..."
						class="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-elevated text-ink
						       focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60 resize-none"
					></textarea>
				</div>
				<p class="text-sm text-honey-700 dark:text-honey-400 mt-2">
					El stock de los medicamentos se repondrá automáticamente.
				</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { cancellingDispatch = null; }}>No cancelar</Button>
				<Button type="submit" variant="danger" size="md">Confirmar cancelación</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
