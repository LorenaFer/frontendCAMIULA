import type { PageServerLoad } from './$types';
import * as citasService from '$lib/server/citas.service.js';
import { mockPacientes } from '$lib/server/mock/data.js';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return { citas: [] };

	// Mock: buscar paciente por nombre del usuario logueado
	// En producción esto vendría de la sesión con el paciente_id real
	const pacienteMock = mockPacientes.find(
		(p) => `${p.nombre} ${p.apellido}` === user.name
	);

	if (!pacienteMock) return { citas: [], pacienteNombre: user.name };

	// Obtener TODAS las citas del paciente (no solo hoy)
	const { items: todasLasCitas } = await citasService.getCitasByFilters({
		search: pacienteMock.cedula,
		page_size: 100
	});

	// Filtrar solo las del paciente y ordenar por fecha desc
	const citasPaciente = todasLasCitas
		.filter((c) => c.paciente_id === pacienteMock.id)
		.sort((a, b) => {
			const dateComp = b.fecha.localeCompare(a.fecha);
			if (dateComp !== 0) return dateComp;
			return a.hora_inicio.localeCompare(b.hora_inicio);
		});

	return {
		citas: citasPaciente,
		pacienteNombre: `${pacienteMock.nombre} ${pacienteMock.apellido}`
	};
};
