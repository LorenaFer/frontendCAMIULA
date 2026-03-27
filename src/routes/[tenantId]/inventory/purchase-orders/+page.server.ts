import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as purchaseOrdersService from '$lib/server/inventory/purchase-orders.service.js';
import * as suppliersService from '$lib/server/inventory/suppliers.service.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_WRITE);

	const page = Number(url.searchParams.get('page') ?? 1);
	const [orders, supplierOptions] = await Promise.all([
		purchaseOrdersService.getPurchaseOrders(page, 25),
		suppliersService.getSupplierOptions()
	]);

	return { orders, supplierOptions, page };
};

export const actions: Actions = {
	recibirOrden: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'recibirOrden');

		const fd = await request.formData();
		const order_id = String(fd.get('order_id') ?? '');
		if (!order_id) return fail(400, { error: 'ID de orden requerido' });

		try {
			await purchaseOrdersService.receivePurchaseOrder({ order_id, items: [] });
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Orden no encontrada' });
			return fail(500, { error: 'Error al registrar recepción' });
		}
	}
};
