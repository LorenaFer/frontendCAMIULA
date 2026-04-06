import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as schemasService from '$lib/server/medical-records/schemas.service.js';
import * as especialidadesService from '$lib/server/staff/specialties.service.js';
import { assertActionPermission } from '$lib/server/rbac.js';
import type { MedicalFormSchema } from '$domain/medical-records/form-schema.js';

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
	guardarSchema: async ({ request, url, locals }) => {
		assertActionPermission(locals.user, 'guardarSchema');
		const fd = await request.formData();
		const schemaJson = String(fd.get('schema') ?? '');

		// El specialty original viene del query param, no del schema cargado (que puede ser fallback)
		const originalSpecialty = url.searchParams.get('specialty') ?? '';

		let schema: MedicalFormSchema;
		try {
			schema = JSON.parse(schemaJson);
		} catch {
			return fail(400, { error: 'Schema inválido' });
		}

		// Forzar specialtyId y specialtyName del query param original
		const specialtyName = originalSpecialty || schema.specialtyName;
		if (!specialtyName) {
			return fail(400, { error: 'Nombre de especialidad requerido' });
		}

		const key = specialtyName
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');

		schema.specialtyId = key;
		schema.specialtyName = specialtyName;
		schema.id = `${key}-v${schema.version ?? '1'}`;

		try {
			await schemasService.saveSchema(schema);
			return { success: true };
		} catch (e: unknown) {
			const err = e as { userMessage?: string; message?: string };
			return fail(500, { error: err.userMessage ?? err.message ?? 'Error al guardar el formulario' });
		}
	}
};
