// ============================================================
// Auth Token Management
//
// El backend FastAPI usa JWT Bearer tokens.
// El frontend guarda el token en una cookie httpOnly para
// pasarlo al backend en cada request server-side.
// ============================================================

import type { Cookies } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';
import { apiFetch } from './api.js';

const TOKEN_COOKIE = 'auth_token';
const USER_COOKIE = 'mock_auth'; // legacy — mantener para compatibilidad

// ─── Token Storage ───────────────────────────────────────────

export function getToken(cookies: Cookies): string | null {
	return cookies.get(TOKEN_COOKIE) ?? null;
}

export function setToken(cookies: Cookies, token: string, expiresIn: number = 86400): void {
	cookies.set(TOKEN_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: false, // cambiar a true en producción (HTTPS)
		sameSite: 'lax',
		maxAge: expiresIn
	});
}

export function clearToken(cookies: Cookies): void {
	cookies.delete(TOKEN_COOKIE, { path: '/' });
	cookies.delete(USER_COOKIE, { path: '/' }); // limpiar legacy también
}

// ─── User Session (legacy cookie — para UI) ──────────────────

export function setUserSession(cookies: Cookies, user: AuthUser): void {
	cookies.set(USER_COOKIE, JSON.stringify(user), {
		path: '/',
		httpOnly: false, // accesible desde JS para la UI
		secure: false,
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

// ─── Login Functions ─────────────────────────────────────────

export interface LoginResult {
	user: AuthUser;
	token: string;
}

/** Login de staff (email + password) */
export async function loginStaff(email: string, password: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
	return apiFetch<{ access_token: string; token_type: string; expires_in: number }>('/auth/login', {
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
