import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	cookies.delete('mock_auth', { path: '/' });
	redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete('mock_auth', { path: '/' });
		redirect(303, '/login');
	}
};
