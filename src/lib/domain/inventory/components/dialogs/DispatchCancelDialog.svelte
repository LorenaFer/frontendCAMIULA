<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { Dispatch } from '$domain/inventory/types.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import { toastWarning, toastError } from '$shared/components/toast/toast.svelte.js';

	interface Props {
		dispatch: Dispatch;
		onClose: () => void;
		/** Called after a successful cancellation (so parent can clear state) */
		onCancelled?: () => void;
	}

	let { dispatch, onClose, onCancelled }: Props = $props();
</script>

<Dialog open={true} {onClose} size="sm">
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
					toastWarning('Despacho cancelado', `El despacho de la receta ${dispatch.prescription_number} fue cancelado.`);
					onCancelled?.();
					await invalidateAll();
				} else if (result.type === 'failure') {
					toastError('Error al cancelar', (result.data as { error?: string })?.error ?? 'No se pudo cancelar el despacho.');
				}
			};
		}}
	>
		<input type="hidden" name="id" value={dispatch.id} />
		<DialogBody>
			<p class="text-sm text-ink mb-3">
				¿Está seguro de que desea cancelar el despacho de la receta
				<strong class="font-mono">{dispatch.prescription_number}</strong>
				para {dispatch.patient_name ?? 'paciente'}?
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
			<Button type="button" variant="ghost" size="md" onclick={onClose}>No cancelar</Button>
			<Button type="submit" variant="danger" size="md">Confirmar cancelación</Button>
		</DialogFooter>
	</form>
</Dialog>
