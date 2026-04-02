import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createPaciente, findByCedula } from '$lib/server/pacientes.service';
import type { AuthUser } from '$shared/types/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const fd = await request.formData();
		const nombre = String(fd.get('nombre') ?? '').trim();
		const apellido = String(fd.get('apellido') ?? '').trim();
		const cedula = String(fd.get('cedula') ?? '').trim();
		const sexo = String(fd.get('sexo') ?? '').trim();
		const telefono = String(fd.get('telefono') ?? '').trim();
		const relacion_univ = String(fd.get('relacion_univ') ?? '').trim();

		if (!nombre || !apellido || !cedula) {
			return fail(400, { error: 'Nombre, apellido y cédula son requeridos.' });
		}

		// Verificar que no exista
		const existing = await findByCedula(cedula);
		if (existing) {
			return fail(409, { error: 'Ya existe un paciente con esa cédula. Use el login para ingresar.' });
		}

		try {
			const paciente = await createPaciente({
				nombre,
				apellido,
				cedula,
				sexo: (sexo as 'M' | 'F') || undefined,
				telefono: telefono || undefined,
				relacion_univ: (relacion_univ as 'empleado' | 'estudiante' | 'profesor' | 'tercero') || 'tercero'
			});

			// Crear sesión automáticamente después del registro
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

			redirect(303, '/agendar');
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Error al registrar paciente.';
			return fail(500, { error: msg });
		}
	}
};
