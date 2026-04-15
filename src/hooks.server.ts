import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';
import { getRequiredPermission } from '$lib/server/rbac.js';
import { hasPermission } from '$shared/rbac-config.js';
import { setRequestToken, apiFetch } from '$lib/server/api.js';
import {
	getRefreshToken,
	isExpiringSoon,
	setRefreshToken,
	setToken
} from '$lib/server/auth.js';

const AUTH_COOKIE = 'mock_auth';
const TOKEN_COOKIE = 'auth_token';
const PUBLIC_ROUTES = ['/login', '/logout', '/portal'];

export const handle: Handle = async ({ event, resolve }) => {
	// 0. Resolver access token: si está por expirar y hay refresh, rotarlo.
	let token = event.cookies.get(TOKEN_COOKIE) ?? null;
	const refresh = getRefreshToken(event.cookies);

	if (refresh && (!token || isExpiringSoon(token, 30))) {
		try {
			const res = await apiFetch<{ access_token: string; refresh_token: string; expires_in: number }>(
				'/auth/refresh',
				{
					method: 'POST',
					body: JSON.stringify({ refresh_token: refresh })
				}
			);
			setToken(event.cookies, res.access_token, res.expires_in);
			setRefreshToken(event.cookies, res.refresh_token);
			token = res.access_token;
		} catch {
			// Refresh falló — limpiar auth para forzar re-login
			event.cookies.delete(TOKEN_COOKIE, { path: '/' });
			event.cookies.delete('refresh_token', { path: '/' });
			event.cookies.delete(AUTH_COOKIE, { path: '/' });
			token = null;
		}
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

	// Debug: verificar qué usuario ve el hook
	if (pathname.startsWith('/doctor')) {
		console.log('[HOOK]', pathname, 'user:', user?.name, 'role:', user?.role, 'cookie exists:', !!event.cookies.get(AUTH_COOKIE));
	}

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
