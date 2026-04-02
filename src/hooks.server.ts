import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';
import { getRequiredPermission } from '$lib/server/rbac.js';
import { hasPermission } from '$shared/rbac-config.js';

const AUTH_COOKIE = 'mock_auth';
const PUBLIC_ROUTES = ['/login', '/logout'];

export const handle: Handle = async ({ event, resolve }) => {
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

	// 2. Public routes
	if (PUBLIC_ROUTES.some((r) => pathname === r)) {
		if (user && pathname === '/login') throw redirect(303, '/');
		return resolve(event);
	}

	// 3. Must be logged in
	if (!user) throw redirect(303, '/login');

	// 4. Extract route path (strip leading slash)
	const routePath = pathname.replace(/^\//, '');

	// Paciente: solo agendar/* y mis-citas/*
	if (user.role === 'paciente' && !routePath.startsWith('agendar') && !routePath.startsWith('mis-citas')) {
		throw redirect(303, '/agendar');
	}

	// Route-level permission check
	const required = getRequiredPermission(routePath);
	if (required && !hasPermission(user.role, required)) {
		const home = user.role === 'paciente' ? 'agendar' : '';
		throw redirect(303, `/${home}`);
	}

	return resolve(event);
};
