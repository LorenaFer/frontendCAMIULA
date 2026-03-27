// ============================================================
// Batches Service — lotes y stock consolidado
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockBatches, mockStockItems } from '../mock/data.js';
import type {
	Batch,
	BatchFilters,
	StockItem,
	PaginatedResponse
} from '$shared/types/inventory.js';

export async function getBatches(
	filters: BatchFilters
): Promise<PaginatedResponse<Batch>> {
	if (mockFlags.inventoryBatches) {
		let data = [...mockBatches];

		if (filters.medication_id) {
			data = data.filter((b) => b.fk_medication_id === filters.medication_id);
		}
		if (filters.status) {
			data = data.filter((b) => b.batch_status === filters.status);
		}
		if (filters.expiring_before) {
			const threshold = new Date(filters.expiring_before);
			data = data.filter((b) => new Date(b.expiration_date) <= threshold);
		}

		const total = data.length;
		const page = filters.page ?? 1;
		const pageSize = filters.pageSize ?? 25;
		const start = (page - 1) * pageSize;

		return {
			data: data.slice(start, start + pageSize),
			total,
			page,
			pageSize,
			hasNext: start + pageSize < total
		};
	}

	const qs = new URLSearchParams();
	if (filters.medication_id) qs.set('medication_id', filters.medication_id);
	if (filters.status) qs.set('status', filters.status);
	if (filters.expiring_before) qs.set('expiring_before', filters.expiring_before);
	qs.set('page', String(filters.page ?? 1));
	qs.set('page_size', String(filters.pageSize ?? 25));

	return apiFetch<PaginatedResponse<Batch>>(`/inventory/batches?${qs}`);
}

export async function getBatchById(id: string): Promise<Batch | null> {
	if (mockFlags.inventoryBatches) {
		return mockBatches.find((b) => b.id === id) ?? null;
	}
	return apiFetch<Batch>(`/inventory/batches/${id}`);
}

export async function getCurrentStock(): Promise<StockItem[]> {
	if (mockFlags.inventoryBatches) {
		return mockStockItems;
	}
	return apiFetch<StockItem[]>('/inventory/reports/stock');
}
