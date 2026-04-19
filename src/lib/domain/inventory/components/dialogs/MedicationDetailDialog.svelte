<script lang="ts">
	import type { Medication } from '$domain/inventory/types.js';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';
	import StockIndicator from '$domain/inventory/components/widgets/StockIndicator.svelte';

	interface Props {
		viewingMed: Medication | null;
		onClose: () => void;
		onEdit: (med: Medication) => void;
	}

	let { viewingMed, onClose, onEdit }: Props = $props();
</script>

<!-- Modal de detalle de medicamento -->
{#if viewingMed}
	<Dialog open={true} onClose={onClose} size="md">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal font-mono">{viewingMed.code}</p>
			<h2 class="text-base font-semibold text-ink">{viewingMed.generic_name}</h2>
		</DialogHeader>
		<DialogBody>
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-ink-muted">Nombre comercial</p>
					<p class="font-medium text-ink">{viewingMed.commercial_name ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Estado</p>
					<StatusBadge status={viewingMed.medication_status} />
				</div>
				<div>
					<p class="text-ink-muted">Forma farmacéutica</p>
					<p class="font-medium text-ink">{viewingMed.pharmaceutical_form}</p>
				</div>
				<div>
					<p class="text-ink-muted">Concentración</p>
					<p class="font-medium text-ink">{viewingMed.concentration ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Unidad de medida</p>
					<p class="font-medium text-ink">{viewingMed.unit_measure}</p>
				</div>
				<div>
					<p class="text-ink-muted">Clase terapéutica</p>
					<p class="font-medium text-ink">{viewingMed.therapeutic_class ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Categoría</p>
					<p class="font-medium text-ink">{viewingMed.category_name ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Stock actual</p>
					<div class="mt-0.5"><StockIndicator stock={viewingMed.current_stock} /></div>
				</div>
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={onClose}>Cerrar</Button>
			<Button type="button" variant="primary" size="md" onclick={() => { const med = viewingMed!; onEdit(med); }}>Editar</Button>
		</DialogFooter>
	</Dialog>
{/if}
