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
		const telefono = String(fd.get('telefono') ?? '').trim();
		const correo = String(fd.get('correo') ?? '').trim() || undefined;
		const sexo = String(fd.get('sexo') ?? '').trim() || undefined;
		const fecha_nacimiento = String(fd.get('fecha_nacimiento') ?? '').trim() || undefined;
		const pais = String(fd.get('pais') ?? '').trim() || undefined;
		const estado_geo = String(fd.get('estado_geo') ?? '').trim() || undefined;
		const ciudad = String(fd.get('ciudad') ?? '').trim() || undefined;
		const estado_civil = String(fd.get('estado_civil') ?? '').trim() || undefined;
		const tipo_sangre = String(fd.get('tipo_sangre') ?? '').trim() || undefined;
		const religion = String(fd.get('religion') ?? '').trim() || undefined;
		const clasificacion_economica = String(fd.get('clasificacion_economica') ?? '').trim() || undefined;
		const profesion = String(fd.get('profesion') ?? '').trim() || undefined;
		const ocupacion_actual = String(fd.get('ocupacion_actual') ?? '').trim() || undefined;
		const relacion_univ = String(fd.get('relacion_univ') ?? '').trim();
		const parentesco = String(fd.get('parentesco') ?? '').trim() || undefined;
		const titular_cedula = String(fd.get('titular_cedula') ?? '').trim() || undefined;
		const direccion_habitacion = String(fd.get('direccion_habitacion') ?? '').trim() || undefined;
		const direccion_trabajo = String(fd.get('direccion_trabajo') ?? '').trim() || undefined;
		const emergencia_nombre = String(fd.get('emergencia_nombre') ?? '').trim() || undefined;
		const emergencia_parentesco = String(fd.get('emergencia_parentesco') ?? '').trim() || undefined;
		const emergencia_telefono = String(fd.get('emergencia_telefono') ?? '').trim() || undefined;
		const emergencia_direccion = String(fd.get('emergencia_direccion') ?? '').trim() || undefined;
		const alergias = String(fd.get('alergias') ?? '').trim();
		const alertas_medicas = String(fd.get('alertas_medicas') ?? '').trim();

		if (!nombre || !apellido || !cedula) {
			return fail(400, { error: 'Nombre, apellido y cédula son requeridos.' });
		}

		const existing = await findByCedula(cedula);
		if (existing) {
			return fail(409, { error: 'Ya existe un paciente con esa cédula. Use el login para ingresar.' });
		}

		// Calcular edad
		let edad: number | undefined;
		if (fecha_nacimiento) {
			const birth = new Date(fecha_nacimiento);
			const now = new Date();
			edad = now.getFullYear() - birth.getFullYear();
			if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
				edad--;
			}
		}

		// Verificar titular si es familiar
		let titular_nhm: number | undefined;
		if (relacion_univ === 'tercero' && titular_cedula) {
			const titular = await findByCedula(titular_cedula);
			if (!titular) {
				return fail(400, { error: 'No se encontró el titular universitario con esa cédula.' });
			}
			titular_nhm = titular.nhm;
		}

		try {
			const paciente = await createPaciente({
				nombre,
				apellido,
				cedula,
				sexo: sexo as 'M' | 'F' | undefined,
				fecha_nacimiento,
				lugar_nacimiento: [ciudad, estado_geo, pais].filter(Boolean).join(', ') || undefined,
				edad,
				estado_civil: estado_civil as any,
				religion,
				procedencia: estado_geo || undefined,
				direccion_habitacion,
				telefono: telefono || undefined,
				profesion,
				ocupacion_actual,
				direccion_trabajo,
				clasificacion_economica,
				relacion_univ: (relacion_univ as 'empleado' | 'estudiante' | 'profesor' | 'tercero') || 'tercero',
				parentesco: parentesco as any,
				titular_nhm,
				datos_medicos: {
					tipo_sangre,
					alergias: alergias ? alergias.split(',').map((a) => a.trim()).filter(Boolean) : [],
					condiciones: alertas_medicas ? alertas_medicas.split(',').map((a) => a.trim()).filter(Boolean) : []
				},
				contacto_emergencia: (emergencia_nombre || emergencia_telefono) ? {
					nombre: emergencia_nombre,
					parentesco: emergencia_parentesco,
					direccion: emergencia_direccion,
					telefono: emergencia_telefono
				} : undefined
			});

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
