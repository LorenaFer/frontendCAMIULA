import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { findByCedula, findByNHM } from '$lib/server/pacientes.service';
import type { AuthUser } from '$shared/types/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const fd = await request.formData();
		const query = String(fd.get('cedula') ?? '').trim();

		if (!query) return fail(400, { error: 'Ingrese su cédula o número de historia.' });

		// Auto-detect: numérico puro < 100000 → NHM, sino cédula
		const isNhm = /^\d+$/.test(query) && Number(query) < 100000;
		const paciente = isNhm
			? await findByNHM(Number(query))
			: await findByCedula(query);

		if (!paciente) {
			return fail(404, {
				error: `No se encontró paciente con ${isNhm ? 'NHM' : 'cédula'} "${query}". ¿Es paciente nuevo?`,
				query
			});
		}

		// Crear sesión de paciente
		const authUser: AuthUser = {
			id: paciente.id,
			name: `${paciente.nombre} ${paciente.apellido}`,
			role: 'paciente',
			initials: `${paciente.nombre[0]}${paciente.apellido[0]}`
		};

		cookies.set('mock_auth', JSON.stringify(authUser), {
			path: '/',
			httpOnly: false,
			maxAge: 60 * 60 * 24 * 7
		});

		redirect(303, '/mis-citas');
	}
};
