import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockDoctores, mockEspecialidades, mockDisponibilidad } from './mock/data.js';
import type { DoctorConEspecialidad, DoctorOption, Especialidad, DisponibilidadDoctor } from '$shared/types/appointments.js';
import { mapDoctor, mapDoctorOption, mapSpecialty, mapAvailability, mapAvailabilityToBackend } from './mappers.js';

type R = Record<string, unknown>;

export async function getActiveDoctores(): Promise<DoctorConEspecialidad[]> {
	if (mockFlags.doctores) return mockDoctores.filter((d) => d.activo);
	const raw = await apiFetch<R[]>('/doctors?active=true');
	return raw.map(mapDoctor);
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
	const raw = await apiFetch<R[]>('/doctors/options');
	return raw.map(mapDoctorOption);
}

export async function getEspecialidades(): Promise<Especialidad[]> {
	if (mockFlags.doctores) return mockEspecialidades.filter((e) => e.activo);
	const raw = await apiFetch<R[]>('/specialties');
	return raw.map(mapSpecialty);
}

export async function getAllDisponibilidad(doctorId: string): Promise<DisponibilidadDoctor[]> {
	if (mockFlags.doctores) {
		return mockDisponibilidad.filter((d) => d.doctor_id === doctorId);
	}
	const raw = await apiFetch<R[]>(`/doctors/${doctorId}/availability`);
	return raw.map(mapAvailability);
}

export async function getDisponibilidad(doctorId: string, dayOfWeek: number): Promise<DisponibilidadDoctor[]> {
	if (mockFlags.doctores) {
		return mockDisponibilidad.filter(
			(d) => d.doctor_id === doctorId && d.day_of_week === dayOfWeek
		);
	}
	// Backend usa 0-based (0=Lun), frontend usa 1-based (1=Lun)
	const raw = await apiFetch<R[]>(`/doctors/${doctorId}/availability?dow=${dayOfWeek - 1}`);
	return raw.map(mapAvailability);
}

export async function hasExcepcion(doctorId: string, fecha: string): Promise<boolean> {
	if (mockFlags.doctores) return false;
	const res = await apiFetch<R[]>(`/doctors/${doctorId}/exceptions?date=${fecha}`);
	// Backend devuelve ExceptionResponse[] — si hay alguna, hay excepción
	return Array.isArray(res) && res.length > 0;
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
	const backendData = mapAvailabilityToBackend(input);
	const raw = await apiFetch<R>(`/doctors/${input.doctor_id}/availability`, {
		method: 'POST',
		body: JSON.stringify(backendData)
	});
	return mapAvailability(raw);
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
		body: JSON.stringify({
			start_time: updates.hora_inicio,
			end_time: updates.hora_fin
		})
	});
}
