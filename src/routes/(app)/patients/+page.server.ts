import type { PageServerLoad } from './$types';
import * as pacientesService from '$lib/server/pacientes.service';
import * as citasService from '$lib/server/citas.service';

const VALID_PAGE_SIZES = [10, 25, 50, 100];

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
	const rawPageSize = Number(url.searchParams.get('page_size') ?? '25');
	const PAGE_SIZE = VALID_PAGE_SIZES.includes(rawPageSize) ? rawPageSize : 25;

	// Búsqueda y paginación server-side (el backend soporta `search`)
	// Si hay búsqueda activa, también traer total global para el KPI
	const [result, globalTotal] = await Promise.all([
		pacientesService.getPacientesPaginated({
			search: search || undefined,
			page,
			page_size: PAGE_SIZE
		}),
		search ? pacientesService.getPacientesTotal() : Promise.resolve(0)
	]);

	// Stats globales — totalPacientes siempre muestra el global, no el filtrado
	const stats = {
		totalPacientes: search ? globalTotal : result.pagination.total,
		pacientesNuevos: 0,
		totalCitas: 0,
		citasAtendidas: 0,
		citasPendientes: 0
	};

	// Cargar stats de citas sin traer todas las citas
	try {
		const citasStats = await citasService.getStats({});
		stats.totalCitas = citasStats.total;
		stats.citasAtendidas = citasStats.byStatus['atendida'] ?? 0;
		stats.citasPendientes = (citasStats.byStatus['pendiente'] ?? 0) + (citasStats.byStatus['confirmada'] ?? 0);
	} catch { /* silenciar */ }

	// Mapear los pacientes de la página actual
	const patients = result.items.map((p) => ({
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
		alergias: p.datos_medicos?.alergias ?? []
	}));

	return {
		patients,
		stats,
		search,
		pagination: result.pagination
	};
};
