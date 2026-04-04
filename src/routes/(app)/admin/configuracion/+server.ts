import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as usersService from '$lib/server/users.service.js';

export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ status: 'error', message: 'Body inválido' }, { status: 400 });
	}

	const { action } = body;

	switch (action) {
		case 'crearUsuario': {
			const email = String(body.email ?? '').trim();
			const full_name = String(body.full_name ?? '').trim();
			const password = String(body.password ?? '').trim();
			const phone = body.phone ? String(body.phone).trim() : undefined;
			const role = String(body.role ?? '').trim();

			if (!email || !full_name || !password) {
				return json({ status: 'error', message: 'Email, nombre y contraseña son requeridos' }, { status: 400 });
			}

			try {
				// Crear usuario (el backend ignora roles[] en POST /users, siempre asigna 'paciente')
				const user = await usersService.createUser({ email, full_name, password, phone, roles: role ? [role] : [] });

				// Asignar rol explícitamente después de crear
				const targetRole = role || 'analista';
				if (targetRole !== 'paciente') {
					try {
						await usersService.assignRole(user.id, targetRole);
						user.roles = [...(user.roles ?? []), targetRole];
					} catch { /* silenciar — se puede asignar después desde la tabla */ }
				}

				return json({ status: 'success', message: 'Usuario creado', data: user });
			} catch (e: unknown) {
				const err = e as { status?: number; userMessage?: string; message?: string };
				return json(
					{ status: 'error', message: err.userMessage ?? err.message ?? 'Error al crear usuario' },
					{ status: err.status ?? 500 }
				);
			}
		}

		case 'asignarRol': {
			const user_id = String(body.user_id ?? '');
			const role_name = String(body.role_name ?? '');

			if (!user_id || !role_name) {
				return json({ status: 'error', message: 'ID de usuario y rol requeridos' }, { status: 400 });
			}

			try {
				await usersService.assignRole(user_id, role_name);
				return json({ status: 'success', message: `Rol ${role_name} asignado` });
			} catch (e: unknown) {
				const err = e as { status?: number; userMessage?: string; message?: string };
				return json(
					{ status: 'error', message: err.userMessage ?? err.message ?? 'Error al asignar rol' },
					{ status: err.status ?? 500 }
				);
			}
		}

		case 'removerRol': {
			const user_id = String(body.user_id ?? '');
			const role_name = String(body.role_name ?? '');

			if (!user_id || !role_name) {
				return json({ status: 'error', message: 'ID de usuario y rol requeridos' }, { status: 400 });
			}

			try {
				await usersService.removeRole(user_id, role_name);
				return json({ status: 'success', message: `Rol ${role_name} removido` });
			} catch (e: unknown) {
				const err = e as { status?: number; userMessage?: string; message?: string };
				return json(
					{ status: 'error', message: err.userMessage ?? err.message ?? 'Error al remover rol' },
					{ status: err.status ?? 500 }
				);
			}
		}

		default:
			return json({ status: 'error', message: `Acción desconocida: ${action}` }, { status: 400 });
	}
};
