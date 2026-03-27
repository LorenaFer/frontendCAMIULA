import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as especialidadesService from '$lib/server/especialidades.service.js';
import * as schemasService from '$lib/server/schemas.service.js';
import { assertActionPermission } from '$lib/server/rbac.js';

export const load: PageServerLoad = async () => {
	const [especialidades, schemas] = await Promise.all([
		especialidadesService.getAll(),
		schemasService.getAllSchemas()
	]);

	return { especialidades, schemas };
};

export const actions: Actions = {
	guardarEspecialidad: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'guardarEspecialidad');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '').trim();
		const nombre = String(fd.get('nombre') ?? '').trim();

		if (!nombre) return fail(400, { error: 'El nombre es obligatorio' });

		if (id) {
			await especialidadesService.update(id, { nombre });
		} else {
			await especialidadesService.create({ nombre });
		}
		return { success: true };
	},

	toggleEspecialidad: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'toggleEspecialidad');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '').trim();
		if (!id) return fail(400, { error: 'ID inválido' });

		await especialidadesService.toggleActive(id);
		return { success: true };
	}
};
