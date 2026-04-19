<script lang="ts">
	import type { Especialidad } from '$domain/staff/types.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import { toastSuccess } from '$shared/components/toast/toast.svelte.js';

	interface Props {
		open: boolean;
		editingEsp: Especialidad | null;
		nombreInput: string;
		onClose: () => void;
	}

	let {
		open,
		editingEsp,
		nombreInput = $bindable(),
		onClose
	}: Props = $props();
</script>

<Dialog {open} onClose={onClose} size="sm">
	<DialogHeader>
		<h2 class="text-base font-semibold text-ink">
			{editingEsp ? 'Editar Especialidad' : 'Nueva Especialidad'}
		</h2>
	</DialogHeader>
	<form
		method="POST"
		action="?/guardarEspecialidad"
		use:enhance={() => {
			return ({ result }) => {
				if (result.type === 'success') {
					toastSuccess('Guardado', editingEsp ? 'Especialidad actualizada.' : 'Especialidad creada.');
					onClose();
					invalidateAll();
				}
			};
		}}
	>
		<DialogBody>
			{#if editingEsp}
				<input type="hidden" name="id" value={editingEsp.id} />
			{/if}
			<Input
				name="nombre"
				label="Nombre de la especialidad"
				bind:value={nombreInput}
				placeholder="Ej: Cardiología"
			/>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={onClose}>Cancelar</Button>
			<Button type="submit" variant="primary" size="md" disabled={!nombreInput.trim()}>
				{editingEsp ? 'Guardar cambios' : 'Crear especialidad'}
			</Button>
		</DialogFooter>
	</form>
</Dialog>
