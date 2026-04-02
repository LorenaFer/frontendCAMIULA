// ============================================================
// RBAC Configuration — Compartido entre client y server
// Estándar: recurso:accion (NIST RBAC Level 2)
// ============================================================

import type { UserRole } from '$shared/types/auth.js';

// ─── Permisos granulares ─────────────────────────────────────

export const P = {
	// Citas
	CITAS_READ: 'citas:read',
	CITAS_CREATE: 'citas:create',
	CITAS_CANCEL: 'citas:cancel',
	CITAS_MARK_ATTENDED: 'citas:mark_attended',
	CITAS_MARK_NOSHOW: 'citas:mark_noshow',
	CITAS_CREATE_EMERGENCY: 'citas:create_emergency',
	CITAS_EXPORT: 'citas:export',

	// Pacientes
	PACIENTES_READ: 'pacientes:read',
	PACIENTES_CREATE: 'pacientes:create',

	// Disponibilidad
	DISPONIBILIDAD_READ: 'disponibilidad:read',
	DISPONIBILIDAD_CREATE: 'disponibilidad:create',
	DISPONIBILIDAD_UPDATE: 'disponibilidad:update',
	DISPONIBILIDAD_DELETE: 'disponibilidad:delete',

	// Evaluaciones médicas
	EVALUACIONES_READ: 'evaluaciones:read',
	EVALUACIONES_WRITE: 'evaluaciones:write',

	// Sistema
	DASHBOARD_READ: 'dashboard:read',
	INVENTORY_READ: 'inventory:read',

	// Configuración (admin)
	SETTINGS_READ: 'settings:read',
	SETTINGS_WRITE: 'settings:write',

	// Inventario (módulo farmacia)
	INVENTORY_WRITE: 'inventory:write',
	INVENTORY_DISPATCH: 'inventory:dispatch',
	INVENTORY_REPORTS: 'inventory:reports',
	INVENTORY_ADMIN: 'inventory:admin',

	// Recetas médicas
	RECIPE_WRITE: 'recipe:write',
	RECIPE_READ: 'recipe:read'
} as const;

export type Permission = (typeof P)[keyof typeof P];

// ─── Matriz Rol → Permisos ───────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	paciente: [
		P.CITAS_CREATE,
		P.CITAS_READ,
		P.PACIENTES_READ,
		P.PACIENTES_CREATE
	],

	analista: [
		P.DASHBOARD_READ,
		P.CITAS_READ,
		P.CITAS_CREATE,
		P.CITAS_CANCEL,
		P.CITAS_EXPORT,
		P.PACIENTES_READ,
		P.PACIENTES_CREATE,
		P.DISPONIBILIDAD_READ,
		P.INVENTORY_READ,
		P.INVENTORY_REPORTS,
		P.RECIPE_READ
	],

	doctor: [
		P.DASHBOARD_READ,
		P.CITAS_READ,
		P.CITAS_CREATE,
		P.CITAS_MARK_ATTENDED,
		P.CITAS_MARK_NOSHOW,
		P.CITAS_CREATE_EMERGENCY,
		P.PACIENTES_READ,
		P.DISPONIBILIDAD_READ,
		P.DISPONIBILIDAD_CREATE,
		P.DISPONIBILIDAD_UPDATE,
		P.DISPONIBILIDAD_DELETE,
		P.EVALUACIONES_READ,
		P.EVALUACIONES_WRITE,
		P.INVENTORY_READ,
		P.RECIPE_WRITE,
		P.RECIPE_READ
	],

	farmaceutico: [
		P.DASHBOARD_READ,
		P.INVENTORY_READ,
		P.INVENTORY_DISPATCH,
		P.INVENTORY_REPORTS,
		P.RECIPE_READ,
		P.PACIENTES_READ
	],

	admin: Object.values(P)
};

// ─── Helpers ─────────────────────────────────────────────────

export function getPermissionsForRole(role: UserRole): Permission[] {
	return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: string): boolean {
	return getPermissionsForRole(role).includes(permission as Permission);
}
