// ============================================================
// Cliente HTTP centralizado para FastAPI
//
// Características:
// - Prefijo /api automático en todas las rutas
// - Desenvuelve envelope { status, message, data }
// - Timeout configurable (default 15s)
// - Soporte de auth token (Bearer) para producción
// - Manejo de errores tipado con mensajes legibles
// - Helpers tipados para GET, POST, PUT, PATCH, DELETE
// ============================================================

import { env } from '$env/dynamic/private';

// ─── Configuración ───────────────────────────────────────────

const API_URL = env.API_URL ?? 'http://localhost:8000';
const API_TIMEOUT = Number(env.API_TIMEOUT ?? '15000');

// ─── Token global por request ────────────────────────────────
// El hook de auth setea el token al inicio de cada request.
// Todos los apiFetch dentro de ese request lo usan automáticamente.
// En Node single-threaded esto funciona porque cada request es secuencial
// dentro de su async context.

let _currentToken: string | null = null;

/** Llamar desde hooks.server.ts al inicio de cada request */
export function setRequestToken(token: string | null): void {
	_currentToken = token;
}

/** Obtener el token actual (usado internamente por _fetch) */
export function getRequestToken(): string | null {
	return _currentToken;
}

// ─── Tipos ───────────────────────────────────────────────────

/** Envelope estándar del backend */
export interface ApiEnvelope<T> {
	status: 'success' | 'error';
	message?: string;
	data: T;
}

/** Error tipado con status HTTP y cuerpo de respuesta */
export class ApiError extends Error {
	constructor(
		public status: number,
		public body: unknown,
		public userMessage: string
	) {
		super(`API error ${status}: ${userMessage}`);
		this.name = 'ApiError';
	}

	/** Obtiene el mensaje legible para mostrar al usuario */
	get detail(): string {
		if (typeof this.body === 'object' && this.body !== null) {
			const b = this.body as Record<string, unknown>;
			return String(b.detail ?? b.message ?? b.error ?? this.userMessage);
		}
		return this.userMessage;
	}
}

/** Opciones extendidas para apiFetch */
export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
	/** Token de autenticación (Bearer) */
	token?: string;
	/** Timeout en ms (default: API_TIMEOUT) */
	timeout?: number;
	/** Body como objeto — se serializa automáticamente */
	body?: unknown;
}

// ─── Mensajes de error por status ────────────────────────────

const STATUS_MESSAGES: Record<number, string> = {
	400: 'Datos inválidos',
	401: 'No autenticado — inicie sesión',
	403: 'Sin permisos para esta acción',
	404: 'Recurso no encontrado',
	409: 'Conflicto — el recurso ya existe',
	422: 'Error de validación',
	429: 'Demasiadas solicitudes — intente más tarde',
	500: 'Error interno del servidor',
	502: 'Servidor no disponible',
	503: 'Servicio en mantenimiento'
};

// ─── Core fetch ──────────────────────────────────────────────

async function _fetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
	const { token, timeout = API_TIMEOUT, body, headers: customHeaders, ...restInit } = options;

	// Usar token explícito, o el token global del request actual
	const effectiveToken = token ?? _currentToken;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
		...(customHeaders as Record<string, string> ?? {})
	};

	try {
		const res = await fetch(`${API_URL}/api${path}`, {
			...restInit,
			signal: controller.signal,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined
		});

		if (!res.ok) {
			const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
			const defaultMsg = STATUS_MESSAGES[res.status] ?? `Error ${res.status}`;
			throw new ApiError(res.status, errorBody, defaultMsg);
		}

		return res;
	} catch (err) {
		if (err instanceof ApiError) throw err;
		if (err instanceof DOMException && err.name === 'AbortError') {
			throw new ApiError(408, { detail: 'Timeout' }, 'El servidor no respondió a tiempo. Intente nuevamente.');
		}
		throw new ApiError(0, { detail: String(err) }, 'Error de conexión con el servidor. Verifique su red.');
	} finally {
		clearTimeout(timer);
	}
}

// ─── Funciones principales ───────────────────────────────────

/**
 * Fetch con envelope unwrap automático.
 * Retorna directamente `data` del envelope `{ status, message, data }`.
 * Las rutas deben empezar con `/` (sin `/api` — se agrega automáticamente).
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	// Compatibilidad: convierte RequestInit legacy a ApiFetchOptions
	const options: ApiFetchOptions = init ? {
		...init,
		body: init.body ? JSON.parse(init.body as string) : undefined
	} : {};

	const res = await _fetch(path, options);
	const envelope: ApiEnvelope<T> = await res.json();
	return envelope.data;
}

/**
 * Fetch SIN desenvolver envelope.
 * Para endpoints que no siguen el envelope estándar.
 */
export async function apiFetchRaw<T>(path: string, init?: RequestInit): Promise<T> {
	const options: ApiFetchOptions = init ? {
		...init,
		body: init.body ? JSON.parse(init.body as string) : undefined
	} : {};

	const res = await _fetch(path, options);
	return res.json() as Promise<T>;
}

// ─── Helpers tipados ─────────────────────────────────────────

/** GET con query params automáticos */
export async function apiGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>, options?: ApiFetchOptions): Promise<T> {
	const qs = new URLSearchParams();
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== '') qs.set(k, String(v));
		}
	}
	const fullPath = qs.toString() ? `${path}?${qs}` : path;
	const res = await _fetch(fullPath, { ...options, method: 'GET' });
	const envelope: ApiEnvelope<T> = await res.json();
	return envelope.data;
}

/** POST con body tipado */
export async function apiPost<T>(path: string, body?: unknown, options?: ApiFetchOptions): Promise<T> {
	const res = await _fetch(path, { ...options, method: 'POST', body });
	const envelope: ApiEnvelope<T> = await res.json();
	return envelope.data;
}

/** PUT con body tipado */
export async function apiPut<T>(path: string, body?: unknown, options?: ApiFetchOptions): Promise<T> {
	const res = await _fetch(path, { ...options, method: 'PUT', body });
	const envelope: ApiEnvelope<T> = await res.json();
	return envelope.data;
}

/** PATCH con body tipado */
export async function apiPatch<T>(path: string, body?: unknown, options?: ApiFetchOptions): Promise<T> {
	const res = await _fetch(path, { ...options, method: 'PATCH', body });
	const envelope: ApiEnvelope<T> = await res.json();
	return envelope.data;
}

/** DELETE */
export async function apiDelete(path: string, options?: ApiFetchOptions): Promise<void> {
	await _fetch(path, { ...options, method: 'DELETE' });
}
