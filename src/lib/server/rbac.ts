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
		doctor_id: 'doc-001'
	},
	admin: {
		id: 'adm-1',
		name: 'Admin Principal',
		role: 'admin',
		initials: 'AP',
		doctor_id: 'doc-001'
	},
	farmaceutico: {
		id: 'far-1',
		name: 'María Fernández',
		role: 'farmaceutico',
		initials: 'MF',
		pharmacistId: 'far-uuid-1'
	}
};

// ─── Route → Permission (acceso al módulo) ───────────────────

export const ROUTE_PERMISSIONS: Record<string, string> = {
	'': P.DASHBOARD_READ,
	'agendar': P.CITAS_CREATE,
	'mis-citas': P.CITAS_READ,
	'analista/citas': P.CITAS_CANCEL,
	'analista/horarios': P.DISPONIBILIDAD_READ,
	'doctor/citas': P.CITAS_MARK_ATTENDED,
	'doctor/disponibilidad': P.DISPONIBILIDAD_READ,
	'appointments': P.CITAS_READ,
	'patients': P.PACIENTES_READ,
	// Inventario — 'inventory' cubre todas las sub-rutas por startsWith
	'inventory': P.INVENTORY_READ,
	'inventory/suppliers': P.INVENTORY_WRITE,
	'inventory/purchase-orders': P.INVENTORY_WRITE,
	'inventory/dispatches': P.INVENTORY_DISPATCH,
	'inventory/categories': P.INVENTORY_WRITE,
	'inventory/movements': P.INVENTORY_READ,
	'inventory/alerts': P.INVENTORY_READ,
	'inventory/limits': P.INVENTORY_ADMIN,
	'inventory/reports': P.INVENTORY_REPORTS,
	// Recipe del doctor
	'doctor/citas/[citaId]/prescription': P.RECIPE_WRITE,
	// Admin
	'admin/configuracion': P.SETTINGS_READ,
	'reportes': P.DASHBOARD_READ
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
	obtenerSlots: P.CITAS_CREATE,
	// /admin/configuracion
	guardarEspecialidad: P.SETTINGS_WRITE,
	toggleEspecialidad: P.SETTINGS_WRITE,
	eliminarEspecialidad: P.SETTINGS_WRITE,
	guardarSchema: P.SETTINGS_WRITE,
	// /inventory/medications
	crearMedicamento: P.INVENTORY_WRITE,
	editarMedicamento: P.INVENTORY_WRITE,
	// /inventory/suppliers
	crearProveedor: P.INVENTORY_WRITE,
	editarProveedor: P.INVENTORY_WRITE,
	// /inventory/purchase-orders
	crearOrden: P.INVENTORY_WRITE,
	enviarOrden: P.INVENTORY_WRITE,
	recibirOrden: P.INVENTORY_WRITE,
	// /inventory/dispatches
	validarDespacho: P.INVENTORY_DISPATCH,
	ejecutarDespacho: P.INVENTORY_DISPATCH,
	cancelarDespacho: P.INVENTORY_DISPATCH,
	// /inventory/limits
	crearLimite: P.INVENTORY_ADMIN,
	editarLimite: P.INVENTORY_ADMIN,
	crearExcepcion: P.INVENTORY_ADMIN,
	// /doctor/citas/[citaId]/prescription
	emitirRecipe: P.RECIPE_WRITE
};

// ─── Guard helpers ───────────────────────────────────────────

export function getRequiredPermission(routePath: string): string | null {
	// Sort by pattern length descending so more specific routes match first
	// e.g. 'inventory/suppliers' before 'inventory'
	const sorted = Object.entries(ROUTE_PERMISSIONS).sort(
		(a, b) => b[0].length - a[0].length
	);
	for (const [pattern, permission] of sorted) {
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
 * Obtiene el doctor_id del usuario o lanza 403.
 */
export function requireDoctorId(user: AuthUser | null): string {
	if (!user) error(401, 'No autenticado');
	if (!user.doctor_id) error(403, 'Se requiere rol de doctor');
	return user.doctor_id;
}
