import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';

// Mock staff credentials — en producción esto viene del backend con bcrypt
const STAFF_CREDENTIALS: Array<{
	username: string;
	password: string;
	user: AuthUser;
}> = [
	{
		username: 'sofia.ramirez',
		password: 'analista123',
		user: { id: 'staff-001', name: 'Sofía Ramírez', role: 'analista', initials: 'SR' }
	},
	{
		username: 'carlos.mendoza',
		password: 'doctor123',
		user: { id: 'staff-002', name: 'Dr. Carlos Mendoza', role: 'doctor', initials: 'CM', doctor_id: 'doc-001' }
	},
	{
		username: 'maria.rodriguez',
		password: 'doctor456',
		user: { id: 'staff-003', name: 'Dra. María Rodríguez', role: 'doctor', initials: 'MR', doctor_id: 'doc-002' }
	},
	{
		username: 'maria.fernandez',
		password: 'farmacia123',
		user: { id: 'staff-004', name: 'María Fernández', role: 'farmaceutico', initials: 'MF', pharmacistId: 'far-uuid-1' }
	},
	{
		username: 'admin',
		password: 'admin123',
		user: { id: 'staff-005', name: 'Admin Principal', role: 'admin', initials: 'AP', doctor_id: 'doc-001' }
	}
];

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const fd = await request.formData();
		const username = String(fd.get('username') ?? '').trim().toLowerCase();
		const password = String(fd.get('password') ?? '').trim();

		if (!username || !password) {
			return fail(400, { error: 'Usuario y contraseña son requeridos.', username });
		}

		const match = STAFF_CREDENTIALS.find(
			(c) => c.username.toLowerCase() === username && c.password === password
		);

		if (!match) {
			return fail(401, { error: 'Usuario o contraseña incorrectos.', username });
		}

		cookies.set('mock_auth', JSON.stringify(match.user), {
			path: '/',
			httpOnly: false,
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		// Redirigir según rol
		const home = match.user.role === 'doctor' ? '/doctor/citas' : '/';
		redirect(303, home);
	}
};
