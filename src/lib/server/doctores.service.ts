import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockDoctores, mockDoctorOptions, mockEspecialidades, mockDisponibilidad } from './mock/data.js';
import type { DoctorConEspecialidad, DoctorOption, Especialidad, DisponibilidadDoctor } from '$shared/types/appointments.js';

export async function getActiveDoctores(): Promise<DoctorConEspecialidad[]> {
	if (mockFlags.doctores) return mockDoctores.filter((d) => d.activo);
	return apiFetch<DoctorConEspecialidad[]>('/doctors?active=true');
}

export async function getDoctorOptions(): Promise<DoctorOption[]> {
	if (mockFlags.doctores) {
		return mockDoctores.filter((d) => d.activo).map((d) => ({
			id: d.id,
			nombre_completo: `${d.nombre} ${d.apellido}`,
			especialidad: d.especialidad.nombre,
			especialidad_id: d.especialidad_id,
			dias_trabajo: [...new Set(
				mockDisponibilidad
					.filter((disp) => disp.doctor_id === d.id)
					.map((disp) => disp.day_of_week)
			)]
		}));
	}
	return apiFetch<DoctorOption[]>('/doctors/options');
}

export async function getEspecialidades(): Promise<Especialidad[]> {
	if (mockFlags.doctores) return mockEspecialidades.filter((e) => e.activo);
	return apiFetch<Especialidad[]>('/specialties');
}

/**
 * Devuelve todos los bloques de disponibilidad del doctor.
 */
export async function getAllDisponibilidad(doctorId: string): Promise<DisponibilidadDoctor[]> {
	if (mockFlags.doctores) {
		return mockDisponibilidad.filter((d) => d.doctor_id === doctorId);
	}
	return apiFetch<DisponibilidadDoctor[]>(`/doctors/${doctorId}/availability`);
}

/**
 * Devuelve los bloques de disponibilidad del doctor para un día de la semana.
 * @param dayOfWeek  1=Lunes … 5=Viernes
 */
export async function getDisponibilidad(doctorId: string, dayOfWeek: number): Promise<DisponibilidadDoctor[]> {
	if (mockFlags.doctores) {
		return mockDisponibilidad.filter(
			(d) => d.doctor_id === doctorId && d.day_of_week === dayOfWeek
		);
	}
	return apiFetch<DisponibilidadDoctor[]>(`/doctors/${doctorId}/availability?dow=${dayOfWeek}`);
}

/**
 * Verifica si hay una excepción (día libre/feriado) para el doctor en esa fecha.
 */
export async function hasExcepcion(doctorId: string, fecha: string): Promise<boolean> {
	if (mockFlags.doctores) return false; // mock: nunca hay excepciones
	const res = await apiFetch<{ excepcion: boolean }>(`/doctors/${doctorId}/exceptions?date=${fecha}`);
	return res.excepcion;
}

// ─── CRUD de disponibilidad ──────────────────────────────────

export interface CreateDisponibilidadInput {
	doctor_id: string;
	day_of_week: 1 | 2 | 3 | 4 | 5;
	hora_inicio: string;
	hora_fin: string;
	duracion_slot?: number;
}

export async function createDisponibilidad(input: CreateDisponibilidadInput): Promise<DisponibilidadDoctor> {
	if (mockFlags.doctores) {
		const nuevo: DisponibilidadDoctor = {
			id: crypto.randomUUID(),
			doctor_id: input.doctor_id,
			day_of_week: input.day_of_week,
			hora_inicio: input.hora_inicio,
			hora_fin: input.hora_fin,
			duracion_slot: input.duracion_slot ?? 30
		};
		mockDisponibilidad.push(nuevo);
		return nuevo;
	}
	return apiFetch<DisponibilidadDoctor>(`/doctors/${input.doctor_id}/availability`, {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function deleteDisponibilidad(doctorId: string, bloqueId: string): Promise<void> {
	if (mockFlags.doctores) {
		const idx = mockDisponibilidad.findIndex((d) => d.id === bloqueId && d.doctor_id === doctorId);
		if (idx !== -1) mockDisponibilidad.splice(idx, 1);
		return;
	}
	await apiFetch(`/doctors/${doctorId}/availability/${bloqueId}`, { method: 'DELETE' });
}

export async function updateDisponibilidad(
	doctorId: string,
	bloqueId: string,
	updates: { hora_inicio?: string; hora_fin?: string }
): Promise<void> {
	if (mockFlags.doctores) {
		const bloque = mockDisponibilidad.find((d) => d.id === bloqueId && d.doctor_id === doctorId);
		if (bloque) {
			if (updates.hora_inicio) bloque.hora_inicio = updates.hora_inicio;
			if (updates.hora_fin) bloque.hora_fin = updates.hora_fin;
		}
		return;
	}
	await apiFetch(`/doctors/${doctorId}/availability/${bloqueId}`, {
		method: 'PATCH',
		body: JSON.stringify(updates)
	});
}
