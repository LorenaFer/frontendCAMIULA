import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as pacientesService from '$lib/server/pacientes.service.js';
import * as citasService from '$lib/server/citas.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q || q.length < 2) {
		return json({ categories: [] });
	}

	const [pacientes, citas, doctores] = await Promise.all([
		pacientesService.getPacientesPaginated({ search: q, page: 1, page_size: 5 }).catch(() => ({ items: [], pagination: { total: 0, page: 1, page_size: 5, pages: 0, has_next: false } })),
		citasService.getCitasByFilters({ search: q, page_size: 5 }).catch(() => ({ items: [], pagination: { total: 0, page: 1, page_size: 5, pages: 0, has_next: false } })),
		doctoresService.getActiveDoctores().catch(() => [])
	]);

	const categories = [];

	// Pacientes
	if (pacientes.items.length > 0) {
		categories.push({
			label: 'Pacientes',
			results: pacientes.items.map(p => ({
				id: p.id,
				title: `${p.nombre} ${p.apellido}`,
				subtitle: `NHM ${p.nhm} · ${p.cedula}`,
				href: `/patients/${p.id}`,
				tag: p.es_nuevo ? 'Nuevo' : undefined,
				tagVariant: 'warning'
			}))
		});
	}

	// Citas
	if (citas.items.length > 0) {
		categories.push({
			label: 'Citas',
			results: citas.items.slice(0, 5).map(c => ({
				id: c.id,
				title: `${c.paciente.nombre} ${c.paciente.apellido}`,
				subtitle: `${c.fecha} · ${c.hora_inicio} · ${c.doctor?.especialidad?.nombre ?? ''}`,
				href: `/analista/citas?search=${encodeURIComponent(q)}`,
				tag: c.estado === 'pendiente' ? 'Pendiente' : c.estado === 'atendida' ? 'Atendida' : c.estado,
				tagVariant: c.estado === 'atendida' ? 'success' : c.estado === 'cancelada' ? 'danger' : 'warning'
			}))
		});
	}

	// Doctores (filtro client-side por nombre)
	const filteredDocs = doctores.filter(d =>
		`${d.nombre} ${d.apellido}`.toLowerCase().includes(q.toLowerCase()) ||
		d.especialidad?.nombre?.toLowerCase().includes(q.toLowerCase())
	).slice(0, 5);

	if (filteredDocs.length > 0) {
		categories.push({
			label: 'Doctores',
			results: filteredDocs.map(d => ({
				id: d.id,
				title: `Dr. ${d.nombre} ${d.apellido}`,
				subtitle: d.especialidad?.nombre ?? 'Sin especialidad',
				href: `/analista/citas?doctor_id=${d.id}`
			}))
		});
	}

	return json({ categories });
};
