// ============================================================
// Tipos del Dominio: Citas Médicas
// ============================================================

import type { Paciente, PacientePublic } from '$domain/patients/types.js';
import type { DoctorConEspecialidad } from '$domain/staff/types.js';

// ─── Slots ───────────────────────────────────────────────

export interface TimeSlot {
	hora_inicio: string; // "09:00"
	hora_fin: string; // "09:30"
	disponible: boolean;
}

// ─── Citas ───────────────────────────────────────────────

export type CitaEstado = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';

export interface Cita {
	id: string;
	paciente_id: string;
	doctor_id: string;
	especialidad_id: string;
	fecha: string; // ISO date "2025-04-15"
	hora_inicio: string; // "09:00"
	hora_fin: string; // "09:30"
	duracion_min: 30 | 60;
	es_primera_vez: boolean;
	estado: CitaEstado;
	motivo_consulta?: string;
	observaciones?: string;
	notas_admin?: string;
	created_at: string;
	created_by: string;
}

export interface CitaConPaciente extends Cita {
	paciente: Paciente;
	doctor: DoctorConEspecialidad;
}

// ─── Filtros ─────────────────────────────────────────────

export interface AppointmentFilters {
	fecha?: string;
	doctor_id?: string;
	especialidad_id?: string;
	estado?: CitaEstado;
	search?: string;
	page?: number;
	page_size?: number;
}

// ─── Respuestas de acciones ──────────────────────────────

export interface ObtenerSlotsResult {
	slots: TimeSlot[];
	duracion: 30 | 60;
	es_primera_vez: boolean;
	mensaje?: string;
}

export interface ConfirmarCitaResult {
	citaId: string;
	confirmationCode: string;
}

// ─── Paginación (formato del backend) ───────────────────

export interface PaginationMeta {
	total: number;
	page: number;
	page_size: number;
	pages: number;
	has_next: boolean;
}

export interface PaginatedResponse<T> {
	items: T[];
	pagination: PaginationMeta;
}
