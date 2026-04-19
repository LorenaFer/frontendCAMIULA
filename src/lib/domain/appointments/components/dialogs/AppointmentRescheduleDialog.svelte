<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { CitaConPaciente, TimeSlot } from '$domain/appointments/types.js';
	import type { DoctorOption } from '$domain/staff/types.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import DoctorAvailabilityCalendar from '$domain/appointments/components/widgets/DoctorAvailabilityCalendar.svelte';
	import TimeSlotPicker from '$domain/appointments/components/widgets/TimeSlotPicker.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	let {
		cita,
		doctores,
		onClose,
		loadSlots
	}: {
		cita: CitaConPaciente;
		doctores: DoctorOption[];
		onClose: () => void;
		loadSlots: (
			doctorId: string,
			fecha: string,
			esNuevo: boolean
		) => Promise<{ slots: TimeSlot[]; duracion: 30 | 60 }>;
	} = $props();

	let rescheduleDate = $state('');
	let rescheduleSlots = $state<TimeSlot[]>([]);
	let rescheduleSelectedSlot = $state('');
	let rescheduleSlotDuracion = $state<30 | 60>(30);
	let rescheduleLoadingSlots = $state(false);

	const rescheduleMinDate = $derived(() => {
		const d = new Date();
		d.setDate(d.getDate() + 2);
		return d.toISOString().slice(0, 10);
	});

	const rescheduleDoctor = $derived(
		doctores.find((d: DoctorOption) => d.id === cita.doctor_id) ?? null
	);

	const rescheduleAvailableDates = $derived.by(() => {
		if (!rescheduleDoctor || !rescheduleDoctor.dias_trabajo?.length) return [];
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1;
		const daysInMonth = new Date(year, month, 0).getDate();
		const mo = String(month).padStart(2, '0');
		const minD = rescheduleMinDate();
		const dates: string[] = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const fecha = `${year}-${mo}-${String(d).padStart(2, '0')}`;
			if (fecha < minD) continue;
			const dow = new Date(fecha + 'T12:00:00').getDay();
			const dayOfWeek = dow === 0 ? 7 : dow;
			if (rescheduleDoctor.dias_trabajo.includes(dayOfWeek)) dates.push(fecha);
		}
		return dates;
	});

	async function handleLoadSlots(date: string) {
		rescheduleDate = date;
		rescheduleSelectedSlot = '';
		rescheduleSlots = [];

		rescheduleLoadingSlots = true;
		try {
			const result = await loadSlots(cita.doctor_id, date, cita.es_primera_vez);
			rescheduleSlots = result.slots ?? [];
			rescheduleSlotDuracion = result.duracion ?? 30;
		} catch {
			/* ignore */
		} finally {
			rescheduleLoadingSlots = false;
		}
	}

	function formatFecha(fecha: string) {
		const [y, m, d] = fecha.split('-');
		return `${d}/${m}/${y}`;
	}

	const selectedSlotObj = $derived(rescheduleSlots.find((s) => s.hora_inicio === rescheduleSelectedSlot));
</script>

<Dialog open={true} {onClose} size="lg">
	<DialogHeader>
		<p class="text-sm text-ink-muted font-normal">{cita.paciente.nombre} {cita.paciente.apellido} — Dr. {cita.doctor.nombre} {cita.doctor.apellido}</p>
		<h2 class="text-base font-semibold text-ink">Reagendar cita</h2>
	</DialogHeader>
	<form
		method="POST"
		action="?/reagendarCita"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					const nombre = cita?.paciente?.nombre ?? '';
					const fecha = rescheduleDate;
					onClose();
					await invalidateAll();
					toastSuccess('Cita reagendada', `La cita de ${nombre} fue movida al ${fecha}.`);
				} else {
					toastError('Error al reagendar', 'No se pudo reagendar la cita. Intente nuevamente.');
				}
			};
		}}
	>
		<input type="hidden" name="citaId" value={cita.id} />
		<input type="hidden" name="fecha" value={rescheduleDate} />
		<input type="hidden" name="hora_inicio" value={rescheduleSelectedSlot} />
		<input type="hidden" name="hora_fin" value={selectedSlotObj?.hora_fin ?? ''} />
		<input type="hidden" name="duracion" value={rescheduleSlotDuracion} />

		<DialogBody>
			<div class="space-y-4">
				<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3 text-sm">
					<p class="text-ink-muted">Cita actual: <strong class="text-ink">{formatFecha(cita.fecha)} · {cita.hora_inicio}–{cita.hora_fin}</strong></p>
				</div>

					<div>
					<p class="text-sm font-semibold text-ink mb-2">Seleccione nueva fecha</p>
					<DoctorAvailabilityCalendar
						year={new Date().getFullYear()}
						month={new Date().getMonth() + 1}
						availableDates={rescheduleAvailableDates}
						minDate={rescheduleMinDate()}
						selected={rescheduleDate}
						onSelect={handleLoadSlots}
						onMonthChange={() => {}}
					/>
				</div>

				{#if rescheduleDate}
					<div>
						<p class="text-sm font-semibold text-ink mb-2">Seleccione horario {rescheduleLoadingSlots ? '(cargando...)' : ''}</p>
						<TimeSlotPicker
							slots={rescheduleSlots}
							selected={rescheduleSelectedSlot}
							onSelect={(slot: TimeSlot) => { rescheduleSelectedSlot = slot.hora_inicio; }}
						/>
					</div>
				{/if}
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={onClose}>Cancelar</Button>
			<Button type="submit" variant="primary" size="md" disabled={!rescheduleSelectedSlot}>
				Confirmar reagendamiento
			</Button>
		</DialogFooter>
	</form>
</Dialog>
