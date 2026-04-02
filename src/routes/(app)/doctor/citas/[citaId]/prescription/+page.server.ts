import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as prescriptionsService from '$lib/server/inventory/prescriptions.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import { assertActionPermission, requireDoctorId, assertPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { CreatePrescriptionInput } from '$shared/types/inventory.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	assertPermission(locals.user, P.RECIPE_WRITE);
	requireDoctorId(locals.user);

	const citaId = params.citaId;
	if (!citaId) error(404, 'Cita no encontrada');

	const [cita, existingPrescription, medicationOptions] = await Promise.all([
		citasService.getCitaById(citaId),
		prescriptionsService.getPrescriptionByAppointment(citaId),
		medicationsService.getMedicationOptions()
	]);

	if (!cita) error(404, 'Cita no encontrada');

	return { cita, existingPrescription, medicationOptions };
};

export const actions: Actions = {
	emitirRecipe: async ({ request, params, locals }) => {
		assertActionPermission(locals.user, 'emitirRecipe');

		const citaId = params.citaId;
		if (!citaId) return fail(400, { error: 'ID de cita inválido' });

		const cita = await citasService.getCitaById(citaId);
		if (!cita) return fail(404, { error: 'Cita no encontrada' });

		const fd = await request.formData();
		const notes = String(fd.get('notes') ?? '').trim() || undefined;

		let items: CreatePrescriptionInput['items'] = [];
		try {
			items = JSON.parse(String(fd.get('items') ?? '[]'));
		} catch {
			return fail(400, { error: 'Formato de ítems inválido' });
		}

		if (items.length === 0) {
			return fail(400, { error: 'La receta debe tener al menos un medicamento' });
		}

		const input: CreatePrescriptionInput = {
			fk_appointment_id: citaId,
			fk_patient_id: cita.paciente_id,
			notes,
			items
		};

		try {
			const prescription = await prescriptionsService.createPrescription(input);
			return { success: true, prescriptionNumber: prescription.prescription_number };
		} catch {
			return fail(500, { error: 'Error al emitir receta' });
		}
	}
};
