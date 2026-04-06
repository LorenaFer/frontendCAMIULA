import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { findByPaciente, findById as findHistoriaById } from '$lib/server/medical-records/records.service.js';
import * as citasService from '$lib/server/appointments/appointments.service.js';
import * as pacientesService from '$lib/server/patients/patients.service.js';
import * as dispatchesService from '$lib/server/inventory/dispatches.service.js';
import * as schemasService from '$lib/server/medical-records/schemas.service.js';
import type { Dispatch } from '$domain/inventory/types.js';

interface TimelineEntry {
	id: string;
	fecha: string;
	titulo: string;
	detalle: string;
	categoria: 'consulta' | 'despacho' | 'administrativo';
	especialidad?: string;
	formSections?: Array<{ title: string; fields: Array<{ label: string; value: string }> }>;
	observaciones?: string;
	examenesSolicitados?: Array<{ nombre: string; indicaciones?: string }>;
	receta?: Array<{ medicamento: string; dosis?: string; frecuencia?: string; duracion?: string }>;
}

function extractFieldValue(data: Record<string, unknown>, key: string): string {
	const parts = key.split('.');
	let val: unknown = data;
	for (const part of parts) {
		if (val && typeof val === 'object') val = (val as Record<string, unknown>)[part];
		else return '';
	}
	if (val === null || val === undefined || val === '') return '';
	if (typeof val === 'boolean') return val ? 'Sí' : 'No';
	if (Array.isArray(val)) return val.filter(Boolean).join(', ');
	return String(val);
}

async function buildFormSections(
	evaluacion: Record<string, unknown>,
	especialidad: string
): Promise<Array<{ title: string; fields: Array<{ label: string; value: string }> }>> {
	const schema = await schemasService.getFormSchema(especialidad);
	if (!schema?.sections) return [];
	const sections: Array<{ title: string; fields: Array<{ label: string; value: string }> }> = [];
	for (const section of schema.sections) {
		const fields: Array<{ label: string; value: string }> = [];
		for (const group of section.groups) {
			for (const field of group.fields) {
				const value = extractFieldValue(evaluacion, field.key);
				if (value) fields.push({ label: field.label, value });
			}
		}
		if (fields.length > 0) sections.push({ title: section.title, fields });
	}
	return sections;
}

export const load: PageServerLoad = async ({ params }) => {
	const pacienteId = params.pacienteId;
	const fullPatient = await pacientesService.getById(pacienteId);
	if (!fullPatient) error(404, 'Paciente no encontrado');

	const patient = {
		id: fullPatient.id, nhm: fullPatient.nhm, cedula: fullPatient.cedula,
		nombre: fullPatient.nombre, apellido: fullPatient.apellido,
		sexo: fullPatient.sexo, edad: fullPatient.edad,
		fecha_nacimiento: fullPatient.fecha_nacimiento, estado_civil: fullPatient.estado_civil,
		relacion_univ: fullPatient.relacion_univ, telefono: fullPatient.telefono,
		direccion_habitacion: fullPatient.direccion_habitacion, profesion: fullPatient.profesion,
		es_nuevo: fullPatient.es_nuevo, datos_medicos: fullPatient.datos_medicos,
		contacto_emergencia: fullPatient.contacto_emergencia, created_at: fullPatient.created_at
	};

	const medicalSnapshot = {
		tipoSangre: fullPatient.datos_medicos?.tipo_sangre || 'No registrado',
		alergias: fullPatient.datos_medicos?.alergias ?? [],
		condiciones: fullPatient.datos_medicos?.condiciones ?? []
	};

	const [previousHistories, citasResult, dispatches] = await Promise.all([
		findByPaciente(fullPatient.id, { limit: 15 }),
		citasService.getCitasByPatientId(fullPatient.id),
		dispatchesService.getDispatches({ patient_id: fullPatient.id, page: 1, pageSize: 20 })
	]);

	const patientCitas = citasResult.items
		.sort((a, b) => b.fecha.localeCompare(a.fecha));

	const patientDispatches = (dispatches.data as Dispatch[])
		.filter((d) => d.fk_patient_id === fullPatient.id)
		.sort((a, b) => b.dispatch_date.localeCompare(a.dispatch_date));

	const stats = {
		totalCitas: patientCitas.length,
		citasAtendidas: patientCitas.filter((c) => c.estado === 'atendida').length,
		citasPendientes: patientCitas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length,
		citasCanceladas: patientCitas.filter((c) => c.estado === 'cancelada').length,
		noShows: patientCitas.filter((c) => c.estado === 'no_asistio').length,
		totalDespachos: patientDispatches.length
	};

	const historyEvents: TimelineEntry[] = await Promise.all(
		previousHistories.map(async (entry) => {
			const historia = await findHistoriaById(entry.id);
			const evalData = historia?.evaluacion as Record<string, unknown> | undefined;
			const formSections = evalData ? await buildFormSections(evalData, entry.especialidad) : [];
			const examenes = evalData?.examenes_solicitados as Array<{ nombre: string; indicaciones?: string }> | undefined;
			const recetaData = evalData?.receta as { medicamentos?: Array<Record<string, unknown>> } | undefined;
			return {
				id: entry.id, fecha: entry.fecha,
				titulo: entry.diagnostico_descripcion?.trim() || `Consulta de ${entry.especialidad}`,
				detalle: `${entry.especialidad} — ${entry.doctor_nombre}`,
				categoria: 'consulta' as const, especialidad: entry.especialidad,
				formSections, observaciones: evalData?.observaciones as string | undefined,
				examenesSolicitados: examenes,
				receta: recetaData?.medicamentos?.map((m) => ({
					medicamento: String(m.medicamento ?? ''), dosis: String(m.dosis ?? ''),
					frecuencia: String(m.frecuencia ?? ''), duracion: String(m.duracion ?? '')
				}))
			};
		})
	);

	const dispatchEvents: TimelineEntry[] = patientDispatches.map((d) => ({
		id: `disp-${d.id}`, fecha: d.dispatch_date,
		titulo: 'Despacho de medicamentos',
		detalle: `${d.items.length} medicamento(s) — ${d.pharmacist_name ?? 'Farmacia'}`,
		categoria: 'despacho' as const
	}));

	const adminEvents: TimelineEntry[] = [{
		id: `reg-${fullPatient.id}`, fecha: fullPatient.created_at.slice(0, 10),
		titulo: 'Registro del paciente', detalle: 'Apertura de expediente clínico',
		categoria: 'administrativo' as const
	}];

	const historyTimeline = [...historyEvents, ...dispatchEvents, ...adminEvents]
		.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 20);

	return { patient, medicalSnapshot, historyTimeline, patientCitas, patientDispatches, stats };
};
