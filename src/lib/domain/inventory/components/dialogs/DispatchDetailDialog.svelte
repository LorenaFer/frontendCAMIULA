<script lang="ts">
	import type { Dispatch } from '$domain/inventory/types.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';

	interface Props {
		dispatch: Dispatch;
		onClose: () => void;
		onCancel: (dispatch: Dispatch) => void;
	}

	let { dispatch: d, onClose, onCancel }: Props = $props();

	function formatDateTime(iso?: string) {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
		} catch { return iso; }
	}
</script>

<Dialog open={true} {onClose} size="lg">
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
				<h3 class="text-sm font-semibold text-ink mb-2">Medicamentos despachados ({d.items?.length ?? 0})</h3>
				{#if !d.items || d.items.length === 0}
					<p class="text-sm text-ink-muted py-3 text-center">Sin ítems.</p>
				{:else}
					<div class="space-y-2">
						{#each d.items as item}
							<div class="bg-canvas-subtle rounded-lg border border-border p-3">
								<div class="flex items-start justify-between">
									<div>
										<p class="text-sm font-medium text-ink">{item.medication?.generic_name ?? '—'}</p>
										<p class="text-sm text-ink-muted">{item.medication?.pharmaceutical_form ?? ''}{item.medication?.pharmaceutical_form && item.medication?.unit_measure ? ' · ' : ''}{item.medication?.unit_measure ?? ''}</p>
									</div>
									<p class="text-sm font-mono text-ink shrink-0">{item.quantity_dispatched ?? 0} uds</p>
								</div>
								<div class="mt-1.5 flex gap-4 text-sm text-ink-muted">
									<span>Lote: <span class="font-mono text-ink">{item.lot_number ?? '—'}</span></span>
									<span>Vence: <span class="text-ink">{item.expiration_date ?? '—'}</span></span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</DialogBody>
	<DialogFooter>
		<Button type="button" variant="ghost" size="md" onclick={onClose}>Cerrar</Button>
		{#if d.dispatch_status === 'completed'}
			<Button type="button" variant="danger" size="md" onclick={() => onCancel(d)}>Cancelar despacho</Button>
		{/if}
	</DialogFooter>
</Dialog>
