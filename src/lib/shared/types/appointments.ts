// ============================================================
// Tipos del Módulo de Citas
// Contrato compartido entre servicios server y componentes UI.
// IDs son UUIDs (string) — coincide con el backend FastAPI.
// ============================================================

// ─── Catálogos ───────────────────────────────────────────────

export interface Especialidad {
	id: string;
	nombre: string;
	activo: boolean;
}

// ─── Doctores ────────────────────────────────────────────────

export interface Doctor {
	id: string;
	nombre: string;
	apellido: string;
	especialidad_id: string;
	activo: boolean;
}

export interface DoctorConEspecialidad extends Doctor {
	especialidad: Especialidad;
}

/** Versión reducida para selects/dropdowns — campos snake_case del backend */
export interface DoctorOption {
	id: string;
	nombre_completo: string;
	especialidad: string;
	especialidad_id: string;
	dias_trabajo: number[]; // 1=Lun … 5=Vie (días en que el doctor atiende)
}

export interface DisponibilidadDoctor {
	id: string;
	doctor_id: string;
	/** 1 = Lunes … 5 = Viernes */
	day_of_week: 1 | 2 | 3 | 4 | 5;
	hora_inicio: string; // "08:00"
	hora_fin: string; // "17:00"
	duracion_slot: number; // minutos, default 30
}

// ─── Pacientes ───────────────────────────────────────────────

export type RelacionUniversidad = 'empleado' | 'estudiante' | 'profesor' | 'tercero';
export type Parentesco = 'hijo' | 'padre' | 'madre' | 'conyuge' | 'otro';
export type Sexo = 'M' | 'F';
export type EstadoCivil = 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre';

export interface DatosMedicos {
	tipo_sangre?: string;
	alergias?: string[];
	numero_contacto?: string;
	condiciones?: string[];
}

/** Datos del contacto de emergencia / familiar más cercano */
export interface ContactoEmergencia {
	nombre?: string;
	parentesco?: string;
	direccion?: string;
	telefono?: string;
}

export interface Paciente {
	id: string;
	nhm: number;
	cedula: string;
	nombre: string;
	apellido: string;
	sexo?: Sexo;
	fecha_nacimiento?: string; // ISO date
	lugar_nacimiento?: string;
	edad?: number;
	estado_civil?: EstadoCivil;
	religion?: string;
	procedencia?: string;
	direccion_habitacion?: string;
	telefono?: string;
	profesion?: string;
	ocupacion_actual?: string;
	direccion_trabajo?: string;
	clasificacion_economica?: string;
	relacion_univ: RelacionUniversidad;
	parentesco?: Parentesco;
	titular_nhm?: number;
	datos_medicos: DatosMedicos;
	contacto_emergencia?: ContactoEmergencia;
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
	id: string;
	cita_id: string;
	paciente_id: string;
	doctor_id: string;
	evaluacion: Evaluacion;
	preparado: boolean;
	preparado_at?: string;
	created_at: string;
	updated_at: string;
}

// ─── Filtros ─────────────────────────────────────────────────

export interface AppointmentFilters {
	fecha?: string;
	doctor_id?: string;
	especialidad_id?: string;
	estado?: CitaEstado;
	search?: string;
	page?: number;
	page_size?: number;
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
	citaId: string;
	confirmationCode: string;
}

// ─── Paginación (formato del backend) ───────────────────────

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
