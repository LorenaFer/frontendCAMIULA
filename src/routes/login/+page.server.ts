import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { MOCK_USERS } from '$lib/server/rbac.js';
import type { UserRole } from '$shared/types/auth.js';

const VALID_ROLES: UserRole[] = ['paciente', 'analista', 'doctor', 'admin'];

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const fd = await request.formData();
		const role = String(fd.get('role') ?? '') as UserRole;

		if (!VALID_ROLES.includes(role)) {
			return fail(400, { error: 'Rol inválido' });
		}

		const user = MOCK_USERS[role];

		cookies.set('mock_auth', JSON.stringify(user), {
			path: '/',
			httpOnly: false,
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		redirect(303, '/');
	}
};
