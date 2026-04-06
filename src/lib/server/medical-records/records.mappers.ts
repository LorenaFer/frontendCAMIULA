// ============================================================
// Mappers: Historias Médicas — Backend ↔ Frontend
// ============================================================

import type { HistoriaMedica, Evaluacion, HistorialPrevioEntry } from '$domain/medical-records/types.js';

type AnyRecord = Record<string, unknown>;

export function mapMedicalRecord(b: AnyRecord): HistoriaMedica {
	return {
		id: String(b.id),
		cita_id: String(b.fk_appointment_id),
		paciente_id: String(b.fk_patient_id),
		doctor_id: String(b.fk_doctor_id),
		evaluacion: (b.evaluation as Evaluacion) ?? {},
		preparado: Boolean(b.is_prepared),
		preparado_at: b.prepared_at as string | undefined,
		created_at: String(b.created_at ?? ''),
		updated_at: String(b.updated_at ?? '')
	};
}

export function mapHistoryEntry(b: AnyRecord): HistorialPrevioEntry {
	return {
		id: String(b.id),
		fecha: String(b.date ?? ''),
		especialidad: String(b.specialty ?? ''),
		doctor_nombre: String(b.doctor_name ?? ''),
		diagnostico_descripcion: b.diagnosis_description as string | undefined,
		diagnostico_cie10: b.diagnosis_code as string | undefined
	};
}
