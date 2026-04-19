// ============================================================
// Cliente de los endpoints REST del módulo de Inventario.
//
// Encapsula los envelopes JSON, los handlers de error de red y
// la firma de cada acción soportada por los servidores:
//   • /inventory/alerts          → envelope { ok, ...payload }
//   • /inventory/purchase-orders → envelope { status, data?, message? }
//
// Los componentes solo se ocupan del estado de UI (loading,
// toasts, navegación) — nunca arman fetch ni parsean envelopes.
// ============================================================

import type { PurchaseOrder } from './types.js';

// ─── Envelope de /inventory/purchase-orders ──────────────────

interface PurchaseOrderEnvelope<T> {
	status: 'success' | 'error';
	data?: T;
	message?: string;
}

async function purchaseOrdersCall<T>(
	action: string,
	body: Record<string, unknown>
): Promise<T> {
	const res = await fetch('/inventory/purchase-orders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action, ...body })
	});
	const json = (await res.json()) as PurchaseOrderEnvelope<T>;
	if (json.status === 'success' && json.data !== undefined) return json.data;
	throw new Error(json.message ?? 'Error desconocido');
}

// ─── Envelope de /inventory/alerts ───────────────────────────
//
// El endpoint responde { ok: boolean, ...payload } y usa códigos
// HTTP para señalizar el éxito. Mantenemos esa semántica para no
// romper el contrato existente.

interface AlertsEnvelope {
	ok?: boolean;
	error?: string;
	new_alerts?: number;
}

async function alertsCall<T extends AlertsEnvelope>(
	body: Record<string, unknown>
): Promise<T> {
	const res = await fetch('/inventory/alerts', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error('Error en la acción');
	return (await res.json()) as T;
}

// ─── Acciones sobre alertas de stock ─────────────────────────

export interface GenerateAlertsResult {
	new_alerts: number;
}

export async function generateStockAlerts(): Promise<GenerateAlertsResult> {
	const result = await alertsCall<AlertsEnvelope>({ action: 'generate' });
	return { new_alerts: result.new_alerts ?? 0 };
}

export async function acknowledgeStockAlert(alertId: string): Promise<void> {
	await alertsCall({ action: 'acknowledge', alert_id: alertId });
}

export async function resolveStockAlert(alertId: string): Promise<void> {
	await alertsCall({ action: 'resolve', alert_id: alertId });
}

// ─── Acciones sobre órdenes de compra ────────────────────────

export function sendPurchaseOrder(orderId: string): Promise<PurchaseOrder> {
	return purchaseOrdersCall<PurchaseOrder>('enviarOrden', { order_id: orderId });
}

export interface ReceivePurchaseOrderItemInput {
	purchase_order_item_id: string;
	quantity_received: number;
	lot_number: string;
	expiration_date: string;
	unit_cost?: number;
}

export interface ReceivePurchaseOrderInput {
	order_id: string;
	items: ReceivePurchaseOrderItemInput[];
}

export function receivePurchaseOrder(
	input: ReceivePurchaseOrderInput
): Promise<PurchaseOrder> {
	return purchaseOrdersCall<PurchaseOrder>('recibirOrden', {
		order_id: input.order_id,
		items: input.items
	});
}
