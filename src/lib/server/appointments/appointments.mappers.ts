// ============================================================
// Mappers: Citas — Backend (inglés) ↔ Frontend (español)
// ============================================================

import type { Paciente } from '$domain/patients/types.js';
import type { CitaEstado, CitaConPaciente, TimeSlot } from '$domain/appointments/types.js';

type AnyRecord = Record<string, unknown>;

// ─── Helpers genéricos de paginación ────────────────────────

/** Paginación: backend → frontend (citas) */
export function mapPagination(backendPage: AnyRecord): { items: unknown[]; pagination: { total: number; page: number; page_size: number; pages: number; has_next: boolean } } {
	const pagination = backendPage.pagination as AnyRecord;
	return {
		items: backendPage.items as unknown[],
		pagination: {
			total: Number(pagination.total),
			page: Number(pagination.page),
			page_size: Number(pagination.page_size),
			pages: Number(pagination.pages),
			has_next: Number(pagination.page) < Number(pagination.pages)
		}
	};
}

/** Paginación: backend → frontend (inventario) */
export function mapInventoryPagination<T>(backendPage: AnyRecord, mapItem: (item: AnyRecord) => T): { data: T[]; total: number; page: number; pageSize: number; hasNext: boolean } {
	const pagination = backendPage.pagination as AnyRecord;
	return {
		data: (backendPage.items as AnyRecord[]).map(mapItem),
		total: Number(pagination.total),
		page: Number(pagination.page),
		pageSize: Number(pagination.page_size),
		hasNext: Number(pagination.page) < Number(pagination.pages)
	};
}

// ─── Citas ──────────────────────────────────────────────────

// El backend usa estados en español — mapeo identidad + fallback para inglés legacy
const statusBackendToFrontend: Record<string, CitaEstado> = {
	// Español (backend real)
	pendiente: 'pendiente', confirmada: 'confirmada', atendida: 'atendida',
	cancelada: 'cancelada', no_asistio: 'no_asistio',
	// Inglés (fallback por si acaso)
	pending: 'pendiente', confirmed: 'confirmada', completed: 'atendida',
	cancelled: 'cancelada', no_show: 'no_asistio', in_progress: 'confirmada'
};

export function mapAppointment(b: AnyRecord): CitaConPaciente {
	const estado = statusBackendToFrontend[String(b.appointment_status)] ?? 'pendiente';
	return {
		id: String(b.id),
		paciente_id: String(b.fk_patient_id),
		doctor_id: String(b.fk_doctor_id),
		especialidad_id: String(b.fk_specialty_id),
		fecha: String(b.appointment_date ?? ''),
		hora_inicio: String(b.start_time),
		hora_fin: String(b.end_time),
		duracion_min: Number(b.duration_minutes) as 30 | 60,
		es_primera_vez: Boolean(b.is_first_visit),
		estado,
		motivo_consulta: b.reason as string | undefined,
		observaciones: b.observations as string | undefined,
		created_at: String(b.created_at ?? ''),
		created_by: '',
		paciente: {
			id: String(b.fk_patient_id),
			nhm: b.patient_nhm != null ? Number(b.patient_nhm) : null,
			cedula: String(b.patient_dni ?? b.patient_cedula ?? ''),
			nombre: String(b.patient_name ?? '').split(' ')[0] ?? '',
			apellido: String(b.patient_name ?? '').split(' ').slice(1).join(' ') ?? '',
			relacion_univ: (b.patient_university_relation as string ?? 'estudiante') as Paciente['relacion_univ'],
			datos_medicos: {},
			es_nuevo: false,
			created_at: ''
		},
		doctor: {
			id: String(b.fk_doctor_id),
			nombre: String(b.doctor_name ?? '').split(' ')[0] ?? '',
			apellido: String(b.doctor_name ?? '').split(' ').slice(1).join(' ') ?? '',
			especialidad_id: String(b.fk_specialty_id),
			activo: true,
			especialidad: {
				id: String(b.fk_specialty_id),
				nombre: String(b.specialty_name ?? ''),
				activo: true
			}
		}
	};
}

export function mapAppointmentToBackend(c: { paciente_id: string; doctor_id: string; especialidad_id: string; fecha: string; hora_inicio: string; hora_fin: string; duracion_min: number; es_primera_vez: boolean; motivo_consulta?: string; observaciones?: string }): AnyRecord {
	return {
		fk_patient_id: c.paciente_id,
		fk_doctor_id: c.doctor_id,
		fk_specialty_id: c.especialidad_id,
		appointment_date: c.fecha,
		start_time: c.hora_inicio,
		end_time: c.hora_fin,
		duration_minutes: c.duracion_min,
		is_first_visit: c.es_primera_vez,
		reason: c.motivo_consulta ?? null,
		observations: c.observaciones ?? null
	};
}

export function mapStatusToBackend(estado: CitaEstado): string {
	// Backend usa estados en español — pasar tal cual
	return estado;
}

export function mapSlot(b: AnyRecord): TimeSlot {
	return {
		hora_inicio: String(b.start_time),
		hora_fin: String(b.end_time),
		disponible: Boolean(b.available)
	};
}
