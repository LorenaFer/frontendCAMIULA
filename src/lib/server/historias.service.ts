import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockHistorias } from './mock/data.js';
import type { HistoriaMedica, Evaluacion } from '$shared/types/appointments.js';

export async function findByCita(citaId: number): Promise<HistoriaMedica | null> {
	if (mockFlags.historias) {
		return mockHistorias.find((h) => h.cita_id === citaId) ?? null;
	}
	return apiFetch<HistoriaMedica | null>(`/historias?cita_id=${citaId}`);
}

export async function upsertHistoria(
	citaId: number,
	pacienteId: number,
	doctorId: number,
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
			id: mockHistorias.length + 1,
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
	return apiFetch<HistoriaMedica>('/historias', {
		method: 'PUT',
		body: JSON.stringify({ cita_id: citaId, paciente_id: pacienteId, doctor_id: doctorId, evaluacion })
	});
}

export async function marcarPreparado(historiaId: number, preparadoPor: string): Promise<void> {
	if (mockFlags.historias) {
		const h = mockHistorias.find((x) => x.id === historiaId);
		if (h) {
			h.preparado = true;
			h.preparado_at = new Date().toISOString();
		}
		return;
	}
	await apiFetch(`/historias/${historiaId}/preparado`, {
		method: 'PATCH',
		body: JSON.stringify({ preparado_por: preparadoPor })
	});
}
