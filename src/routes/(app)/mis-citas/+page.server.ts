import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as historiasService from '$lib/server/historias.service.js';
import * as prescriptionsService from '$lib/server/inventory/prescriptions.service.js';
import { mockPacientes } from '$lib/server/mock/data.js';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return { citas: [], historias: [], recetas: [] };

	const pacienteMock = mockPacientes.find(
		(p) => `${p.nombre} ${p.apellido}` === user.name
	);

	if (!pacienteMock) return { citas: [], historias: [], recetas: [], pacienteNombre: user.name };

	const [{ items: todasLasCitas }, historias, recetas] = await Promise.all([
		citasService.getCitasByFilters({ search: pacienteMock.cedula, page_size: 100 }),
		historiasService.findByPaciente(pacienteMock.id, { limit: 20 }),
		prescriptionsService.getPrescriptionsByPatient(pacienteMock.id)
	]);

	const citasPaciente = todasLasCitas
		.filter((c) => c.paciente_id === pacienteMock.id)
		.sort((a, b) => {
			const dateComp = b.fecha.localeCompare(a.fecha);
			if (dateComp !== 0) return dateComp;
			return a.hora_inicio.localeCompare(b.hora_inicio);
		});

	return {
		citas: citasPaciente,
		historias,
		recetas,
		pacienteNombre: `${pacienteMock.nombre} ${pacienteMock.apellido}`
	};
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
