import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';
import { getRequiredPermission } from '$lib/server/rbac.js';
import { hasPermission } from '$shared/rbac-config.js';
import { setRequestToken, apiFetch } from '$lib/server/api.js';
import { setToken } from '$lib/server/auth.js';

const AUTH_COOKIE = 'mock_auth';
const TOKEN_COOKIE = 'auth_token';
const PUBLIC_ROUTES = ['/login', '/logout', '/portal'];

// Credenciales del service account para mock auth
const SERVICE_EMAIL = 'admin@camiula.edu.ve';
const SERVICE_PASSWORD = 'Admin2026!';

export const handle: Handle = async ({ event, resolve }) => {
	// 0. Set JWT token for all API calls in this request
	let token = event.cookies.get(TOKEN_COOKIE) ?? null;

	// Auto-refresh: si hay sesión pero no hay JWT (expiró o nunca se obtuvo), obtener uno
	if (!token && event.cookies.get(AUTH_COOKIE)) {
		try {
			const tokenRes = await apiFetch<{ access_token: string; expires_in: number }>('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD })
			});
			token = tokenRes.access_token;
			setToken(event.cookies, token, tokenRes.expires_in);
		} catch { /* silenciar — si falla, continuar sin token */ }
	}

	setRequestToken(token);

	// 1. Parse auth cookie
	const raw = event.cookies.get(AUTH_COOKIE);
	let user: AuthUser | null = null;

	if (raw) {
		try {
			user = JSON.parse(raw) as AuthUser;
		} catch {
			event.cookies.delete(AUTH_COOKIE, { path: '/' });
		}
	}

	event.locals.user = user;

	const { pathname } = event.url;

	// 2. Public routes (portal/*, login, logout)
	if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
		// Logged-in staff accessing /login → redirect to dashboard
		if (user && user.role !== 'paciente' && pathname === '/login') throw redirect(303, '/');
		// Logged-in paciente accessing /portal → redirect to mis-citas
		if (user && user.role === 'paciente' && pathname.startsWith('/portal')) throw redirect(303, '/mis-citas');
		return resolve(event);
	}

	// 3. Root redirect for unauthenticated users
	if (!user) {
		// No session → send to portal (patients) or login (staff)
		throw redirect(303, '/portal');
	}

	// 4. Extract route path (strip leading slash)
	const routePath = pathname.replace(/^\//, '');

	// Paciente: solo agendar/* y mis-citas/*
	if (user.role === 'paciente' && !routePath.startsWith('agendar') && !routePath.startsWith('mis-citas')) {
		throw redirect(303, '/mis-citas');
	}

	// Route-level permission check
	const required = getRequiredPermission(routePath);
	if (required && !hasPermission(user.role, required)) {
		// Evitar loop: no redirigir a la misma ruta
		const home = user.role === 'paciente' ? '/mis-citas' : '/login';
		if (pathname !== home) throw redirect(303, home);
	}

	return resolve(event);
};
