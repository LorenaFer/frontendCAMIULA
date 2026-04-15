// ============================================================
// Auth Token Management
//
// El backend FastAPI usa JWT Bearer tokens con access+refresh.
// - access_token: ~15 min, va en Authorization header.
// - refresh_token: ~7 días, solo se presenta a /auth/refresh.
// Ambos se guardan en cookies httpOnly.
// ============================================================

import type { Cookies } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';
import { apiFetch } from './api.js';
import { env } from '$env/dynamic/private';

const TOKEN_COOKIE = 'auth_token';
const REFRESH_COOKIE = 'refresh_token';
const USER_COOKIE = 'mock_auth'; // legacy — mantener para compatibilidad

// COOKIE_SECURE controla el atributo Secure. En HTTP plano DEBE ser false —
// si sale Secure en HTTP, Chromium descarta el Set-Cookie (Strict Secure Cookies)
// y los clears de logout no se aplican. Cuando se active HTTPS, setear
// COOKIE_SECURE=true en .env.prod para endurecer.
const COOKIE_SECURE = env.COOKIE_SECURE === 'true';

// ─── Token Storage ───────────────────────────────────────────

export function getToken(cookies: Cookies): string | null {
	return cookies.get(TOKEN_COOKIE) ?? null;
}

export function getRefreshToken(cookies: Cookies): string | null {
	return cookies.get(REFRESH_COOKIE) ?? null;
}

export function setToken(cookies: Cookies, token: string, expiresIn: number = 900): void {
	cookies.set(TOKEN_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: COOKIE_SECURE,
		sameSite: 'lax',
		maxAge: expiresIn
	});
}

export function setRefreshToken(cookies: Cookies, token: string): void {
	// El refresh vive ~7 días. Usamos el exp del JWT para fijar maxAge con precisión.
	const exp = peekJwtExp(token);
	const nowSec = Math.floor(Date.now() / 1000);
	const maxAge = exp ? Math.max(60, exp - nowSec) : 60 * 60 * 24 * 7;
	cookies.set(REFRESH_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: COOKIE_SECURE,
		sameSite: 'lax',
		maxAge
	});
}

export function clearToken(cookies: Cookies): void {
	// Pasar las mismas opciones que setToken para que el browser aplique el borrado.
	cookies.delete(TOKEN_COOKIE, { path: '/', secure: COOKIE_SECURE });
	cookies.delete(REFRESH_COOKIE, { path: '/', secure: COOKIE_SECURE });
	cookies.delete(USER_COOKIE, { path: '/', secure: COOKIE_SECURE });
}

// ─── User Session (legacy cookie — para UI) ──────────────────

export function setUserSession(cookies: Cookies, user: AuthUser): void {
	cookies.set(USER_COOKIE, JSON.stringify(user), {
		path: '/',
		httpOnly: false, // accesible desde JS para la UI
		secure: COOKIE_SECURE,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7
	});
}

export function getUserSession(cookies: Cookies): AuthUser | null {
	const raw = cookies.get(USER_COOKIE);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as AuthUser;
	} catch {
		return null;
	}
}

// ─── JWT helpers ─────────────────────────────────────────────

/** Devuelve el claim `exp` (segundos desde epoch) sin verificar firma. */
export function peekJwtExp(token: string): number | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = JSON.parse(
			Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
		);
		return typeof payload.exp === 'number' ? payload.exp : null;
	} catch {
		return null;
	}
}

/** True si el token expira en <= `slackSec` segundos o ya expiró. */
export function isExpiringSoon(token: string, slackSec: number = 60): boolean {
	const exp = peekJwtExp(token);
	if (exp === null) return true; // token sin exp → trátalo como inválido
	const nowSec = Math.floor(Date.now() / 1000);
	return exp - nowSec <= slackSec;
}

// ─── Login Functions ─────────────────────────────────────────

export interface LoginResult {
	user: AuthUser;
	token: string;
}

/** Login de staff (email + password) */
export async function loginStaff(email: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }> {
	return apiFetch<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password })
	});
}

/** Login de paciente (cédula o NHM, sin password) */
export async function loginPatient(query: string, queryType: 'cedula' | 'nhm'): Promise<{ found: boolean; patient: { id: string; nhm: number; first_name: string; last_name: string; university_relation: string; is_new: boolean } | null }> {
	return apiFetch('/auth/patient/login', {
		method: 'POST',
		body: JSON.stringify({ query, query_type: queryType })
	});
}

/** Obtener perfil del usuario autenticado */
export async function getMe(token: string): Promise<{ id: string; email: string; full_name: string; roles: string[] }> {
	return apiFetch('/users/me', {
		method: 'GET',
		headers: { 'Authorization': `Bearer ${token}` }
	});
}
