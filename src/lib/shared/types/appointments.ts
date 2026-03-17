// ============================================================
// Tipos del Módulo de Citas
// Contrato compartido entre servicios server y componentes UI.
// ============================================================

// ─── Catálogos ───────────────────────────────────────────────

export interface Especialidad {
	id: number;
	nombre: string;
	activo: boolean;
}

// ─── Doctores ────────────────────────────────────────────────

export interface Doctor {
	id: number;
	nombre: string;
	apellido: string;
	especialidad_id: number;
	activo: boolean;
}

export interface DoctorConEspecialidad extends Doctor {
	especialidad: Especialidad;
}

/** Versión reducida para selects/dropdowns */
export interface DoctorOption {
	id: number;
	nombreCompleto: string;
	especialidad: string;
	especialidadId: number;
	diasTrabajo: number[]; // 1=Lun … 5=Vie (días en que el doctor atiende)
}

export interface DisponibilidadDoctor {
	id: number;
	doctor_id: number;
	/** 1 = Lunes … 5 = Viernes */
	day_of_week: 1 | 2 | 3 | 4 | 5;
	hora_inicio: string; // "08:00"
	hora_fin: string; // "17:00"
	duracion_slot: number; // minutos, default 30
}

// ─── Pacientes ───────────────────────────────────────────────

export type RelacionUniversidad = 'empleado' | 'estudiante' | 'profesor' | 'tercero';
export type Parentesco = 'hijo' | 'padre' | 'madre';

export interface DatosMedicos {
	tipo_sangre?: string;
	alergias?: string[];
	numero_contacto?: string;
	condiciones?: string[];
}

export interface Paciente {
	id: number;
	nhm: number;
	cedula: string;
	nombre: string;
	apellido: string;
	relacion_univ: RelacionUniversidad;
	parentesco?: Parentesco;
	titular_nhm?: number;
	datos_medicos: DatosMedicos;
	es_nuevo: boolean;
	created_at: string;
}

/** Versión pública sin datos sensibles internos */
export type PacientePublic = Pick<
	Paciente,
	'id' | 'nhm' | 'nombre' | 'apellido' | 'relacion_univ' | 'es_nuevo'
>;

// ─── Slots ───────────────────────────────────────────────────

export interface TimeSlot {
	hora_inicio: string; // "09:00"
	hora_fin: string; // "09:30"
	disponible: boolean;
}

// ─── Citas ───────────────────────────────────────────────────

export type CitaEstado = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';

export interface Cita {
	id: number;
	paciente_id: number;
	doctor_id: number;
	especialidad_id: number;
	fecha: string; // ISO date "2025-04-15"
	hora_inicio: string; // "09:00"
	hora_fin: string; // "09:30"
	duracion_min: 30 | 60;
	es_primera_vez: boolean;
	estado: CitaEstado;
	motivo_consulta?: string;
	notas_admin?: string;
	created_at: string;
	created_by: string;
}

export interface CitaConPaciente extends Cita {
	paciente: Paciente;
	doctor: DoctorConEspecialidad;
}

// ─── Historias Médicas ───────────────────────────────────────

export interface ExamenFisico {
	ta?: string; // tensión arterial
	fc?: string; // frecuencia cardíaca
	fr?: string; // frecuencia respiratoria
	temp?: string; // temperatura
	peso?: string;
	talla?: string;
}

export interface Diagnostico {
	cie10?: string;
	descripcion?: string;
}

export interface Evaluacion {
	motivo_consulta?: string;
	anamnesis?: string;
	examen_fisico?: ExamenFisico;
	diagnostico?: Diagnostico;
	tratamiento?: string;
	indicaciones?: string;
}

export interface HistoriaMedica {
	id: number;
	cita_id: number;
	paciente_id: number;
	doctor_id: number;
	evaluacion: Evaluacion;
	preparado: boolean;
	preparado_at?: string;
	created_at: string;
	updated_at: string;
}

// ─── Filtros ─────────────────────────────────────────────────

export interface AppointmentFilters {
	fecha?: string;
	doctorId?: number;
	especialidadId?: number;
	estado?: CitaEstado;
	search?: string;
	page?: number;
	pageSize?: number;
}

// ─── Respuestas de acciones ──────────────────────────────────

export interface BuscarPacienteResult {
	found: boolean;
	paciente?: PacientePublic;
	query?: string;
}

export interface ObtenerSlotsResult {
	slots: TimeSlot[];
	duracion: 30 | 60;
	es_primera_vez: boolean;
	mensaje?: string;
}

export interface ConfirmarCitaResult {
	citaId: number;
	confirmationCode: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	hasNext: boolean;
}
