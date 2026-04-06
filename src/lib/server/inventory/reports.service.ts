// ============================================================
// Reports Service — reportes de inventario
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockStockItems, mockBatches } from '../mock/data.js';
import type {
	StockReport,
	ConsumptionReport,
	ExpirationReport,
	InventoryMovement,
	MovementFilters,
	StockAlertRecord,
	StockAlertsResponse,
	StockAlertFilters,
	InventoryPaginatedResponse
} from '$shared/types/inventory.js';

export async function getStockReport(): Promise<StockReport> {
	if (mockFlags.inventoryReports) {
		const critical_count = mockStockItems.filter(
			(s) => s.stock_alert === 'critical'
		).length;
		const expired_count = mockStockItems.filter(
			(s) => s.stock_alert === 'expired'
		).length;

		return {
			generated_at: new Date().toISOString(),
			items: mockStockItems,
			total_medications: mockStockItems.length,
			critical_count,
			expired_count
		};
	}

	return apiFetch<StockReport>('/inventory/reports/stock');
}

export async function getConsumptionReport(period: string): Promise<ConsumptionReport> {
	if (mockFlags.inventoryReports) {
		// Sin despachos en mock — devuelve período con lista vacía
		return { period, items: [] };
	}

	return apiFetch<ConsumptionReport>(`/inventory/reports/consumption?period=${period}`);
}

export async function getExpirationReport(
	thresholdDays = 90
): Promise<ExpirationReport> {
	if (mockFlags.inventoryReports) {
		const threshold = new Date();
		threshold.setDate(threshold.getDate() + thresholdDays);

		const batches = mockBatches.filter(
			(b) =>
				b.batch_status === 'available' &&
				new Date(b.expiration_date) <= threshold
		);

		return {
			generated_at: new Date().toISOString(),
			threshold_days: thresholdDays,
			batches
		};
	}

	return apiFetch<ExpirationReport>(
		`/inventory/reports/expiration?threshold_days=${thresholdDays}`
	);
}

// ─── Movimientos de Inventario (Kardex) ──────────────────────

export async function getInventoryMovements(
	filters: MovementFilters = {}
): Promise<InventoryPaginatedResponse<InventoryMovement>> {
	if (mockFlags.inventoryReports) {
		return { data: [], total: 0, page: 1, pageSize: 20, hasNext: false };
	}

	const qs = new URLSearchParams();
	if (filters.medication_id) qs.set('medication_id', filters.medication_id);
	if (filters.movement_type) qs.set('movement_type', filters.movement_type);
	if (filters.date_from) qs.set('date_from', filters.date_from);
	if (filters.date_to) qs.set('date_to', filters.date_to);
	qs.set('page', String(filters.page ?? 1));
	qs.set('page_size', String(filters.pageSize ?? 20));

	const raw = await apiFetch<Record<string, unknown>>(
		`/inventory/reports/inventory-movements?${qs}`
	);

	const items = (raw.items as InventoryMovement[]) ?? [];
	const pagination = raw.pagination as Record<string, number>;

	return {
		data: items,
		total: pagination?.total ?? 0,
		page: pagination?.page ?? 1,
		pageSize: pagination?.page_size ?? 20,
		hasNext: (pagination?.page ?? 1) < (pagination?.pages ?? 1)
	};
}

// ─── Alertas de Stock (persistidas) ──────────────────────────

export async function getStockAlerts(
	filters: StockAlertFilters = {}
): Promise<StockAlertsResponse & { page: number; pageSize: number; hasNext: boolean }> {
	if (mockFlags.inventoryReports) {
		return { items: [], total: 0, active_count: 0, resolved_count: 0, page: 1, pageSize: 50, hasNext: false };
	}

	const qs = new URLSearchParams();
	if (filters.alert_status) qs.set('alert_status', filters.alert_status);
	if (filters.alert_level) qs.set('alert_level', filters.alert_level);
	if (filters.medication_id) qs.set('medication_id', filters.medication_id);
	qs.set('page', String(filters.page ?? 1));
	qs.set('page_size', String(filters.pageSize ?? 50));

	const raw = await apiFetch<StockAlertsResponse>(`/inventory/reports/stock-alerts?${qs}`);

	const total = raw.total ?? raw.items?.length ?? 0;
	const pageSize = filters.pageSize ?? 50;
	const page = filters.page ?? 1;

	return {
		...raw,
		page,
		pageSize,
		hasNext: page * pageSize < total
	};
}

export async function generateStockAlerts(): Promise<{ new_alerts: number }> {
	return apiFetch<{ new_alerts: number }>('/inventory/reports/stock-alerts/generate', {
		method: 'POST'
	});
}

export async function acknowledgeStockAlert(alertId: string): Promise<void> {
	await apiFetch(`/inventory/reports/stock-alerts/${alertId}/acknowledge`, {
		method: 'PATCH'
	});
}

export async function resolveStockAlert(alertId: string): Promise<void> {
	await apiFetch(`/inventory/reports/stock-alerts/${alertId}/resolve`, {
		method: 'PATCH'
	});
}
