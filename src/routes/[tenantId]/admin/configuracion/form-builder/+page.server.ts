import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as schemasService from '$lib/server/schemas.service.js';
import * as especialidadesService from '$lib/server/especialidades.service.js';
import { assertActionPermission } from '$lib/server/rbac.js';
import type { MedicalFormSchema } from '$shared/types/form-schema.js';

export const load: PageServerLoad = async ({ url }) => {
	const specialtyName = url.searchParams.get('specialty') ?? '';

	const [especialidades, schema] = await Promise.all([
		especialidadesService.getAll(),
		specialtyName
			? schemasService.getFormSchema(specialtyName)
			: Promise.resolve(null)
	]);

	return { especialidades, schema, specialtyName };
};

export const actions: Actions = {
	guardarSchema: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'guardarSchema');
		const fd = await request.formData();
		const schemaJson = String(fd.get('schema') ?? '');

		let schema: MedicalFormSchema;
		try {
			schema = JSON.parse(schemaJson);
		} catch {
			return fail(400, { error: 'Schema inválido' });
		}

		if (!schema.specialtyName) {
			return fail(400, { error: 'Nombre de especialidad requerido' });
		}

		// Auto-generate ID if missing
		if (!schema.id) {
			const key = schema.specialtyName
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/\s+/g, '-')
				.replace(/[^a-z0-9-]/g, '');
			schema.id = `${key}-v${schema.version ?? '1'}`;
			schema.specialtyId = key;
		}

		await schemasService.saveSchema(schema);
		return { success: true };
	}
};
