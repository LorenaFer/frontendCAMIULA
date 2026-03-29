// ============================================================
// Purchase Orders Service — órdenes de compra
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockPurchaseOrders } from '../mock/data.js';
import type {
	PurchaseOrder,
	CreatePurchaseOrderInput,
	ReceivePurchaseOrderInput,
	InventoryPaginatedResponse
} from '$shared/types/inventory.js';

export async function getPurchaseOrders(
	page = 1,
	pageSize = 25
): Promise<InventoryPaginatedResponse<PurchaseOrder>> {
	if (mockFlags.inventoryPurchaseOrders) {
		const start = (page - 1) * pageSize;
		return {
			data: mockPurchaseOrders.slice(start, start + pageSize),
			total: mockPurchaseOrders.length,
			page,
			pageSize,
			hasNext: start + pageSize < mockPurchaseOrders.length
		};
	}

	return apiFetch<InventoryPaginatedResponse<PurchaseOrder>>(
		`/inventory/purchase-orders?page=${page}&page_size=${pageSize}`
	);
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
	if (mockFlags.inventoryPurchaseOrders) {
		return mockPurchaseOrders.find((o) => o.id === id) ?? null;
	}
	return apiFetch<PurchaseOrder>(`/inventory/purchase-orders/${id}`);
}

export async function createPurchaseOrder(
	input: CreatePurchaseOrderInput
): Promise<PurchaseOrder> {
	if (mockFlags.inventoryPurchaseOrders) {
		// La creación de órdenes con ítems requiere resolución de medicamentos
		// en el mock; delegar al backend real para consistencia.
		throw new Error('Mock: crear orden de compra requiere backend real');
	}

	return apiFetch<PurchaseOrder>('/inventory/purchase-orders', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function receivePurchaseOrder(
	input: ReceivePurchaseOrderInput
): Promise<PurchaseOrder> {
	if (mockFlags.inventoryPurchaseOrders) {
		const order = mockPurchaseOrders.find((o) => o.id === input.order_id);
		if (!order) {
			throw Object.assign(new Error('Orden de compra no encontrada'), { status: 404 });
		}
		order.order_status = 'received';
		return order;
	}

	return apiFetch<PurchaseOrder>(
		`/inventory/purchase-orders/${input.order_id}/receive`,
		{ method: 'POST', body: JSON.stringify(input) }
	);
}
