import type { PageServerLoad } from './$types';
import { requireDoctorId } from '$lib/server/rbac.js';
import * as schemasService from '$lib/server/schemas.service.js';
import { mockSchemas } from '$lib/server/mock/schemas.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	requireDoctorId(locals.user);

	// Lista de especialidades disponibles con schema
	const availableSpecialties = Object.entries(mockSchemas).map(([key, schema]) => ({
		key,
		name: schema.specialtyName
	}));

	// Specialty seleccionada (query param)
	const selectedKey = url.searchParams.get('specialty') ?? availableSpecialties[0]?.key ?? '';
	const formSchema = await schemasService.getFormSchema(selectedKey);

	return { formSchema, availableSpecialties, selectedKey };
};
