import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as purchaseOrdersService from '$lib/server/inventory/purchase-orders.service.js';

export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ status: 'error', message: 'Body inválido' }, { status: 400 });
	}

	const { action } = body;

	switch (action) {
		case 'enviarOrden': {
			const order_id = String(body.order_id ?? '');
			if (!order_id) return json({ status: 'error', message: 'ID de orden requerido' }, { status: 400 });

			try {
				const result = await purchaseOrdersService.sendPurchaseOrder(order_id);
				return json({ status: 'success', message: 'Orden enviada', data: result });
			} catch (e: unknown) {
				const err = e as { status?: number; userMessage?: string; message?: string };
				return json(
					{ status: 'error', message: err.userMessage ?? err.message ?? 'Error al enviar' },
					{ status: err.status ?? 500 }
				);
			}
		}

		case 'recibirOrden': {
			const order_id = String(body.order_id ?? '');
			const items = body.items as Array<{
				purchase_order_item_id: string;
				quantity_received: number;
				lot_number: string;
				expiration_date: string;
				unit_cost?: number;
			}>;

			if (!order_id) return json({ status: 'error', message: 'ID de orden requerido' }, { status: 400 });
			if (!items?.length) return json({ status: 'error', message: 'Items requeridos' }, { status: 400 });

			try {
				const result = await purchaseOrdersService.receivePurchaseOrder({ order_id, items });
				return json({ status: 'success', message: 'Recepción registrada', data: result });
			} catch (e: unknown) {
				const err = e as { status?: number; userMessage?: string; message?: string };
				return json(
					{ status: 'error', message: err.userMessage ?? err.message ?? 'Error al registrar recepción' },
					{ status: err.status ?? 500 }
				);
			}
		}

		default:
			return json({ status: 'error', message: `Acción desconocida: ${action}` }, { status: 400 });
	}
};
