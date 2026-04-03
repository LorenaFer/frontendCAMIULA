import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as historiasService from '$lib/server/historias.service.js';
import * as prescriptionsService from '$lib/server/inventory/prescriptions.service.js';
import { mockFlags } from '$lib/server/mock-flags.js';
import { mockPacientes } from '$lib/server/mock/data.js';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return { citas: [], historias: [], recetas: [] };

	let pacienteId = user.id;

	if (mockFlags.pacientes) {
		const pacienteMock = mockPacientes.find(
			(p) => `${p.nombre} ${p.apellido}` === user.name
		);
		if (!pacienteMock) return { citas: [], historias: [], recetas: [], pacienteNombre: user.name };
		pacienteId = pacienteMock.id;
	}

	try {
		const [{ items: todasLasCitas }, historias, recetas] = await Promise.all([
			citasService.getCitasByPatientId(pacienteId),
			historiasService.findByPaciente(pacienteId, { limit: 20 }).catch(() => []),
			prescriptionsService.getPrescriptionsByPatient(pacienteId).catch(() => [])
		]);

		const citasPaciente = todasLasCitas
			.sort((a, b) => {
				const dateComp = b.fecha.localeCompare(a.fecha);
				if (dateComp !== 0) return dateComp;
				return a.hora_inicio.localeCompare(b.hora_inicio);
			});

		return {
			citas: citasPaciente,
			historias,
			recetas,
			pacienteNombre: user.name
		};
	} catch {
		return { citas: [], historias: [], recetas: [], pacienteNombre: user.name };
	}
};

export const actions: Actions = {
	cancelarCita: async ({ request }) => {
		const fd = await request.formData();
		const citaId = String(fd.get('citaId') ?? '');
		if (!citaId) return fail(400, { error: 'ID de cita requerido' });

		try {
			await citasService.updateEstadoCita(citaId, 'cancelada');
			return { success: true, action: 'cancelled' };
		} catch {
			return fail(500, { error: 'Error al cancelar la cita' });
		}
	}
};
