<script lang="ts">
	import type { DispatchValidation } from '$domain/inventory/types.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';

	type ActivePrescription = { id: string; prescription_number: string; patient_name?: string };

	interface Props {
		validation: DispatchValidation;
		prescription: ActivePrescription;
		dispatching: boolean;
		onClose: () => void;
		onConfirm: () => void;
	}

	let { validation, prescription, dispatching, onClose, onConfirm }: Props = $props();
</script>

<Dialog open={true} {onClose} size="sm">
	<DialogHeader>
		<h2 class="text-base font-semibold text-ink">Confirmar despacho</h2>
	</DialogHeader>
	<DialogBody>
		<p class="text-sm text-ink mb-3">
			¿Está seguro de que desea despachar los siguientes medicamentos?
		</p>
		<div class="bg-canvas-subtle rounded-lg border border-border p-3 space-y-2 mb-3">
			<p class="text-sm font-medium text-ink">
				Receta: <span class="font-mono">{prescription.prescription_number}</span>
			</p>
			{#if prescription.patient_name}
				<p class="text-sm text-ink-muted">Paciente: {prescription.patient_name}</p>
			{/if}
			<ul class="space-y-1 mt-2">
				{#each validation.items as item}
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
		<Button type="button" variant="ghost" size="md" onclick={onClose}>
			Cancelar
		</Button>
		<Button
			type="button"
			variant="primary"
			size="md"
			isLoading={dispatching}
			onclick={onConfirm}
		>
			Sí, despachar
		</Button>
	</DialogFooter>
</Dialog>
