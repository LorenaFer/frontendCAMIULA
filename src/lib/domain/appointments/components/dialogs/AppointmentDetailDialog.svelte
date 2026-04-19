<script lang="ts">
	import type { CitaConPaciente } from '$domain/appointments/types.js';
	import AppointmentStatusBadge from '$domain/appointments/components/widgets/AppointmentStatusBadge.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';

	let {
		cita,
		onClose,
		onReschedule,
		onCancel
	}: {
		cita: CitaConPaciente;
		onClose: () => void;
		onReschedule: (cita: CitaConPaciente) => void;
		onCancel: (cita: CitaConPaciente) => void;
	} = $props();

	function formatFecha(fecha: string) {
		const [y, m, d] = fecha.split('-');
		return `${d}/${m}/${y}`;
	}
</script>

<Dialog open={true} {onClose} size="md">
	<DialogHeader>
		<p class="text-sm text-ink-muted font-normal">{formatFecha(cita.fecha)} · {cita.hora_inicio}–{cita.hora_fin}</p>
		<h2 class="text-base font-semibold text-ink">Detalle de cita</h2>
	</DialogHeader>
	<DialogBody>
		<div class="grid grid-cols-2 gap-4 text-sm">
			<div>
				<p class="text-ink-muted">Paciente</p>
				<p class="font-medium text-ink">{cita.paciente.nombre} {cita.paciente.apellido}</p>
				<p class="text-xs text-ink-muted">NHM {cita.paciente.nhm ?? '—'} · {cita.paciente.cedula}</p>
			</div>
			<div>
				<p class="text-ink-muted">Estado</p>
				<AppointmentStatusBadge status={cita.estado} />
			</div>
			<div>
				<p class="text-ink-muted">Doctor</p>
				<p class="font-medium text-ink">Dr. {cita.doctor.nombre} {cita.doctor.apellido}</p>
				<p class="text-xs text-ink-muted">{cita.doctor.especialidad?.nombre ?? '—'}</p>
			</div>
			<div>
				<p class="text-ink-muted">Duración</p>
				<p class="font-medium text-ink">{cita.duracion_min} min{cita.es_primera_vez ? ' · Primera vez' : ''}</p>
			</div>
			{#if cita.motivo_consulta}
				<div class="col-span-2">
					<p class="text-ink-muted">Motivo</p>
					<p class="text-ink">{cita.motivo_consulta}</p>
				</div>
			{/if}
			{#if cita.observaciones}
				<div class="col-span-2">
					<p class="text-ink-muted">Observaciones</p>
					<p class="text-ink">{cita.observaciones}</p>
				</div>
			{/if}
		</div>
	</DialogBody>
	<DialogFooter>
		<Button type="button" variant="ghost" size="md" onclick={onClose}>Cerrar</Button>
		{#if cita.estado === 'pendiente' || cita.estado === 'confirmada'}
			<Button type="button" variant="soft" size="md" onclick={() => onReschedule(cita)}>Reagendar</Button>
			<Button type="button" variant="danger" size="md" onclick={() => onCancel(cita)}>Cancelar cita</Button>
		{/if}
	</DialogFooter>
</Dialog>
