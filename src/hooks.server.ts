import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';
import { getRequiredPermission } from '$lib/server/rbac.js';
import { hasPermission } from '$shared/rbac-config.js';
import { setRequestToken } from '$lib/server/api.js';

const AUTH_COOKIE = 'mock_auth';
const TOKEN_COOKIE = 'auth_token';
const PUBLIC_ROUTES = ['/login', '/logout', '/portal'];

export const handle: Handle = async ({ event, resolve }) => {
	// 0. Set JWT token for all API calls in this request
	const token = event.cookies.get(TOKEN_COOKIE) ?? null;
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
		const home = user.role === 'paciente' ? 'agendar' : '';
		throw redirect(303, `/${home}`);
	}

	return resolve(event);
};
