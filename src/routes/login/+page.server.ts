import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import type { AuthUser } from '$shared/types/auth.js';
import { mockFlags } from '$lib/server/mock-flags.js';
import { apiFetch, ApiError } from '$lib/server/api.js';
import { setRefreshToken, setToken, setUserSession } from '$lib/server/auth.js';

// Mock staff credentials — solo cuando MOCK_AUTH=true
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

		if (mockFlags.auth) {
			// ── Mock login (solo dev) ──
			const match = STAFF_CREDENTIALS.find(
				(c) => c.username.toLowerCase() === username && c.password === password
			);
			if (!match) {
				return fail(401, { error: 'Usuario o contraseña incorrectos.', username });
			}
			setUserSession(cookies, match.user);
			const home = match.user.role === 'doctor' ? '/doctor/citas' : '/';
			redirect(303, home);
		}

		// ── Real backend login ──
		try {
			const tokenRes = await apiFetch<{
				access_token: string;
				refresh_token: string;
				token_type: string;
				expires_in: number;
			}>('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email: username, password })
			});

			// Guardar access y refresh JWTs en cookies httpOnly
			setToken(cookies, tokenRes.access_token, tokenRes.expires_in);
			if (tokenRes.refresh_token) {
				setRefreshToken(cookies, tokenRes.refresh_token);
			}

			// Obtener perfil del usuario para construir AuthUser
			const profile = await apiFetch<{ id: string; email: string; full_name: string; roles: string[] }>('/users/me', {
				headers: { 'Authorization': `Bearer ${tokenRes.access_token}` }
			});

			// Mapear rol del backend al frontend
			const roleMap: Record<string, string> = {
				administrador: 'admin', admin: 'admin',
				doctor: 'doctor', medico: 'doctor',
				analista: 'analista',
				farmaceutico: 'farmaceutico', farmacéutico: 'farmaceutico',
				paciente: 'paciente'
			};
			// Tomar el rol más privilegiado (no 'paciente' si hay otro)
			const rolePriority = ['administrador', 'admin', 'doctor', 'medico', 'farmaceutico', 'farmacéutico', 'analista', 'paciente'];
			const backendRole = rolePriority.find(r => profile.roles.map(x => x.toLowerCase()).includes(r)) ?? profile.roles[0] ?? 'analista';
			const role = roleMap[backendRole.toLowerCase()] ?? 'analista';
			const initials = profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

			const user: AuthUser = {
				id: profile.id,
				name: profile.full_name,
				role: role as AuthUser['role'],
				initials
			};

			// Si es doctor, buscar su doctor_id vinculado
			if (role === 'doctor') {
				try {
					const doctors = await apiFetch<Array<{ id: string; fk_user_id: string }>>('/doctors?active=true', {
						headers: { 'Authorization': `Bearer ${tokenRes.access_token}` }
					});
					const doctorsList = Array.isArray(doctors) ? doctors : (doctors as Record<string, unknown>).items as Array<{ id: string; fk_user_id: string }> ?? [];
					const match = doctorsList.find(d => d.fk_user_id === profile.id);
					if (match) user.doctor_id = match.id;
				} catch { /* si falla, el doctor_id queda undefined */ }
			}

			setUserSession(cookies, user);

			const home = user.role === 'doctor' ? '/doctor/citas' : '/';
			redirect(303, home);
		} catch (e) {
			if (e instanceof ApiError) {
				if (e.status === 401) {
					return fail(401, { error: 'Usuario o contraseña incorrectos.', username });
				}
				return fail(e.status, { error: e.detail, username });
			}
			throw e; // re-throw redirects
		}
	}
};
