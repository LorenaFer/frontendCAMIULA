import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockEspecialidades } from './mock/data.js';
import type { Especialidad } from '$shared/types/appointments.js';

// ─── Mock mutable store ─────────────────────────────────────
let mockStore = [...mockEspecialidades];

// ─── CRUD ───────────────────────────────────────────────────

export async function getAll(): Promise<Especialidad[]> {
	if (mockFlags.doctores) return [...mockStore];
	return apiFetch<Especialidad[]>('/specialties');
}

export async function create(input: { nombre: string }): Promise<Especialidad> {
	if (mockFlags.doctores) {
		const nueva: Especialidad = {
			id: `esp-${Date.now()}`,
			nombre: input.nombre,
			activo: true
		};
		mockStore.push(nueva);
		return nueva;
	}
	return apiFetch<Especialidad>('/specialties', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function update(id: string, input: Partial<Especialidad>): Promise<Especialidad> {
	if (mockFlags.doctores) {
		const idx = mockStore.findIndex((e) => e.id === id);
		if (idx === -1) throw new Error('Especialidad no encontrada');
		mockStore[idx] = { ...mockStore[idx], ...input };
		return mockStore[idx];
	}
	return apiFetch<Especialidad>(`/specialties/${id}`, {
		method: 'PUT',
		body: JSON.stringify(input)
	});
}

export async function toggleActive(id: string): Promise<Especialidad> {
	if (mockFlags.doctores) {
		const idx = mockStore.findIndex((e) => e.id === id);
		if (idx === -1) throw new Error('Especialidad no encontrada');
		mockStore[idx] = { ...mockStore[idx], activo: !mockStore[idx].activo };
		return mockStore[idx];
	}
	return apiFetch<Especialidad>(`/specialties/${id}/toggle`, { method: 'PATCH' });
}
