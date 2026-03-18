import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as doctoresService from '$lib/server/doctores.service.js';

// Mock: el doctor autenticado es el doctor con id=1
const MOCK_DOCTOR_ID = 1;

export const load: PageServerLoad = async () => {
	const [bloques, doctor] = await Promise.all([
		doctoresService.getAllDisponibilidad(MOCK_DOCTOR_ID),
		doctoresService.getActiveDoctores().then((docs) => docs.find((d) => d.id === MOCK_DOCTOR_ID))
	]);

	return {
		bloques,
		doctorId: MOCK_DOCTOR_ID,
		doctorNombre: doctor ? `${doctor.nombre} ${doctor.apellido}` : 'Doctor'
	};
};

export const actions: Actions = {
	agregar: async ({ request }) => {
		const fd = await request.formData();
		const day_of_week = parseInt(String(fd.get('day_of_week') ?? ''), 10);
		const hora_inicio = String(fd.get('hora_inicio') ?? '').trim();
		const hora_fin = String(fd.get('hora_fin') ?? '').trim();
		const duracion_slot = parseInt(String(fd.get('duracion_slot') ?? '30'), 10);

		if (![1, 2, 3, 4, 5].includes(day_of_week)) {
			return fail(400, { error: 'Día de la semana inválido' });
		}
		if (!hora_inicio || !hora_fin) {
			return fail(400, { error: 'Hora de inicio y fin son requeridas' });
		}
		if (hora_inicio >= hora_fin) {
			return fail(400, { error: 'La hora de inicio debe ser menor a la hora de fin' });
		}
		if (![15, 20, 30, 45, 60].includes(duracion_slot)) {
			return fail(400, { error: 'Duración de slot inválida' });
		}

		// Verificar solapamiento con bloques existentes
		const existentes = await doctoresService.getDisponibilidad(MOCK_DOCTOR_ID, day_of_week);
		const solapa = existentes.some(
			(b) => hora_inicio < b.hora_fin && hora_fin > b.hora_inicio
		);
		if (solapa) {
			return fail(400, { error: 'El bloque se solapa con uno existente' });
		}

		await doctoresService.createDisponibilidad({
			doctor_id: MOCK_DOCTOR_ID,
			day_of_week: day_of_week as 1 | 2 | 3 | 4 | 5,
			hora_inicio,
			hora_fin,
			duracion_slot
		});

		return { success: true, message: 'Bloque agregado exitosamente' };
	},

	eliminar: async ({ request }) => {
		const fd = await request.formData();
		const bloqueId = parseInt(String(fd.get('bloqueId') ?? ''), 10);

		if (isNaN(bloqueId)) {
			return fail(400, { error: 'ID de bloque inválido' });
		}

		await doctoresService.deleteDisponibilidad(MOCK_DOCTOR_ID, bloqueId);
		return { success: true, message: 'Bloque eliminado' };
	},

	actualizar: async ({ request }) => {
		const fd = await request.formData();
		const bloqueId = parseInt(String(fd.get('bloqueId') ?? ''), 10);
		const hora_inicio = String(fd.get('hora_inicio') ?? '').trim() || undefined;
		const hora_fin = String(fd.get('hora_fin') ?? '').trim() || undefined;

		if (isNaN(bloqueId)) {
			return fail(400, { error: 'ID de bloque inválido' });
		}
		if (hora_inicio && hora_fin && hora_inicio >= hora_fin) {
			return fail(400, { error: 'La hora de inicio debe ser menor a la hora de fin' });
		}

		await doctoresService.updateDisponibilidad(MOCK_DOCTOR_ID, bloqueId, { hora_inicio, hora_fin });
		return { success: true, message: 'Bloque actualizado' };
	}
};
