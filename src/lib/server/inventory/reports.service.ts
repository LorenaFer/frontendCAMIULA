// ============================================================
// Reports Service — reportes de inventario
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockStockItems, mockBatches } from '../mock/data.js';
import type {
	StockReport,
	ConsumptionReport,
	ExpirationReport
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
