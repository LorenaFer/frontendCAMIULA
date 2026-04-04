import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { MedicationFilters, CreateMedicationInput } from '$shared/types/inventory.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);

	const filters: MedicationFilters = {
		search: url.searchParams.get('search') ?? undefined,
		status: (url.searchParams.get('status') as MedicationFilters['status']) ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size'))) ? Number(url.searchParams.get('page_size')) : 25
	};

	const medications = await medicationsService.getMedications(filters).catch(() => ({
		data: [], total: 0, page: 1, pageSize: 25, hasNext: false
	}));
	return { medications, filters };
};

export const actions: Actions = {
	crearMedicamento: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'crearMedicamento');

		const fd = await request.formData();
		const input: CreateMedicationInput = {
			code: String(fd.get('code') ?? '').trim().toUpperCase(),
			generic_name: String(fd.get('generic_name') ?? '').trim(),
			commercial_name: String(fd.get('commercial_name') ?? '').trim() || undefined,
			pharmaceutical_form: String(fd.get('pharmaceutical_form') ?? '').trim(),
			concentration: String(fd.get('concentration') ?? '').trim() || undefined,
			unit_measure: String(fd.get('unit_measure') ?? '').trim(),
			therapeutic_class: String(fd.get('therapeutic_class') ?? '').trim() || undefined,
			controlled_substance: fd.get('controlled_substance') === 'true',
			requires_refrigeration: fd.get('requires_refrigeration') === 'true'
		};

		if (!input.code || !input.generic_name || !input.pharmaceutical_form || !input.unit_measure) {
			return fail(400, { error: 'Campos requeridos: código, nombre genérico, forma farmacéutica, unidad de medida' });
		}

		try {
			await medicationsService.createMedication(input);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 409) return fail(409, { error: 'Ya existe un medicamento con ese código' });
			return fail(500, { error: 'Error al crear medicamento' });
		}
	},

	editarMedicamento: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'editarMedicamento');

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID requerido' });

		const input: Partial<CreateMedicationInput> = {};
		if (fd.has('generic_name') && fd.get('generic_name'))
			input.generic_name = String(fd.get('generic_name')).trim();
		if (fd.has('commercial_name'))
			input.commercial_name = String(fd.get('commercial_name')).trim() || undefined;
		if (fd.has('pharmaceutical_form') && fd.get('pharmaceutical_form'))
			input.pharmaceutical_form = String(fd.get('pharmaceutical_form')).trim();
		if (fd.has('concentration'))
			input.concentration = String(fd.get('concentration')).trim() || undefined;
		if (fd.has('unit_measure') && fd.get('unit_measure'))
			input.unit_measure = String(fd.get('unit_measure')).trim();
		if (fd.has('therapeutic_class'))
			input.therapeutic_class = String(fd.get('therapeutic_class')).trim() || undefined;

		try {
			await medicationsService.updateMedication(id, input);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Medicamento no encontrado' });
			return fail(500, { error: 'Error al actualizar medicamento' });
		}
	},

	desactivarMedicamento: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'editarMedicamento');

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await medicationsService.updateMedication(id, { medication_status: 'discontinued' } as Partial<CreateMedicationInput>);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Medicamento no encontrado' });
			return fail(500, { error: 'Error al desactivar medicamento' });
		}
	}
};
