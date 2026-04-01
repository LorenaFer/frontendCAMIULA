import type { PageServerLoad } from './$types';
import { findFullByCedula, findFullByNHM } from '$lib/server/pacientes.service';
import { findByPaciente, findById as findHistoriaById } from '$lib/server/historias.service';
import * as citasService from '$lib/server/citas.service';
import * as dispatchesService from '$lib/server/inventory/dispatches.service';
import type { CitaConPaciente } from '$shared/types/appointments';
import type { Dispatch } from '$shared/types/inventory';

type SearchType = 'cedula' | 'nhm';

interface TimelineEntry {
	id: string;
	fecha: string;
	titulo: string;
	detalle: string;
	categoria: 'consulta' | 'laboratorio' | 'despacho' | 'administrativo';
	formulario?: {
		motivoConsulta?: string;
		anamnesis?: string;
		examenFisico?: { ta?: string; fc?: string; fr?: string; temp?: string; peso?: string; talla?: string };
		diagnostico?: string;
		diagnosticoCie10?: string;
		tratamiento?: string;
		indicaciones?: string;
		examenesSolicitados?: Array<{ nombre: string; indicaciones?: string }>;
		receta?: Array<{ medicamento: string; dosis?: string; frecuencia?: string; duracion?: string }>;
	};
}

interface PatientStats {
	totalCitas: number;
	citasAtendidas: number;
	citasPendientes: number;
	citasCanceladas: number;
	noShows: number;
	totalDespachos: number;
	totalExamenesPendientes: number;
}

function normalizeSearchType(value: string | null): SearchType {
	return value === 'nhm' ? 'nhm' : 'cedula';
}

export const load: PageServerLoad = async ({ url }) => {
	const searchType = normalizeSearchType(url.searchParams.get('searchType'));
	const rawQuery = url.searchParams.get('query')?.trim() ?? '';
	// Auto-detect: numérico puro < 100000 → NHM, sino cédula
	const autoType = /^\d+$/.test(rawQuery) && Number(rawQuery) < 100000 ? 'nhm' : 'cedula';
	const effectiveType = rawQuery ? autoType : searchType;
	const query = rawQuery;
	const searched = query.length > 0;

	let patient = null;
	let validationMessage: string | undefined;
	let medicalSnapshot: { tipoSangre: string; alergias: string[]; condiciones: string[] } | null = null;
	let historyTimeline: TimelineEntry[] = [];
	let patientCitas: CitaConPaciente[] = [];
	let patientDispatches: Dispatch[] = [];
	let stats: PatientStats | null = null;

	if (searched) {
		let fullPatient = null;

		if (effectiveType === 'nhm') {
			const nhm = Number(query);
			if (!Number.isInteger(nhm) || nhm <= 0) {
				validationMessage = 'El número de historia debe ser un entero positivo.';
			} else {
				fullPatient = await findFullByNHM(nhm);
			}
		} else {
			fullPatient = await findFullByCedula(query);
		}

		if (fullPatient) {
			patient = {
				id: fullPatient.id,
				nhm: fullPatient.nhm,
				cedula: fullPatient.cedula,
				nombre: fullPatient.nombre,
				apellido: fullPatient.apellido,
				sexo: fullPatient.sexo,
				edad: fullPatient.edad,
				fecha_nacimiento: fullPatient.fecha_nacimiento,
				estado_civil: fullPatient.estado_civil,
				relacion_univ: fullPatient.relacion_univ,
				telefono: fullPatient.telefono,
				direccion_habitacion: fullPatient.direccion_habitacion,
				profesion: fullPatient.profesion,
				es_nuevo: fullPatient.es_nuevo,
				datos_medicos: fullPatient.datos_medicos,
				contacto_emergencia: fullPatient.contacto_emergencia,
				created_at: fullPatient.created_at
			};

			medicalSnapshot = {
				tipoSangre: fullPatient.datos_medicos?.tipo_sangre || 'No registrado',
				alergias: fullPatient.datos_medicos?.alergias ?? [],
				condiciones: fullPatient.datos_medicos?.condiciones ?? []
			};

			// Cargar datos reales en paralelo
			const [previousHistories, citasResult, dispatches] = await Promise.all([
				findByPaciente(fullPatient.id, { limit: 10 }),
				citasService.getCitasByFilters({ search: fullPatient.cedula, page_size: 50 }),
				dispatchesService.getDispatches({ patient_id: fullPatient.id, page: 1, pageSize: 20 })
			]);

			// Citas del paciente
			patientCitas = citasResult.items
				.filter((c) => c.paciente_id === fullPatient!.id)
				.sort((a, b) => b.fecha.localeCompare(a.fecha));

			// Despachos del paciente
			patientDispatches = (dispatches.data as Dispatch[])
				.filter((d) => d.fk_patient_id === fullPatient!.id)
				.sort((a, b) => b.dispatch_date.localeCompare(a.dispatch_date));

			// Stats
			stats = {
				totalCitas: patientCitas.length,
				citasAtendidas: patientCitas.filter((c) => c.estado === 'atendida').length,
				citasPendientes: patientCitas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length,
				citasCanceladas: patientCitas.filter((c) => c.estado === 'cancelada').length,
				noShows: patientCitas.filter((c) => c.estado === 'no_asistio').length,
				totalDespachos: patientDispatches.length,
				totalExamenesPendientes: 0 // TODO: connect when exams module exists
			};

			// Timeline: historias médicas
			const historyEvents: TimelineEntry[] = await Promise.all(
				previousHistories.map(async (entry) => {
					const historia = await findHistoriaById(entry.id);
					const evaluacion = historia?.evaluacion;
					return {
						id: entry.id,
						fecha: entry.fecha,
						titulo: entry.diagnostico_descripcion?.trim() || `Consulta de ${entry.especialidad}`,
						detalle: `${entry.especialidad} — ${entry.doctor_nombre}`,
						categoria: 'consulta' as const,
						formulario: evaluacion ? {
							motivoConsulta: evaluacion.motivo_consulta,
							anamnesis: evaluacion.anamnesis,
							examenFisico: evaluacion.examen_fisico,
							diagnostico: evaluacion.diagnostico?.descripcion,
							diagnosticoCie10: evaluacion.diagnostico?.cie10,
							tratamiento: evaluacion.tratamiento,
							indicaciones: evaluacion.indicaciones,
							examenesSolicitados: (evaluacion as Record<string, unknown>).examenes_solicitados as Array<{ nombre: string; indicaciones?: string }> | undefined,
							receta: ((evaluacion as Record<string, unknown>).receta as { medicamentos?: Array<Record<string, unknown>> })?.medicamentos?.map((m) => ({
								medicamento: String(m.medicamento ?? ''),
								dosis: String(m.dosis ?? ''),
								frecuencia: String(m.frecuencia ?? ''),
								duracion: String(m.duracion ?? '')
							})) ?? undefined
						} : undefined
					};
				})
			);

			// Timeline: despachos
			const dispatchEvents: TimelineEntry[] = patientDispatches.map((d) => ({
				id: `disp-${d.id}`,
				fecha: d.dispatch_date,
				titulo: `Despacho de medicamentos`,
				detalle: `${d.items.length} medicamento(s) — ${d.pharmacist_name ?? 'Farmacia'}`,
				categoria: 'despacho' as const
			}));

			// Timeline: registro
			const adminEvents: TimelineEntry[] = [{
				id: `reg-${fullPatient.id}`,
				fecha: fullPatient.created_at.slice(0, 10),
				titulo: 'Registro del paciente en sistema',
				detalle: 'Apertura de expediente clínico',
				categoria: 'administrativo' as const
			}];

			historyTimeline = [...historyEvents, ...dispatchEvents, ...adminEvents]
				.sort((a, b) => b.fecha.localeCompare(a.fecha))
				.slice(0, 15);
		}
	}

	return {
		filters: { searchType: effectiveType, query },
		patient,
		medicalSnapshot,
		historyTimeline,
		patientCitas,
		patientDispatches,
		stats,
		searched,
		validationMessage
	};
};
