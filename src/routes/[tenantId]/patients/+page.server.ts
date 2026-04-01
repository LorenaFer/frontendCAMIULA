import type { PageServerLoad } from './$types';
import { getAllPacientes } from '$lib/server/pacientes.service';
import * as citasService from '$lib/server/citas.service';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const allPacientes = await getAllPacientes();

	// Filtrar por búsqueda
	const filtered = search
		? allPacientes.filter((p) =>
				`${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
				p.cedula.toLowerCase().includes(search.toLowerCase()) ||
				String(p.nhm).includes(search)
			)
		: allPacientes;

	// Stats globales
	const { items: allCitas } = await citasService.getCitasByFilters({ page_size: 200 });

	const stats = {
		totalPacientes: allPacientes.length,
		pacientesNuevos: allPacientes.filter((p) => p.es_nuevo).length,
		totalCitas: allCitas.length,
		citasAtendidas: allCitas.filter((c) => c.estado === 'atendida').length,
		citasPendientes: allCitas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length
	};

	// Mapear pacientes con su conteo de citas
	const patients = filtered.map((p) => {
		const citasPaciente = allCitas.filter((c) => c.paciente_id === p.id);
		return {
			id: p.id,
			nhm: p.nhm,
			cedula: p.cedula,
			nombre: p.nombre,
			apellido: p.apellido,
			edad: p.edad,
			sexo: p.sexo,
			relacion_univ: p.relacion_univ,
			es_nuevo: p.es_nuevo,
			tipo_sangre: p.datos_medicos?.tipo_sangre,
			alergias: p.datos_medicos?.alergias ?? [],
			totalCitas: citasPaciente.length,
			ultimaCita: citasPaciente.sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha
		};
	});

	return { patients, stats, search };
};
