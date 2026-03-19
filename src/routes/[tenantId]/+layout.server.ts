import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url, params }) => {
	const user = locals.user;
	if (!user) throw redirect(303, '/login');

	// Paciente accediendo al dashboard → redirigir a agendar
	const routePath = url.pathname.replace(`/${params.tenantId}`, '').replace(/^\//, '');
	if (user.role === 'paciente' && !routePath.startsWith('agendar') && !routePath.startsWith('mis-citas')) {
		throw redirect(303, `/${params.tenantId}/agendar`);
	}

	return { user };
};
