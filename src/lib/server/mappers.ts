// ============================================================
// Mappers: Backend (inglés) ↔ Frontend (español)
//
// El backend FastAPI usa nombres en inglés (first_name, start_time)
// El frontend usa nombres en español (nombre, hora_inicio)
// Esta capa traduce sin cambiar ni UI ni backend.
// ============================================================

import type {
	Paciente, PacientePublic, DatosMedicos, ContactoEmergencia,
	Especialidad, Doctor, DoctorConEspecialidad, DoctorOption,
	DisponibilidadDoctor,
	Cita, CitaConPaciente, CitaEstado, TimeSlot,
	HistoriaMedica, Evaluacion
} from '$shared/types/appointments.js';
import type { HistorialPrevioEntry } from '$shared/types/medical-records.js';
import type {
	Medication, MedicationOption, Supplier, SupplierOption,
	Batch, StockItem,
	PurchaseOrder, PurchaseOrderItem,
	Prescription, PrescriptionItem,
	Dispatch, DispatchItem,
	DispatchLimit, DispatchException
} from '$shared/types/inventory.js';

// ─── Helpers genéricos ──────────────────────────────────────

type AnyRecord = Record<string, unknown>;

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

// ─── Pacientes ──────────────────────────────────────────────

export function mapPatient(b: AnyRecord): Paciente {
	return {
		id: String(b.id),
		nhm: Number(b.nhm),
		cedula: String(b.cedula),
		nombre: String(b.first_name ?? ''),
		apellido: String(b.last_name ?? ''),
		sexo: b.sex as Paciente['sexo'],
		fecha_nacimiento: b.birth_date as string | undefined,
		lugar_nacimiento: b.birth_place as string | undefined,
		edad: b.age as number | undefined,
		estado_civil: b.marital_status as Paciente['estado_civil'],
		religion: b.religion as string | undefined,
		procedencia: b.origin as string | undefined,
		direccion_habitacion: b.home_address as string | undefined,
		telefono: b.phone as string | undefined,
		profesion: b.profession as string | undefined,
		ocupacion_actual: b.current_occupation as string | undefined,
		direccion_trabajo: b.work_address as string | undefined,
		clasificacion_economica: b.economic_classification as string | undefined,
		relacion_univ: String(b.university_relation) as Paciente['relacion_univ'],
		parentesco: b.family_relationship as Paciente['parentesco'],
		titular_nhm: b.fk_holder_patient_id ? undefined : undefined, // backend uses FK, not NHM
		datos_medicos: (b.medical_data as DatosMedicos) ?? { alergias: [], condiciones: [] },
		contacto_emergencia: b.emergency_contact as ContactoEmergencia | undefined,
		es_nuevo: Boolean(b.is_new),
		created_at: String(b.created_at ?? '')
	};
}

export function mapPatientPublic(b: AnyRecord): PacientePublic {
	return {
		id: String(b.id),
		nhm: Number(b.nhm),
		nombre: String(b.first_name ?? ''),
		apellido: String(b.last_name ?? ''),
		relacion_univ: String(b.university_relation) as PacientePublic['relacion_univ'],
		es_nuevo: Boolean(b.is_new)
	};
}

export function mapPatientToBackend(p: Partial<Paciente> & { cedula: string; nombre: string; apellido: string }): AnyRecord {
	return {
		cedula: p.cedula,
		first_name: p.nombre,
		last_name: p.apellido,
		sex: p.sexo ?? null,
		birth_date: p.fecha_nacimiento ?? null,
		birth_place: p.lugar_nacimiento ?? null,
		age: p.edad ?? null,
		marital_status: p.estado_civil ?? null,
		religion: p.religion ?? null,
		origin: p.procedencia ?? null,
		home_address: p.direccion_habitacion ?? null,
		phone: p.telefono ?? null,
		profession: p.profesion ?? null,
		current_occupation: p.ocupacion_actual ?? null,
		work_address: p.direccion_trabajo ?? null,
		economic_classification: p.clasificacion_economica ?? null,
		university_relation: p.relacion_univ,
		family_relationship: p.parentesco ?? null,
		fk_holder_patient_id: null, // resolved server-side from titular_nhm
		medical_data: p.datos_medicos ?? null,
		emergency_contact: p.contacto_emergencia ?? null
	};
}

// ─── Doctores ───────────────────────────────────────────────

export function mapDoctor(b: AnyRecord): DoctorConEspecialidad {
	return {
		id: String(b.id),
		nombre: String(b.first_name ?? ''),
		apellido: String(b.last_name ?? ''),
		especialidad_id: String(b.fk_specialty_id),
		activo: b.doctor_status === 'active',
		especialidad: {
			id: String(b.fk_specialty_id),
			nombre: String(b.specialty_name ?? ''),
			activo: true
		}
	};
}

export function mapDoctorOption(b: AnyRecord): DoctorOption {
	return {
		id: String(b.id),
		nombre_completo: `${b.first_name} ${b.last_name}`,
		especialidad: String(b.specialty_name ?? ''),
		especialidad_id: String(b.fk_specialty_id),
		dias_trabajo: (b.work_days as number[]) ?? []
	};
}

export function mapSpecialty(b: AnyRecord): Especialidad {
	return {
		id: String(b.id),
		nombre: String(b.name),
		activo: b.status !== 'inactive'
	};
}

export function mapAvailability(b: AnyRecord): DisponibilidadDoctor {
	return {
		id: String(b.id),
		doctor_id: String(b.fk_doctor_id),
		day_of_week: Number(b.day_of_week) as DisponibilidadDoctor['day_of_week'], // ambos usan 1=Lun...5=Vie
		hora_inicio: String(b.start_time),
		hora_fin: String(b.end_time),
		duracion_slot: Number(b.slot_duration ?? 30)
	};
}

export function mapAvailabilityToBackend(d: { day_of_week: number; hora_inicio: string; hora_fin: string; duracion_slot?: number }): AnyRecord {
	return {
		day_of_week: d.day_of_week, // ambos usan 1=Lun...5=Vie
		start_time: d.hora_inicio,
		end_time: d.hora_fin,
		slot_duration: d.duracion_slot ?? 30
	};
}

// ─── Citas ──────────────────────────────────────────────────

const statusBackendToFrontend: Record<string, CitaEstado> = {
	pending: 'pendiente', confirmed: 'confirmada', completed: 'atendida',
	cancelled: 'cancelada', no_show: 'no_asistio', in_progress: 'confirmada'
};
const statusFrontendToBackend: Record<string, string> = {
	pendiente: 'pending', confirmada: 'confirmed', atendida: 'completed',
	cancelada: 'cancelled', no_asistio: 'no_show'
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
			nhm: 0,
			cedula: String(b.patient_cedula ?? ''),
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
	return statusFrontendToBackend[estado] ?? 'pending';
}

export function mapSlot(b: AnyRecord): TimeSlot {
	return {
		hora_inicio: String(b.start_time),
		hora_fin: String(b.end_time),
		disponible: Boolean(b.available)
	};
}

// ─── Historias Médicas ──────────────────────────────────────

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

// ─── Inventario (sin mapeo — ya usan inglés) ────────────────

// Los tipos de inventario ya están en inglés en el frontend
// (generic_name, pharmaceutical_form, etc.) — no necesitan mapeo.
// Solo la paginación necesita adaptarse.
