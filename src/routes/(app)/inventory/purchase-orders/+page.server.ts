import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as purchaseOrdersService from '$lib/server/inventory/purchase-orders.service.js';
import * as suppliersService from '$lib/server/inventory/suppliers.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_WRITE);

	const page = Number(url.searchParams.get('page') ?? 1);
	const [orders, supplierOptions, medicationOptions] = await Promise.all([
		purchaseOrdersService.getPurchaseOrders(page, 25),
		suppliersService.getSupplierOptions(),
		medicationsService.getMedicationOptions()
	]);

	return { orders, supplierOptions, medicationOptions, page };
};

export const actions: Actions = {
	crearOrden: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'crearOrden');

		const fd = await request.formData();
		const fk_supplier_id = String(fd.get('fk_supplier_id') ?? '');
		const expected_date = fd.get('expected_date') ? String(fd.get('expected_date')) : undefined;
		const notes = fd.get('notes') ? String(fd.get('notes')) : undefined;
		const itemsRaw = String(fd.get('items') ?? '[]');

		if (!fk_supplier_id) return fail(400, { error: 'Proveedor requerido' });

		let items: Array<{ medication_id: string; quantity_ordered: number; unit_cost: number }>;
		try {
			items = JSON.parse(itemsRaw);
		} catch {
			return fail(400, { error: 'Ítems inválidos' });
		}

		if (!items.length) return fail(400, { error: 'Debe agregar al menos un medicamento' });

		try {
			await purchaseOrdersService.createPurchaseOrder({ fk_supplier_id, expected_date, notes, items });
			return { success: true, action: 'created' };
		} catch (e: unknown) {
			const msg = (e as { message?: string }).message ?? '';
			if (msg.toLowerCase().includes('mock')) {
				return fail(503, { error: 'La creación de órdenes requiere integración con el backend.' });
			}
			return fail(500, { error: 'Error al crear la orden de compra' });
		}
	},

	enviarOrden: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'enviarOrden');

		const fd = await request.formData();
		const order_id = String(fd.get('order_id') ?? '');
		if (!order_id) return fail(400, { error: 'ID de orden requerido' });

		try {
			await purchaseOrdersService.sendPurchaseOrder(order_id);
			return { success: true, action: 'sent' };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Orden no encontrada' });
			if (status === 400) return fail(400, { error: (e as Error).message });
			return fail(500, { error: 'Error al enviar la orden' });
		}
	},

	recibirOrden: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'recibirOrden');

		const fd = await request.formData();
		const order_id = String(fd.get('order_id') ?? '');
		const itemsRaw = String(fd.get('items') ?? '[]');

		if (!order_id) return fail(400, { error: 'ID de orden requerido' });

		let items: Array<{
			purchase_order_item_id: string;
			quantity_received: number;
			lot_number: string;
			expiration_date: string;
			unit_cost?: number;
		}>;
		try {
			items = JSON.parse(itemsRaw);
		} catch {
			return fail(400, { error: 'Ítems de recepción inválidos' });
		}

		try {
			await purchaseOrdersService.receivePurchaseOrder({ order_id, items });
			return { success: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Orden no encontrada' });
			return fail(500, { error: 'Error al registrar recepción' });
		}
	}
};
