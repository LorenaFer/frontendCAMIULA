import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as suppliersService from '$lib/server/inventory/suppliers.service.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { CreateSupplierInput } from '$domain/inventory/types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);

	const page = Number(url.searchParams.get('page') ?? 1);
	const pageSize = [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size'))) ? Number(url.searchParams.get('page_size')) : 25;
	const suppliers = await suppliersService.getSuppliers(page, pageSize).catch(() => ({
		data: [], total: 0, page: 1, pageSize: 25, hasNext: false
	}));

	return { suppliers, page };
};

export const actions: Actions = {
	crearProveedor: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'crearProveedor');

		const fd = await request.formData();
		const input: CreateSupplierInput = {
			name: String(fd.get('name') ?? '').trim(),
			rif: String(fd.get('rif') ?? '').trim().toUpperCase(),
			phone: String(fd.get('phone') ?? '').trim() || undefined,
			email: String(fd.get('email') ?? '').trim() || undefined,
			contact_name: String(fd.get('contact_name') ?? '').trim() || undefined,
			payment_terms: String(fd.get('payment_terms') ?? '').trim() || undefined
		};

		if (!input.name || !input.rif) {
			return fail(400, { error: 'Campos requeridos: nombre y RIF' });
		}

		try {
			await suppliersService.createSupplier(input);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 409) return fail(409, { error: 'Ya existe un proveedor con ese RIF' });
			return fail(500, { error: 'Error al crear proveedor' });
		}
	},

	desactivarProveedor: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'editarProveedor');

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await suppliersService.updateSupplier(id, { supplier_status: 'inactive' } as unknown as Partial<CreateSupplierInput>);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Proveedor no encontrado' });
			return fail(500, { error: 'Error al desactivar proveedor' });
		}
	},

	editarProveedor: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'editarProveedor');

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID requerido' });

		const input: Partial<CreateSupplierInput> = {};
		if (fd.has('name') && fd.get('name')) input.name = String(fd.get('name')).trim();
		if (fd.has('phone')) input.phone = String(fd.get('phone')).trim() || undefined;
		if (fd.has('email')) input.email = String(fd.get('email')).trim() || undefined;
		if (fd.has('contact_name')) input.contact_name = String(fd.get('contact_name')).trim() || undefined;
		if (fd.has('payment_terms')) input.payment_terms = String(fd.get('payment_terms')).trim() || undefined;

		try {
			await suppliersService.updateSupplier(id, input);
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Proveedor no encontrado' });
			return fail(500, { error: 'Error al actualizar proveedor' });
		}
	}
};
