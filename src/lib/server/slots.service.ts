// ============================================================
// Servicio de slots — función pura, sin dependencia de DB.
// Calcula los bloques de tiempo disponibles para un doctor
// en una fecha dada, restando los ya ocupados.
// ============================================================

import type { DisponibilidadDoctor, TimeSlot, Cita } from '$shared/types/appointments.js';

/** Convierte "HH:MM" a minutos desde medianoche */
function toMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

/** Convierte minutos desde medianoche a "HH:MM" */
function fromMinutes(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Genera todos los slots para una disponibilidad dada,
 * luego marca como no disponibles los que se solapan con citas existentes.
 *
 * @param disponibilidad  Bloques de horario del doctor para ese día de la semana
 * @param existingCitas   Citas ya agendadas (no canceladas) para ese doctor/fecha
 * @param duracionMin     30 (cita normal) | 60 (primera vez)
 */
export function computeAvailableSlots(
	disponibilidad: DisponibilidadDoctor[],
	existingCitas: Pick<Cita, 'hora_inicio' | 'hora_fin'>[],
	duracionMin: 30 | 60
): TimeSlot[] {
	const slots: TimeSlot[] = [];

	// Construir set de rangos ocupados para lookup O(1)
	const occupied = existingCitas.map((c) => ({
		start: toMinutes(c.hora_inicio),
		end: toMinutes(c.hora_fin)
	}));

	for (const bloque of disponibilidad) {
		const bloqueStart = toMinutes(bloque.hora_inicio);
		const bloqueEnd = toMinutes(bloque.hora_fin);

		// Generar slots usando la duración solicitada (no la del bloque)
		let cursor = bloqueStart;
		while (cursor + duracionMin <= bloqueEnd) {
			const slotStart = cursor;
			const slotEnd = cursor + duracionMin;

			// Un slot está disponible si no se solapa con ninguna cita existente
			const isOccupied = occupied.some((o) => slotStart < o.end && slotEnd > o.start);

			slots.push({
				hora_inicio: fromMinutes(slotStart),
				hora_fin: fromMinutes(slotEnd),
				disponible: !isOccupied
			});

			// Avanzar por el slot base del bloque (30 min), no por duracionMin,
			// para que los slots de 60 min no se salten huecos disponibles
			cursor += bloque.duracion_slot;
		}
	}

	return slots;
}

/**
 * Calcula la fecha mínima válida para agendar.
 * Regla buffer: no se puede agendar para hoy ni para mañana.
 * Mínimo = hoy + 2 días.
 */
export function getMinBookingDate(): string {
	const d = new Date();
	d.setDate(d.getDate() + 2);
	return d.toISOString().slice(0, 10);
}

/**
 * Verifica si una fecha dada respeta la regla de buffer (>= hoy + 2 días).
 */
export function isDateAllowed(fechaISO: string): boolean {
	return fechaISO >= getMinBookingDate();
}
