// ============================================================
// RBAC Server-Only — Mock users, route guards, action guards
// ============================================================

import { error } from '@sveltejs/kit';
import type { UserRole, AuthUser } from '$shared/types/auth.js';
import { hasPermission, P } from '$shared/rbac-config.js';

export { P, hasPermission, getPermissionsForRole, ROLE_PERMISSIONS } from '$shared/rbac-config.js';

// ─── Mock Users ──────────────────────────────────────────────

export const MOCK_USERS: Record<UserRole, AuthUser> = {
	paciente: {
		id: 'pac-1',
		name: 'Pedro González',
		role: 'paciente',
		initials: 'PG'
	},
	analista: {
		id: 'ana-1',
		name: 'Sofía Ramírez',
		role: 'analista',
		initials: 'SR'
	},
	doctor: {
		id: 'doc-1',
		name: 'Dr. Carlos Mendoza',
		role: 'doctor',
		initials: 'CM',
		doctorId: 1
	},
	admin: {
		id: 'adm-1',
		name: 'Admin Principal',
		role: 'admin',
		initials: 'AP',
		doctorId: 1
	}
};

// ─── Route → Permission (acceso al módulo) ───────────────────

export const ROUTE_PERMISSIONS: Record<string, string> = {
	'': P.DASHBOARD_READ,
	'agendar': P.CITAS_CREATE,
	'mis-citas': P.CITAS_READ,
	'analista/citas': P.CITAS_CANCEL,
	'doctor/citas': P.CITAS_MARK_ATTENDED,
	'doctor/disponibilidad': P.DISPONIBILIDAD_READ,
	'appointments': P.CITAS_READ,
	'patients': P.PACIENTES_READ,
	'inventory': P.INVENTORY_READ
};

// ─── Action → Permission (acciones granulares) ───────────────

export const ACTION_PERMISSIONS: Record<string, string> = {
	// /analista/citas
	cancelarCita: P.CITAS_CANCEL,
	exportarExcel: P.CITAS_EXPORT,
	// /doctor/citas
	marcarAtendida: P.CITAS_MARK_ATTENDED,
	marcarNoAsistio: P.CITAS_MARK_NOSHOW,
	citaEmergencia: P.CITAS_CREATE_EMERGENCY,
	// /doctor/citas/[citaId]
	guardarEvaluacion: P.EVALUACIONES_WRITE,
	// /doctor/disponibilidad
	agregar: P.DISPONIBILIDAD_CREATE,
	eliminar: P.DISPONIBILIDAD_DELETE,
	actualizar: P.DISPONIBILIDAD_UPDATE,
	// /agendar
	buscarPaciente: P.PACIENTES_READ,
	registrarPaciente: P.PACIENTES_CREATE,
	confirmarCita: P.CITAS_CREATE,
	obtenerSlots: P.CITAS_CREATE
};

// ─── Guard helpers ───────────────────────────────────────────

export function getRequiredPermission(routePath: string): string | null {
	for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
		if (routePath === pattern || (pattern && routePath.startsWith(pattern + '/'))) {
			return permission;
		}
	}
	return null;
}

/**
 * Lanza error 403 si el usuario no tiene el permiso requerido.
 * Usar en server actions para guard granular.
 */
export function assertPermission(user: AuthUser | null, permission: string): void {
	if (!user) {
		error(401, 'No autenticado');
	}
	if (!hasPermission(user.role, permission)) {
		error(403, `Sin permiso: ${permission}`);
	}
}

/**
 * Guard para server actions — resuelve nombre de acción → permiso → check.
 */
export function assertActionPermission(user: AuthUser | null, actionName: string): void {
	const permission = ACTION_PERMISSIONS[actionName];
	if (!permission) return; // Acción sin permiso configurado = pública
	assertPermission(user, permission);
}

/**
 * Obtiene el doctorId del usuario o lanza 403.
 */
export function requireDoctorId(user: AuthUser | null): number {
	if (!user) error(401, 'No autenticado');
	if (!user.doctorId) error(403, 'Se requiere rol de doctor');
	return user.doctorId;
}
