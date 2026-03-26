import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockHistorias } from './mock/data.js';
import type { HistoriaMedica, Evaluacion } from '$shared/types/appointments.js';
import type { HistorialPrevioEntry } from '$shared/types/medical-records.js';

export async function findByCita(citaId: string): Promise<HistoriaMedica | null> {
	if (mockFlags.historias) {
		return mockHistorias.find((h) => h.cita_id === citaId) ?? null;
	}
	return apiFetch<HistoriaMedica | null>(`/medical-records?appointment_id=${citaId}`);
}

export async function upsertHistoria(
	citaId: string,
	pacienteId: string,
	doctorId: string,
	evaluacion: Evaluacion
): Promise<HistoriaMedica> {
	if (mockFlags.historias) {
		const existing = mockHistorias.find((h) => h.cita_id === citaId);
		if (existing) {
			existing.evaluacion = evaluacion;
			existing.updated_at = new Date().toISOString();
			return existing;
		}
		const nueva: HistoriaMedica = {
			id: crypto.randomUUID(),
			cita_id: citaId,
			paciente_id: pacienteId,
			doctor_id: doctorId,
			evaluacion,
			preparado: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		mockHistorias.push(nueva);
		return nueva;
	}
	return apiFetch<HistoriaMedica>('/medical-records', {
		method: 'PUT',
		body: JSON.stringify({ cita_id: citaId, paciente_id: pacienteId, doctor_id: doctorId, evaluacion })
	});
}

export async function findByPaciente(
	pacienteId: string,
	options?: { limit?: number; excludeCitaId?: string }
): Promise<HistorialPrevioEntry[]> {
	const limit = options?.limit ?? 5;

	if (mockFlags.historias) {
		return mockHistorias
			.filter(
				(h) =>
					h.paciente_id === pacienteId &&
					(!options?.excludeCitaId || h.cita_id !== options.excludeCitaId)
			)
			.sort((a, b) => b.created_at.localeCompare(a.created_at))
			.slice(0, limit)
			.map((h) => ({
				id: h.id,
				fecha: h.created_at.split('T')[0],
				especialidad: 'Medicina General',
				doctor_nombre: 'Dr. Mock',
				diagnostico_descripcion: h.evaluacion.diagnostico?.descripcion,
				diagnostico_cie10: h.evaluacion.diagnostico?.cie10
			}));
	}

	return apiFetch<HistorialPrevioEntry[]>(
		`/medical-records/patient/${pacienteId}?limit=${limit}${options?.excludeCitaId ? `&exclude=${options.excludeCitaId}` : ''}`
	);
}

export async function upsertHistoriaDynamic(
	citaId: string,
	pacienteId: string,
	doctorId: string,
	evaluacion: Record<string, unknown>,
	schemaId: string,
	schemaVersion: string
): Promise<HistoriaMedica> {
	if (mockFlags.historias) {
		const existing = mockHistorias.find((h) => h.cita_id === citaId);
		if (existing) {
			existing.evaluacion = evaluacion as Evaluacion;
			existing.updated_at = new Date().toISOString();
			return existing;
		}
		const nueva: HistoriaMedica = {
			id: crypto.randomUUID(),
			cita_id: citaId,
			paciente_id: pacienteId,
			doctor_id: doctorId,
			evaluacion: evaluacion as Evaluacion,
			preparado: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		mockHistorias.push(nueva);
		return nueva;
	}
	return apiFetch<HistoriaMedica>('/medical-records', {
		method: 'PUT',
		body: JSON.stringify({
			cita_id: citaId,
			paciente_id: pacienteId,
			doctor_id: doctorId,
			evaluacion,
			schema_id: schemaId,
			schema_version: schemaVersion
		})
	});
}

export async function marcarPreparado(historiaId: string, preparadoPor: string): Promise<void> {
	if (mockFlags.historias) {
		const h = mockHistorias.find((x) => x.id === historiaId);
		if (h) {
			h.preparado = true;
			h.preparado_at = new Date().toISOString();
		}
		return;
	}
	await apiFetch(`/medical-records/${historiaId}/prepared`, {
		method: 'PATCH',
		body: JSON.stringify({ preparado_por: preparadoPor })
	});
}
