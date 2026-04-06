import type { Paciente } from '$domain/patients/types.js';
import type { HistorialPrevioEntry } from '$domain/medical-records/types.js';

export interface PatientAlert {
	type: 'danger' | 'warning' | 'info';
	label: string;
	detail?: string;
}

/**
 * Calcula alertas determinísticas a partir de los datos del paciente y su historial.
 * Lógica pura, sin side effects.
 */
export function computeAlerts(
	paciente: Paciente,
	previousHistories: HistorialPrevioEntry[],
	currentSpecialty?: string
): PatientAlert[] {
	const alerts: PatientAlert[] = [];

	// Alergias (siempre danger)
	const alergias = paciente.datos_medicos?.alergias ?? [];
	if (alergias.length > 0) {
		alerts.push({
			type: 'danger',
			label: 'Alergias',
			detail: alergias.join(', ')
		});
	}

	// Condiciones activas
	const condiciones = paciente.datos_medicos?.condiciones ?? [];
	for (const condicion of condiciones) {
		const lower = condicion.toLowerCase();
		if (lower.includes('diabetes') || lower.includes('diabét')) {
			alerts.push({ type: 'warning', label: 'Diabético', detail: condicion });
		} else if (lower.includes('hipertens')) {
			alerts.push({ type: 'warning', label: 'Hipertenso', detail: condicion });
		} else {
			alerts.push({ type: 'info', label: condicion });
		}
	}

	// Primera vez con esta especialidad
	if (currentSpecialty && previousHistories.length > 0) {
		const hasSpecialtyHistory = previousHistories.some(
			(h) => h.especialidad.toLowerCase() === currentSpecialty.toLowerCase()
		);
		if (!hasSpecialtyHistory) {
			alerts.push({
				type: 'info',
				label: `Primera vez en ${currentSpecialty}`
			});
		}
	}

	// Última consulta
	if (previousHistories.length > 0) {
		const lastDate = previousHistories[0].fecha;
		const daysDiff = daysBetween(lastDate, new Date().toISOString().split('T')[0]);
		if (daysDiff > 365) {
			alerts.push({
				type: 'warning',
				label: `Sin consulta hace ${Math.floor(daysDiff / 30)} meses`
			});
		}
	} else {
		alerts.push({ type: 'info', label: 'Sin historial previo' });
	}

	return alerts;
}

/** Calcula días entre dos fechas ISO (YYYY-MM-DD) */
function daysBetween(dateA: string, dateB: string): number {
	const a = new Date(dateA);
	const b = new Date(dateB);
	return Math.abs(Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Formatea la edad del paciente con unidades apropiadas */
export function formatAge(edad?: number): string {
	if (edad === undefined || edad === null) return '—';
	if (edad < 1) return 'Menor de 1 año';
	return `${edad} año${edad !== 1 ? 's' : ''}`;
}

/** Formatea la relación universitaria */
export function formatRelacion(relacion: string): string {
	const map: Record<string, string> = {
		empleado: 'Empleado',
		estudiante: 'Estudiante',
		profesor: 'Profesor',
		tercero: 'Tercero'
	};
	return map[relacion] ?? relacion;
}
