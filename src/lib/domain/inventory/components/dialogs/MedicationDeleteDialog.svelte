<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { Medication } from '$domain/inventory/types.js';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import { toastWarning, toastError } from '$shared/components/toast/toast.svelte.js';

	interface Props {
		deletingMed: Medication | null;
		onClose: () => void;
	}

	let { deletingMed, onClose }: Props = $props();
</script>

<!-- Modal de confirmación de eliminación -->
{#if deletingMed}
	<Dialog open={true} onClose={onClose} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Desactivar medicamento</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/desactivarMedicamento"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						toastWarning('Medicamento desactivado', `${deletingMed!.generic_name} (${deletingMed!.code}) fue desactivado.`);
						onClose();
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al desactivar', (result.data as { error?: string })?.error ?? 'No se pudo desactivar el medicamento.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={deletingMed.id} />
			<DialogBody>
				<p class="text-sm text-ink">
					¿Está seguro de que desea desactivar el medicamento
					<strong>{deletingMed.generic_name}</strong> ({deletingMed.code})?
				</p>
				<p class="text-sm text-ink-muted mt-2">
					El medicamento quedará como "Descontinuado" y no aparecerá en nuevas recetas ni órdenes.
				</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={onClose}>Cancelar</Button>
				<Button type="submit" variant="danger" size="md">Desactivar</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
