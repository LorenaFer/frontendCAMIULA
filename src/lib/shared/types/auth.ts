// ============================================================
// Tipos de Autenticación y Autorización
// ============================================================

export type UserRole = 'paciente' | 'analista' | 'doctor' | 'admin' | 'farmaceutico';

export interface AuthUser {
	id: string;
	name: string;
	role: UserRole;
	initials: string;
	/** Solo presente cuando role === 'doctor' o admin con contexto de doctor */
	doctorId?: number;
	/** Solo presente cuando role === 'farmaceutico' */
	pharmacistId?: string;
}
