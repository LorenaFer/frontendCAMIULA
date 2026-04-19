<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { CitaConPaciente } from '$domain/appointments/types.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import { toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let {
		cita,
		onClose
	}: {
		cita: CitaConPaciente;
		onClose: () => void;
	} = $props();

	function formatFecha(fecha: string) {
		const [y, m, d] = fecha.split('-');
		return `${d}/${m}/${y}`;
	}
</script>

<Dialog open={true} {onClose} size="sm">
	<DialogHeader>
		<h2 class="text-base font-semibold text-ink">Cancelar cita</h2>
	</DialogHeader>
	<form
		method="POST"
		action="?/cancelarCita"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					const nombre = cita?.paciente?.nombre ?? '';
					onClose();
					await invalidateAll();
					toastWarning('Cita cancelada', `La cita de ${nombre} fue cancelada correctamente.`);
				} else {
					toastError('Error al cancelar', 'No se pudo cancelar la cita. Intente nuevamente.');
				}
			};
		}}
	>
		<input type="hidden" name="citaId" value={cita.id} />
		<DialogBody>
			<p class="text-sm text-ink mb-3">¿Está seguro de que desea cancelar esta cita?</p>
			<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3 space-y-1 text-sm">
				<p class="font-medium text-ink">{cita.paciente.nombre} {cita.paciente.apellido}</p>
				<p class="text-ink-muted">{formatFecha(cita.fecha)} · {cita.hora_inicio}–{cita.hora_fin}</p>
				<p class="text-ink-muted">Dr. {cita.doctor.nombre} {cita.doctor.apellido} — {cita.doctor.especialidad?.nombre}</p>
			</div>
			<p class="text-sm text-honey-700 dark:text-honey-400 mt-3">Esta acción no se puede deshacer.</p>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={onClose}>No cancelar</Button>
			<Button type="submit" variant="danger" size="md">Sí, cancelar cita</Button>
		</DialogFooter>
	</form>
</Dialog>
