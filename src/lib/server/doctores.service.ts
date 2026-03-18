import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockDoctores, mockDoctorOptions, mockEspecialidades, mockDisponibilidad } from './mock/data.js';
import type { DoctorConEspecialidad, DoctorOption, Especialidad, DisponibilidadDoctor } from '$shared/types/appointments.js';

export async function getActiveDoctores(): Promise<DoctorConEspecialidad[]> {
	if (mockFlags.doctores) return mockDoctores.filter((d) => d.activo);
	return apiFetch<DoctorConEspecialidad[]>('/doctores?activo=true');
}

export async function getDoctorOptions(): Promise<DoctorOption[]> {
	if (mockFlags.doctores) {
		return mockDoctores.filter((d) => d.activo).map((d) => ({
			id: d.id,
			nombreCompleto: `${d.nombre} ${d.apellido}`,
			especialidad: d.especialidad.nombre,
			especialidadId: d.especialidad_id,
			diasTrabajo: [...new Set(
				mockDisponibilidad
					.filter((disp) => disp.doctor_id === d.id)
					.map((disp) => disp.day_of_week)
			)]
		}));
	}
	return apiFetch<DoctorOption[]>('/doctores/opciones');
}

export async function getEspecialidades(): Promise<Especialidad[]> {
	if (mockFlags.doctores) return mockEspecialidades.filter((e) => e.activo);
	return apiFetch<Especialidad[]>('/especialidades');
}

/**
 * Devuelve los bloques de disponibilidad del doctor para un día de la semana.
 * @param doctorId
 * @param dayOfWeek  1=Lunes … 5=Viernes
 */
export async function getAllDisponibilidad(doctorId: number): Promise<DisponibilidadDoctor[]> {
	if (mockFlags.doctores) {
		return mockDisponibilidad.filter((d) => d.doctor_id === doctorId);
	}
	return apiFetch<DisponibilidadDoctor[]>(`/doctores/${doctorId}/disponibilidad`);
}

export async function getDisponibilidad(doctorId: number, dayOfWeek: number): Promise<DisponibilidadDoctor[]> {
	if (mockFlags.doctores) {
		return mockDisponibilidad.filter(
			(d) => d.doctor_id === doctorId && d.day_of_week === dayOfWeek
		);
	}
	return apiFetch<DisponibilidadDoctor[]>(`/doctores/${doctorId}/disponibilidad?dow=${dayOfWeek}`);
}

/**
 * Verifica si hay una excepción (día libre/feriado) para el doctor en esa fecha.
 */
export async function hasExcepcion(doctorId: number, fecha: string): Promise<boolean> {
	if (mockFlags.doctores) return false; // mock: nunca hay excepciones
	const res = await apiFetch<{ excepcion: boolean }>(`/doctores/${doctorId}/excepciones?fecha=${fecha}`);
	return res.excepcion;
}

// ─── CRUD de disponibilidad ──────────────────────────────────

export interface CreateDisponibilidadInput {
	doctor_id: number;
	day_of_week: 1 | 2 | 3 | 4 | 5;
	hora_inicio: string;
	hora_fin: string;
	duracion_slot?: number;
}

export async function createDisponibilidad(input: CreateDisponibilidadInput): Promise<DisponibilidadDoctor> {
	if (mockFlags.doctores) {
		const maxId = mockDisponibilidad.length > 0 ? Math.max(...mockDisponibilidad.map((d) => d.id)) : 0;
		const nuevo: DisponibilidadDoctor = {
			id: maxId + 1,
			doctor_id: input.doctor_id,
			day_of_week: input.day_of_week,
			hora_inicio: input.hora_inicio,
			hora_fin: input.hora_fin,
			duracion_slot: input.duracion_slot ?? 30
		};
		mockDisponibilidad.push(nuevo);
		return nuevo;
	}
	return apiFetch<DisponibilidadDoctor>(`/doctores/${input.doctor_id}/disponibilidad`, {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function deleteDisponibilidad(doctorId: number, bloqueId: number): Promise<void> {
	if (mockFlags.doctores) {
		const idx = mockDisponibilidad.findIndex((d) => d.id === bloqueId && d.doctor_id === doctorId);
		if (idx !== -1) mockDisponibilidad.splice(idx, 1);
		return;
	}
	await apiFetch(`/doctores/${doctorId}/disponibilidad/${bloqueId}`, { method: 'DELETE' });
}
