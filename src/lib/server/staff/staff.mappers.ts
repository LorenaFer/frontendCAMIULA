// ============================================================
// Mappers: Doctores y Especialidades — Backend ↔ Frontend
// ============================================================

import type {
	Especialidad, DoctorConEspecialidad, DoctorOption, DisponibilidadDoctor
} from '$domain/staff/types.js';

type AnyRecord = Record<string, unknown>;

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
