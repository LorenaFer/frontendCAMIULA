// ============================================================
// Tipos del Dominio: Administración
// ============================================================

export type RoleName = 'admin' | 'doctor' | 'analista' | 'farmaceuta' | 'paciente';

export interface User {
	id: string;
	email: string;
	nombre: string;
	apellido: string;
	roles: RoleName[];
	created_at: string;
	last_login?: string | null;
	active: boolean;
}

export interface Especialidad {
	id: string;
	nombre: string;
	descripcion?: string;
	activa: boolean;
	tiene_schema: boolean;
	created_at: string;
}

export interface FormSchemaSummary {
	especialidad: string;
	version: number;
	updated_at: string;
}
