// ============================================================
// Cliente del endpoint REST /agendar.
//
// Encapsula la firma del envelope JSON, el caché de slots y
// los handlers de error de red. Los componentes solo se ocupan
// del estado de UI (loading, mensajes, navegación entre pasos).
// ============================================================

import type { PacientePublic } from '$domain/patients/types.js';
import type { TimeSlot } from './types.js';

interface ApiEnvelope<T> {
	status: 'success' | 'error';
	data?: T;
	message?: string;
}

async function apiCall<T>(action: string, body: Record<string, unknown>): Promise<T> {
	const res = await fetch('/agendar', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action, ...body })
	});
	const json = (await res.json()) as ApiEnvelope<T>;
	if (json.status === 'success' && json.data !== undefined) return json.data;
	throw new Error(json.message ?? 'Error desconocido');
}

// ─── Buscar paciente ─────────────────────────────────────────

export interface BuscarPacienteResult {
	found: boolean;
	paciente: PacientePublic | null;
}

export function buscarPaciente(
	query: string,
	queryType: 'nhm' | 'cedula'
): Promise<BuscarPacienteResult> {
	return apiCall<BuscarPacienteResult>('buscarPaciente', { query, queryType });
}

// ─── Slots con caché ────────────────────────────────────────

export interface SlotsResult {
	slots: TimeSlot[];
	duracion: 30 | 60;
}

/**
 * Cliente con caché para slots de disponibilidad. Crear una instancia
 * por wizard — el caché vive mientras el wizard está montado y se
 * descarta al desmontar (sin riesgo de stale data entre sesiones).
 */
export class SlotsClient {
	private cache = new Map<string, SlotsResult>();

	async fetch(doctorId: string, fecha: string, esNuevo: boolean): Promise<SlotsResult> {
		const key = `${doctorId}:${fecha}:${esNuevo}`;
		const cached = this.cache.get(key);
		if (cached) return cached;
		const result = await apiCall<SlotsResult>('obtenerSlots', { doctorId, fecha, esNuevo });
		this.cache.set(key, result);
		return result;
	}

	/** Pre-fetch fire-and-forget — los errores se silencian. */
	prefetch(doctorId: string, fechas: string[], esNuevo: boolean): void {
		for (const fecha of fechas) {
			this.fetch(doctorId, fecha, esNuevo).catch(() => {});
		}
	}
}

// ─── Confirmar cita ──────────────────────────────────────────

export interface ConfirmarCitaInput {
	pacienteId: string;
	doctorId: string;
	especialidadId: string;
	fecha: string;
	hora_inicio: string;
	hora_fin: string;
	duracion_min: 30 | 60;
	es_primera_vez: boolean;
	motivo_consulta?: string;
	observaciones?: string;
}

export interface ConfirmarCitaResult {
	redirectUrl: string;
}

export function confirmarCita(input: ConfirmarCitaInput): Promise<ConfirmarCitaResult> {
	return apiCall<ConfirmarCitaResult>('confirmarCita', { ...input });
}
