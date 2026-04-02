import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';
import * as pacientesService from '$lib/server/pacientes.service.js';
import { assertActionPermission, requireDoctorId } from '$lib/server/rbac.js';

export const load: PageServerLoad = async ({ locals }) => {
	const doctorId = requireDoctorId(locals.user);
	const today = new Date();
	const dow = today.getDay() === 0 ? 7 : today.getDay();

	const [citas, doctor, disponibilidad] = await Promise.all([
		citasService.getCitasHoy(doctorId),
		doctoresService.getActiveDoctores().then((docs) => docs.find((d) => d.id === doctorId)),
		doctoresService.getDisponibilidad(doctorId, dow)
	]);

	citas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

	return {
		citas,
		disponibilidad,
		doctorId,
		doctorEspecialidadId: doctor?.especialidad_id ?? '',
		doctorNombre: doctor ? `${doctor.nombre} ${doctor.apellido}` : 'Doctor'
	};
};

export const actions: Actions = {
	marcarAtendida: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'marcarAtendida');
		const fd = await request.formData();
		const citaId = String(fd.get('citaId') ?? '').trim();
		if (!citaId) return fail(400, { error: 'ID de cita inválido' });

		await citasService.updateEstadoCita(citaId, 'atendida');
		return { success: true };
	},

	marcarNoAsistio: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'marcarNoAsistio');
		const fd = await request.formData();
		const citaId = String(fd.get('citaId') ?? '').trim();
		if (!citaId) return fail(400, { error: 'ID de cita inválido' });

		await citasService.updateEstadoCita(citaId, 'no_asistio');
		return { success: true, noAsistio: true };
	},

	buscarPacienteEmergencia: async ({ request }) => {
		const fd = await request.formData();
		const query = String(fd.get('query') ?? '').trim();
		if (!query) return fail(400, { error: 'Ingrese NHM o cédula' });

		// Auto-detect: numérico puro < 100000 → NHM, sino cédula
		const isNhm = /^\d+$/.test(query) && Number(query) < 100000;
		const paciente = isNhm
			? await pacientesService.findByNHM(Number(query))
			: await pacientesService.findByCedula(query);

		if (!paciente) return fail(404, { error: `No se encontró paciente con ${isNhm ? 'NHM' : 'cédula'} "${query}"` });
		return { pacienteFound: true, paciente: { id: paciente.id, nombre: paciente.nombre, apellido: paciente.apellido, nhm: paciente.nhm } };
	},

	citaEmergencia: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'citaEmergencia');
		const doctorId = requireDoctorId(locals.user);
		const fd = await request.formData();
		const pacienteId = String(fd.get('pacienteId') ?? '').trim();
		const motivo = String(fd.get('motivo') ?? '').trim();
		const especialidadId = String(fd.get('especialidadId') ?? '').trim();
		const horaInicio = String(fd.get('hora_inicio') ?? '').trim();
		const duracion = Number(fd.get('duracion') || 30);

		if (!pacienteId) return fail(400, { error: 'Paciente requerido' });

		const fecha = new Date().toISOString().slice(0, 10);

		// Calcular hora_fin desde hora_inicio + duración
		let hora = horaInicio;
		if (!hora) {
			const now = new Date();
			hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
		}
		const [h, m] = hora.split(':').map(Number);
		const finTotalMin = h * 60 + m + duracion;
		const horaFin = `${String(Math.floor(finTotalMin / 60)).padStart(2, '0')}:${String(finTotalMin % 60).padStart(2, '0')}`;

		const cita = await citasService.createCita({
			paciente_id: pacienteId,
			doctor_id: doctorId,
			especialidad_id: especialidadId,
			fecha,
			hora_inicio: hora,
			hora_fin: horaFin,
			duracion_min: duracion as 30 | 60,
			es_primera_vez: false,
			motivo_consulta: motivo || 'Consulta de emergencia',
			observaciones: 'Cita de emergencia / walk-in',
			created_by: 'doctor_emergencia'
		});

		return { success: true, emergencia: true, citaId: cita.id };
	}
};
