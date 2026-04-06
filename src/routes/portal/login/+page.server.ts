import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { findByCedula, findByNHM } from '$lib/server/pacientes.service';
import { mockFlags } from '$lib/server/mock-flags';
import { apiFetch, ApiError } from '$lib/server/api';
import { setToken, setUserSession } from '$lib/server/auth';
import type { AuthUser } from '$shared/types/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const fd = await request.formData();
		const query = String(fd.get('cedula') ?? '').trim();

		if (!query) return fail(400, { error: 'Ingrese su cédula o número de historia.' });

		const isNhm = /^\d+$/.test(query) && Number(query) < 100000;

		if (mockFlags.auth) {
			// ── Mock login ──
			const paciente = isNhm
				? await findByNHM(Number(query))
				: await findByCedula(query);

			if (!paciente) {
				return fail(404, {
					error: `No se encontró paciente con ${isNhm ? 'NHM' : 'cédula'} "${query}". ¿Es paciente nuevo?`,
					query
				});
			}

			const authUser: AuthUser = {
				id: paciente.id,
				name: `${paciente.nombre} ${paciente.apellido}`,
				role: 'paciente',
				initials: `${paciente.nombre[0]}${paciente.apellido[0]}`
			};
			setUserSession(cookies, authUser);
			redirect(303, '/mis-citas');
		}

		// ── Real backend login ──
		try {
			const res = await apiFetch<{
				found: boolean;
				patient: { id: string; nhm: number; first_name: string; last_name: string; university_relation: string; is_new: boolean } | null;
				access_token?: string;
				expires_in?: number;
			}>('/auth/patient/login', {
				method: 'POST',
				body: JSON.stringify({ query, query_type: isNhm ? 'nhm' : 'cedula' })
			});

			if (!res.found || !res.patient) {
				return fail(404, {
					error: `No se encontró paciente con ${isNhm ? 'NHM' : 'cédula'} "${query}". ¿Es paciente nuevo?`,
					query
				});
			}

			// Guardar JWT si el backend lo devuelve
			if (res.access_token) {
				setToken(cookies, res.access_token, res.expires_in ?? 86400);
			}

			const authUser: AuthUser = {
				id: res.patient.id,
				name: `${res.patient.first_name} ${res.patient.last_name}`,
				role: 'paciente',
				initials: `${res.patient.first_name[0]}${res.patient.last_name[0]}`
			};
			setUserSession(cookies, authUser);
			redirect(303, '/mis-citas');
		} catch (e) {
			if (e instanceof ApiError) {
				return fail(e.status, { error: e.detail, query });
			}
			throw e; // re-throw redirects
		}
	}
};
