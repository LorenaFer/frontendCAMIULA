// ============================================================
// Export service — stub inicial.
// Implementar con exceljs cuando el módulo de analistas esté activo.
// ============================================================

import type { CitaConPaciente } from '$shared/types/appointments.js';

/**
 * Genera un buffer Excel con las citas proporcionadas.
 * Stub: devuelve un CSV simple hasta que se instale exceljs.
 */
export async function toExcel(citas: CitaConPaciente[]): Promise<Uint8Array> {
	const header = ['ID', 'Fecha', 'Hora', 'Paciente', 'NHM', 'Cédula', 'Doctor', 'Especialidad', 'Estado', 'Duración'];
	const rows = citas.map((c) => [
		c.id,
		c.fecha,
		c.hora_inicio,
		`${c.paciente.nombre} ${c.paciente.apellido}`,
		c.paciente.nhm,
		c.paciente.cedula,
		`${c.doctor.nombre} ${c.doctor.apellido}`,
		c.doctor.especialidad.nombre,
		c.estado,
		`${c.duracion_min} min`
	]);

	const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
	return new TextEncoder().encode(csv);
}

export function getExportFilename(): string {
	const date = new Date().toISOString().slice(0, 10);
	return `citas_${date}.csv`;
}
