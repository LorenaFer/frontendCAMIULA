import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import * as citasService from '$lib/server/citas.service.js';
import * as historiasService from '$lib/server/historias.service.js';
import * as schemasService from '$lib/server/schemas.service.js';
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
	const [formSchema, previousHistories] = await Promise.all([
		schemasService.getFormSchema(specialtyName),
		historiasService.findByPaciente(cita.paciente_id, {
			limit: 5,
			excludeCitaId: citaId
		})
	]);

	return { cita, historia, formSchema, previousHistories };
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
	}
};
