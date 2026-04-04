import type { PageServerLoad } from './$types';
import { requireDoctorId } from '$lib/server/rbac.js';
import * as schemasService from '$lib/server/schemas.service.js';
import { mockSchemas } from '$lib/server/mock/schemas.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	requireDoctorId(locals.user);

	// Mostrar solo especialidades que tienen un formulario real (con secciones)
	// Combinar: schemas del backend con contenido + schemas mock
	const backendSchemas = await schemasService.getAllSchemas().catch(() => []);
	const backendWithContent = backendSchemas.filter(s => s.sections?.length > 0);

	// Construir mapa de especialidades con schema real
	const specialtyMap = new Map<string, { key: string; name: string }>();

	// Primero agregar los mock (siempre tienen contenido)
	for (const [key, schema] of Object.entries(mockSchemas)) {
		specialtyMap.set(key, { key, name: schema.specialtyName });
	}

	// Luego agregar los del backend que tengan contenido (sobreescriben mock si coinciden)
	for (const schema of backendWithContent) {
		const key = schema.specialtyId;
		specialtyMap.set(key, { key, name: schema.specialtyName });
	}

	const availableSpecialties = [...specialtyMap.values()].sort((a, b) => a.name.localeCompare(b.name));

	// Specialty seleccionada (query param)
	const selectedKey = url.searchParams.get('specialty') ?? availableSpecialties[0]?.key ?? '';
	const formSchema = await schemasService.getFormSchema(selectedKey);

	return { formSchema, availableSpecialties, selectedKey };
};
