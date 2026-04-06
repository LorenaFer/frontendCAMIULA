import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as historiasService from '$lib/server/historias.service.js';
import * as schemasService from '$lib/server/schemas.service.js';
import * as prescriptionsService from '$lib/server/inventory/prescriptions.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import type { Evaluacion } from '$shared/types/appointments.js';
import { assertActionPermission, requireDoctorId } from '$lib/server/rbac.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireDoctorId(locals.user);
	const citaId = params.citaId;
	if (!citaId) error(404, 'Cita no encontrada');

	const [cita, historia] = await Promise.all([
		citasService.getCitaById(citaId),
		historiasService.findByCita(citaId)
	]);

	if (!cita) error(404, 'Cita no encontrada');

	// Cargar schema de la especialidad y historial previo en paralelo
	const specialtyName = cita.doctor?.especialidad?.nombre ?? 'Medicina General';
	const [formSchema, previousHistories, existingPrescription, medicationOptions] = await Promise.all([
		schemasService.getFormSchema(specialtyName),
		historiasService.findByPaciente(cita.paciente_id, {
			limit: 5,
			excludeCitaId: citaId
		}),
		prescriptionsService.getPrescriptionByAppointment(citaId).catch(() => null),
		medicationsService.getMedicationOptions().catch(() => [])
	]);

	return { cita, historia, formSchema, previousHistories, existingPrescription, medicationOptions };
};

export const actions: Actions = {
	guardarEvaluacion: async ({ request, params, locals }) => {
		assertActionPermission(locals.user, 'guardarEvaluacion');
		const citaId = params.citaId;
		if (!citaId) return fail(400, { error: 'ID inválido' });

		const fd = await request.formData();
		const cita = await citasService.getCitaById(citaId);
		if (!cita) return fail(404, { error: 'Cita no encontrada' });

		const schemaId = String(fd.get('schema_id') ?? '');
		const schemaVersion = String(fd.get('schema_version') ?? '');
		const evaluacionJson = String(fd.get('evaluacion') ?? '{}');

		// Si viene en formato dinámico (JSON), usar el nuevo servicio
		if (schemaId) {
			let evaluacion: Record<string, unknown>;
			try {
				evaluacion = JSON.parse(evaluacionJson);
			} catch {
				return fail(400, { error: 'Datos de evaluación inválidos' });
			}

			await historiasService.upsertHistoriaDynamic(
				citaId,
				cita.paciente_id,
				cita.doctor_id,
				evaluacion,
				schemaId,
				schemaVersion
			);
			return { success: true };
		}

		// Fallback: formato legacy (campos individuales en formData)
		const evaluacion: Evaluacion = {
			motivo_consulta: String(fd.get('motivo_consulta') ?? '').trim(),
			anamnesis: String(fd.get('anamnesis') ?? '').trim(),
			examen_fisico: {
				ta: String(fd.get('ef_ta') ?? '').trim(),
				fc: String(fd.get('ef_fc') ?? '').trim(),
				fr: String(fd.get('ef_fr') ?? '').trim(),
				temp: String(fd.get('ef_temp') ?? '').trim(),
				peso: String(fd.get('ef_peso') ?? '').trim(),
				talla: String(fd.get('ef_talla') ?? '').trim()
			},
			diagnostico: {
				cie10: String(fd.get('dx_cie10') ?? '').trim().toUpperCase(),
				descripcion: String(fd.get('dx_descripcion') ?? '').trim()
			},
			tratamiento: String(fd.get('tratamiento') ?? '').trim(),
			indicaciones: String(fd.get('indicaciones') ?? '').trim()
		};

		await historiasService.upsertHistoria(citaId, cita.paciente_id, cita.doctor_id, evaluacion);
		return { success: true };
	},

	autosave: async ({ request, params, locals }) => {
		assertActionPermission(locals.user, 'guardarEvaluacion');
		const citaId = params.citaId;
		if (!citaId) return fail(400, { error: 'ID inválido' });

		const fd = await request.formData();
		const cita = await citasService.getCitaById(citaId);
		if (!cita) return fail(404, { error: 'Cita no encontrada' });

		const schemaId = String(fd.get('schema_id') ?? '');
		const schemaVersion = String(fd.get('schema_version') ?? '');
		const evaluacionJson = String(fd.get('evaluacion') ?? '{}');

		let evaluacion: Record<string, unknown>;
		try {
			evaluacion = JSON.parse(evaluacionJson);
		} catch {
			return fail(400, { error: 'Datos inválidos' });
		}

		await historiasService.upsertHistoriaDynamic(
			citaId,
			cita.paciente_id,
			cita.doctor_id,
			evaluacion,
			schemaId,
			schemaVersion
		);

		return { autosaved: true };
	},

	emitirReceta: async ({ request, params, locals }) => {
		assertActionPermission(locals.user, 'emitirReceta');
		const citaId = params.citaId;
		if (!citaId) return fail(400, { error: 'ID inválido' });

		const fd = await request.formData();
		const itemsRaw = String(fd.get('items') ?? '[]');
		let items: Array<Record<string, unknown>>;
		try { items = JSON.parse(itemsRaw); } catch { return fail(400, { error: 'Datos inválidos' }); }
		if (!items.length) return fail(400, { error: 'Debe agregar al menos un medicamento' });

		const cita = await citasService.getCitaById(citaId);
		if (!cita) return fail(404, { error: 'Cita no encontrada' });

		// Separar items del inventario vs externos
		const inventoryItems = items.filter((i) => i.source === 'inventario' && i.medication_id);
		const allItems = items; // Todos van en la receta impresa

		try {
			// Crear prescripción formal solo si hay items de inventario del hospital
			// (el backend requiere mínimo 1 item)
			if (inventoryItems.length > 0) {
				await prescriptionsService.createPrescription({
					fk_appointment_id: citaId,
					fk_patient_id: cita.paciente_id,
					fk_doctor_id: cita.doctor_id,
					notes: `${inventoryItems.length} medicamento(s) para despacho en farmacia del hospital`,
					items: inventoryItems.map((i) => ({
						medication_id: String(i.medication_id),
						quantity_prescribed: Number(i.cantidad) || 1,
						dosage_instructions: `${i.dosis ?? ''} ${i.via ?? ''} ${i.frecuencia ?? ''}`.trim(),
						duration_days: parseInt(String(i.duracion ?? '0')) || undefined
					}))
				});
			}

			const hasInventory = inventoryItems.length > 0;
			const hasExternal = allItems.length > inventoryItems.length;

			return {
				recipeEmitted: true,
				inventoryCount: inventoryItems.length,
				externalCount: allItems.length - inventoryItems.length,
				message: hasInventory && hasExternal
					? `Receta emitida. ${inventoryItems.length} para farmacia del hospital, ${allItems.length - inventoryItems.length} para farmacia externa.`
					: hasInventory
						? `Receta emitida. ${inventoryItems.length} medicamento(s) disponibles para despacho en farmacia.`
						: 'Receta emitida. Todos los medicamentos son de farmacia externa.'
			};
		} catch {
			return fail(500, { error: 'Error al emitir receta' });
		}
	},

	finalizarCita: async ({ request, params, locals }) => {
		assertActionPermission(locals.user, 'guardarEvaluacion');
		const citaId = params.citaId;
		if (!citaId) return fail(400, { error: 'ID inválido' });

		const fd = await request.formData();
		const cita = await citasService.getCitaById(citaId);
		if (!cita) return fail(404, { error: 'Cita no encontrada' });

		// 1. Guardar evaluación
		const schemaId = String(fd.get('schema_id') ?? '');
		const schemaVersion = String(fd.get('schema_version') ?? '');
		const evaluacionJson = String(fd.get('evaluacion') ?? '{}');

		if (schemaId) {
			let evaluacion: Record<string, unknown>;
			try { evaluacion = JSON.parse(evaluacionJson); } catch { return fail(400, { error: 'Datos inválidos' }); }

			await historiasService.upsertHistoriaDynamic(
				citaId, cita.paciente_id, cita.doctor_id,
				evaluacion, schemaId, schemaVersion
			);
		}

		// 2. Marcar como atendida
		try {
			await citasService.updateEstadoCita(citaId, 'atendida');
		} catch (e: unknown) {
			const err = e as { status?: number; userMessage?: string; message?: string };
			// Si ya está atendida, no es error grave
			if (err.status === 400) {
				console.warn('[finalizarCita] Estado no actualizado:', err.userMessage ?? err.message);
			} else {
				return fail(err.status ?? 500, { error: err.userMessage ?? err.message ?? 'Error al actualizar estado de la cita' });
			}
		}

		return { finalized: true };
	}
};
