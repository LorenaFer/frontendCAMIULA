// ============================================================
// Cliente HTTP centralizado para FastAPI
// - Prefijo /api en todas las rutas
// - Desenvuelve el envelope { status, message, data }
// - AbortController con timeout de 15s
// ============================================================

import { env } from '$env/dynamic/private';

const API_URL = env.API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
	constructor(
		public status: number,
		public body: unknown
	) {
		super(`API error ${status}`);
	}
}

/** Envelope estándar del backend */
interface ApiEnvelope<T> {
	status: 'success' | 'error';
	message?: string;
	data: T;
}

/**
 * Fetch con envelope unwrap automático.
 * Retorna directamente `data` del envelope `{ status, message, data }`.
 * Las rutas deben empezar con `/` (sin `/api` — se agrega automáticamente).
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15_000);

	try {
		const res = await fetch(`${API_URL}/api${path}`, {
			...init,
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
				...init?.headers
			}
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({ detail: res.statusText }));
			throw new ApiError(res.status, body);
		}

		const envelope: ApiEnvelope<T> = await res.json();
		return envelope.data;
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Fetch SIN desenvolver envelope.
 * Para endpoints que no siguen el envelope estándar o que necesitan
 * acceso al status/message del envelope.
 */
export async function apiFetchRaw<T>(path: string, init?: RequestInit): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15_000);

	try {
		const res = await fetch(`${API_URL}/api${path}`, {
			...init,
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
				...init?.headers
			}
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({ detail: res.statusText }));
			throw new ApiError(res.status, body);
		}

		return res.json() as Promise<T>;
	} finally {
		clearTimeout(timeout);
	}
}
