import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { clearToken } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ cookies }) => {
	cookies.delete('mock_auth', { path: '/' });
	clearToken(cookies);
	redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete('mock_auth', { path: '/' });
		clearToken(cookies);
		redirect(303, '/login');
	}
};
