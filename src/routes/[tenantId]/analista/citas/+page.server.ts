import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';
import * as exportService from '$lib/server/export.service.js';
import type { AppointmentFilters, CitaEstado } from '$shared/types/appointments.js';
import { assertActionPermission } from '$lib/server/rbac.js';

export const load: PageServerLoad = async ({ url }) => {
	const filters: AppointmentFilters = {
		fecha: url.searchParams.get('fecha') ?? undefined,
		doctor_id: url.searchParams.get('doctor_id') ?? undefined,
		especialidad_id: url.searchParams.get('especialidad_id') ?? undefined,
		estado: (url.searchParams.get('estado') as CitaEstado) ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		page: Number(url.searchParams.get('page') ?? '1'),
		page_size: 25
	};

	const [citasRes, doctores, especialidades] = await Promise.all([
		citasService.getCitasByFilters(filters),
		doctoresService.getDoctorOptions(),
		doctoresService.getEspecialidades()
	]);

	return { citas: citasRes, doctores, especialidades, filters };
};

export const actions: Actions = {
	cancelarCita: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'cancelarCita');
		const fd = await request.formData();
		const citaId = String(fd.get('citaId') ?? '').trim();
		if (!citaId) return fail(400, { error: 'ID de cita inválido' });

		await citasService.updateEstadoCita(citaId, 'cancelada');
		return { success: true };
	},

	exportarExcel: async ({ url, locals }) => {
		assertActionPermission(locals.user, 'exportarExcel');
		const filters: AppointmentFilters = {
			fecha: url.searchParams.get('fecha') ?? undefined,
			doctor_id: url.searchParams.get('doctor_id') ?? undefined,
			estado: (url.searchParams.get('estado') as CitaEstado) ?? undefined,
			page_size: 10_000 // exportar todo
		};

		const { items: citas } = await citasService.getCitasByFilters(filters);
		const buffer = await exportService.toExcel(citas);
		const filename = exportService.getExportFilename();

		return new Response(buffer as BodyInit, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}
};
