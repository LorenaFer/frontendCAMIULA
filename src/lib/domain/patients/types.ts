// ============================================================
// Tipos del Dominio: Pacientes
// ============================================================

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

export interface BuscarPacienteResult {
	found: boolean;
	paciente?: PacientePublic;
	query?: string;
}
