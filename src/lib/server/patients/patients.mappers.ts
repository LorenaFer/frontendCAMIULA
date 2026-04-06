// ============================================================
// Mappers: Pacientes — Backend (inglés) ↔ Frontend (español)
// ============================================================

import type {
	Paciente, PacientePublic, DatosMedicos, ContactoEmergencia
} from '$domain/patients/types.js';

type AnyRecord = Record<string, unknown>;

export function mapPatient(b: AnyRecord): Paciente {
	return {
		id: String(b.id),
		nhm: Number(b.nhm),
		cedula: String(b.dni ?? b.cedula ?? ''),
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
		dni: p.cedula,
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
