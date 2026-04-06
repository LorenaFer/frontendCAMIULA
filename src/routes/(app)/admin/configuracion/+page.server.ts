import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as especialidadesService from '$lib/server/staff/specialties.service.js';
import * as schemasService from '$lib/server/medical-records/schemas.service.js';
import * as usersService from '$lib/server/admin/users.service.js';
import { assertActionPermission } from '$lib/server/rbac.js';

export const load: PageServerLoad = async ({ url }) => {
	const userPage = Number(url.searchParams.get('user_page') ?? 1);
	const userPageSize = [10, 25, 50].includes(Number(url.searchParams.get('user_page_size'))) ? Number(url.searchParams.get('user_page_size')) : 25;

	const [especialidades, schemas, usersResult] = await Promise.all([
		especialidadesService.getAll().catch(() => []),
		schemasService.getAllSchemas().catch(() => []),
		usersService.getUsers(userPage, userPageSize, { staffOnly: true }).catch(() => ({ items: [], pagination: { total: 0, page: 1, page_size: 25, pages: 0, has_next: false } }))
	]);

	return { especialidades, schemas, users: usersResult };
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
