import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';

// Mock: el doctor autenticado es el doctor con id=1 (Medicina General)
// Cuando se implemente auth real, esto vendrá de la sesión.
const MOCK_DOCTOR_ID = 1;

export const load: PageServerLoad = async () => {
	const citas = await citasService.getCitasHoy(MOCK_DOCTOR_ID);

	// Ordenar por hora_inicio
	citas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

	return { citas, doctorId: MOCK_DOCTOR_ID };
};

export const actions: Actions = {
	marcarAtendida: async ({ request }) => {
		const fd = await request.formData();
		const citaId = parseInt(String(fd.get('citaId') ?? ''), 10);
		if (isNaN(citaId)) return fail(400, { error: 'ID de cita inválido' });

		await citasService.updateEstadoCita(citaId, 'atendida');
		return { success: true };
	}
};
