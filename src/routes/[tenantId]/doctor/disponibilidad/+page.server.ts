import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as doctoresService from '$lib/server/doctores.service.js';
import { assertActionPermission, requireDoctorId } from '$lib/server/rbac.js';

export const load: PageServerLoad = async ({ locals }) => {
	const doctorId = requireDoctorId(locals.user);

	const [bloques, doctor] = await Promise.all([
		doctoresService.getAllDisponibilidad(doctorId),
		doctoresService.getActiveDoctores().then((docs) => docs.find((d) => d.id === doctorId))
	]);

	return {
		bloques,
		doctorId,
		doctorNombre: doctor ? `${doctor.nombre} ${doctor.apellido}` : 'Doctor'
	};
};

export const actions: Actions = {
	agregar: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'agregar');
		const doctorId = requireDoctorId(locals.user);
		const fd = await request.formData();
		const day_of_week = parseInt(String(fd.get('day_of_week') ?? ''), 10);
		const hora_inicio = String(fd.get('hora_inicio') ?? '').trim();
		const hora_fin = String(fd.get('hora_fin') ?? '').trim();
		const duracion_slot = parseInt(String(fd.get('duracion_slot') ?? '30'), 10);

		if (![1, 2, 3, 4, 5].includes(day_of_week)) return fail(400, { error: 'Día de la semana inválido' });
		if (!hora_inicio || !hora_fin) return fail(400, { error: 'Hora de inicio y fin son requeridas' });
		if (hora_inicio >= hora_fin) return fail(400, { error: 'La hora de inicio debe ser menor a la hora de fin' });
		if (![15, 20, 30, 45, 60].includes(duracion_slot)) return fail(400, { error: 'Duración de slot inválida' });

		const existentes = await doctoresService.getDisponibilidad(doctorId, day_of_week);
		const solapa = existentes.some((b) => hora_inicio < b.hora_fin && hora_fin > b.hora_inicio);
		if (solapa) return fail(400, { error: 'El bloque se solapa con uno existente' });

		await doctoresService.createDisponibilidad({
			doctor_id: doctorId,
			day_of_week: day_of_week as 1 | 2 | 3 | 4 | 5,
			hora_inicio,
			hora_fin,
			duracion_slot
		});

		return { success: true, message: 'Bloque agregado exitosamente' };
	},

	eliminar: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'eliminar');
		const doctorId = requireDoctorId(locals.user);
		const fd = await request.formData();
		const bloqueId = String(fd.get('bloqueId') ?? '').trim();
		if (!bloqueId) return fail(400, { error: 'ID de bloque inválido' });

		await doctoresService.deleteDisponibilidad(doctorId, bloqueId);
		return { success: true, message: 'Bloque eliminado' };
	},

	actualizar: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'actualizar');
		const doctorId = requireDoctorId(locals.user);
		const fd = await request.formData();
		const bloqueId = String(fd.get('bloqueId') ?? '').trim();
		const hora_inicio = String(fd.get('hora_inicio') ?? '').trim() || undefined;
		const hora_fin = String(fd.get('hora_fin') ?? '').trim() || undefined;

		if (!bloqueId) return fail(400, { error: 'ID de bloque inválido' });
		if (hora_inicio && hora_fin && hora_inicio >= hora_fin) return fail(400, { error: 'La hora de inicio debe ser menor a la hora de fin' });

		await doctoresService.updateDisponibilidad(doctorId, bloqueId, { hora_inicio, hora_fin });
		return { success: true, message: 'Bloque actualizado' };
	}
};
