import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';

const MOCK_DOCTOR_ID = 1;

export const load: PageServerLoad = async () => {
	const today = new Date();
	const dow = today.getDay() === 0 ? 7 : today.getDay();

	const [citas, doctor, disponibilidad] = await Promise.all([
		citasService.getCitasHoy(MOCK_DOCTOR_ID),
		doctoresService.getActiveDoctores().then((docs) => docs.find((d) => d.id === MOCK_DOCTOR_ID)),
		doctoresService.getDisponibilidad(MOCK_DOCTOR_ID, dow)
	]);

	citas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

	return {
		citas,
		disponibilidad,
		doctorId: MOCK_DOCTOR_ID,
		doctorEspecialidadId: doctor?.especialidad_id ?? 1,
		doctorNombre: doctor ? `${doctor.nombre} ${doctor.apellido}` : 'Doctor'
	};
};

export const actions: Actions = {
	marcarAtendida: async ({ request }) => {
		const fd = await request.formData();
		const citaId = parseInt(String(fd.get('citaId') ?? ''), 10);
		if (isNaN(citaId)) return fail(400, { error: 'ID de cita inválido' });

		await citasService.updateEstadoCita(citaId, 'atendida');
		return { success: true };
	},

	marcarNoAsistio: async ({ request }) => {
		const fd = await request.formData();
		const citaId = parseInt(String(fd.get('citaId') ?? ''), 10);
		if (isNaN(citaId)) return fail(400, { error: 'ID de cita inválido' });

		await citasService.updateEstadoCita(citaId, 'no_asistio');
		return { success: true, noAsistio: true };
	},

	citaEmergencia: async ({ request }) => {
		const fd = await request.formData();
		const pacienteId = parseInt(String(fd.get('pacienteId') ?? ''), 10);
		const motivo = String(fd.get('motivo') ?? '').trim();

		if (isNaN(pacienteId)) return fail(400, { error: 'Paciente inválido' });

		const now = new Date();
		const fecha = now.toISOString().slice(0, 10);
		const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
		const [h, m] = hora.split(':').map(Number);
		const finMin = m + 30;
		const horaFin = `${String(h + Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

		const cita = await citasService.createCita({
			paciente_id: pacienteId,
			doctor_id: MOCK_DOCTOR_ID,
			especialidad_id: 1,
			fecha,
			hora_inicio: hora,
			hora_fin: horaFin,
			duracion_min: 30,
			es_primera_vez: false,
			motivo_consulta: motivo || 'Consulta de emergencia',
			observaciones: 'Cita de emergencia / walk-in',
			created_by: 'doctor_emergencia'
		});

		return { success: true, emergencia: true, citaId: cita.id };
	}
};
