import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { clearToken, getToken, getRefreshToken } from '$lib/server/auth.js';
import { apiFetch } from '$lib/server/api.js';

async function revokeBackend(access: string | null, refresh: string | null): Promise<void> {
	if (!access && !refresh) return;
	try {
		const headers: Record<string, string> = {};
		if (access) headers['Authorization'] = `Bearer ${access}`;
		if (refresh) headers['X-Refresh-Token'] = refresh;
		await apiFetch('/auth/logout', { method: 'POST', headers });
	} catch {
		// Aunque falle la revocación server-side (red caída, token ya expirado),
		// seguimos limpiando cookies en el cliente — no queremos que un backend
		// down impida el logout.
	}
}

export const load: PageServerLoad = async ({ cookies }) => {
	await revokeBackend(getToken(cookies), getRefreshToken(cookies));
	cookies.delete('mock_auth', { path: '/' });
	clearToken(cookies);
	redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		await revokeBackend(getToken(cookies), getRefreshToken(cookies));
		cookies.delete('mock_auth', { path: '/' });
		clearToken(cookies);
		redirect(303, '/login');
	}
};
