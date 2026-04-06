import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as categoriesService from '$lib/server/inventory/categories.service.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { CreateCategoryInput } from '$domain/inventory/types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_WRITE);

	const search = url.searchParams.get('search') ?? undefined;
	const page = Number(url.searchParams.get('page') ?? 1);
	const pageSize = [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size')))
		? Number(url.searchParams.get('page_size'))
		: 25;

	const categories = await categoriesService.getCategories(page, pageSize, search).catch(() => ({
		data: [], total: 0, page: 1, pageSize: 25, hasNext: false
	}));

	return { categories, search: search ?? '' };
};

export const actions: Actions = {
	crearCategoria: async ({ request, locals }) => {
		assertPermission(locals.user, P.INVENTORY_WRITE);

		const fd = await request.formData();
		const input: CreateCategoryInput = {
			name: String(fd.get('name') ?? '').trim(),
			description: String(fd.get('description') ?? '').trim() || undefined
		};

		if (!input.name) {
			return fail(400, { error: 'El nombre es requerido' });
		}

		try {
			await categoriesService.createCategory(input);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 409) return fail(409, { error: 'Ya existe una categoría con ese nombre' });
			return fail(500, { error: 'Error al crear la categoría' });
		}
	},

	editarCategoria: async ({ request, locals }) => {
		assertPermission(locals.user, P.INVENTORY_WRITE);

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID requerido' });

		const input: Partial<CreateCategoryInput> = {};
		const name = String(fd.get('name') ?? '').trim();
		const description = String(fd.get('description') ?? '').trim();
		if (name) input.name = name;
		input.description = description || undefined;

		try {
			await categoriesService.updateCategory(id, input);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Categoría no encontrada' });
			return fail(500, { error: 'Error al actualizar la categoría' });
		}
	},

	eliminarCategoria: async ({ request, locals }) => {
		assertPermission(locals.user, P.INVENTORY_WRITE);

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await categoriesService.deleteCategory(id);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Categoría no encontrada' });
			return fail(500, { error: 'Error al eliminar la categoría' });
		}
	}
};
