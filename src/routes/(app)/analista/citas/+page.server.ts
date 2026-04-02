import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';
import * as exportService from '$lib/server/export.service.js';
import { computeAvailableSlots } from '$lib/server/slots.service.js';
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

	const [citasRes, doctores, especialidades, stats] = await Promise.all([
		citasService.getCitasByFilters(filters),
		doctoresService.getDoctorOptions(),
		doctoresService.getEspecialidades(),
		citasService.getStats(filters)
	]);

	return { citas: citasRes, doctores, especialidades, filters, stats };
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

	obtenerSlots: async ({ request }) => {
		const fd = await request.formData();
		const doctorId = String(fd.get('doctorId') ?? '');
		const fecha = String(fd.get('fecha') ?? '');
		const esNuevo = fd.get('esNuevo') === 'true';
		if (!doctorId || !fecha) return fail(400, { error: 'Datos incompletos' });

		try {
			const fechaDate = new Date(fecha + 'T00:00:00');
			const dayOfWeek = fechaDate.getDay() === 0 ? 7 : fechaDate.getDay();

			const [disponibilidad, citasExistentes] = await Promise.all([
				doctoresService.getDisponibilidad(doctorId, dayOfWeek),
				citasService.getCitasByDoctorFecha(doctorId, fecha)
			]);

			const duracion: 30 | 60 = esNuevo ? 60 : 30;
			const slots = computeAvailableSlots(disponibilidad, citasExistentes, duracion);
			return { slots, duracion };
		} catch {
			return fail(500, { error: 'Error al obtener horarios' });
		}
	},

	reagendarCita: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'cancelarCita');
		const fd = await request.formData();
		const citaId = String(fd.get('citaId') ?? '');
		const nuevaFecha = String(fd.get('fecha') ?? '');
		const nuevaHoraInicio = String(fd.get('hora_inicio') ?? '');
		const nuevaHoraFin = String(fd.get('hora_fin') ?? '');
		const duracion = Number(fd.get('duracion') || 30);

		if (!citaId || !nuevaFecha || !nuevaHoraInicio || !nuevaHoraFin) {
			return fail(400, { error: 'Todos los campos son requeridos' });
		}

		try {
			// Obtener la cita original para copiar datos
			const citaOriginal = await citasService.getCitaById(citaId);
			if (!citaOriginal) return fail(404, { error: 'Cita no encontrada' });

			// Cancelar la cita original
			await citasService.updateEstadoCita(citaId, 'cancelada');

			// Crear nueva cita con mismos datos pero nueva fecha/hora
			await citasService.createCita({
				paciente_id: citaOriginal.paciente_id,
				doctor_id: citaOriginal.doctor_id,
				especialidad_id: citaOriginal.especialidad_id,
				fecha: nuevaFecha,
				hora_inicio: nuevaHoraInicio,
				hora_fin: nuevaHoraFin,
				duracion_min: duracion as 30 | 60,
				es_primera_vez: citaOriginal.es_primera_vez,
				motivo_consulta: citaOriginal.motivo_consulta,
				observaciones: `Reagendada desde cita del ${citaOriginal.fecha}`,
				created_by: 'analista_reagendar'
			});

			return { success: true, action: 'rescheduled' };
		} catch {
			return fail(500, { error: 'Error al reagendar la cita' });
		}
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
