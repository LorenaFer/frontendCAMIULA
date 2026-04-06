// ============================================================
// Categories Service — categorías de medicamentos
// ============================================================

import { apiFetch } from '../api.js';
import type {
	MedicationCategory,
	CreateCategoryInput,
	InventoryPaginatedResponse
} from '$shared/types/inventory.js';

export async function getCategories(
	page = 1,
	pageSize = 50,
	search?: string
): Promise<InventoryPaginatedResponse<MedicationCategory>> {
	const qs = new URLSearchParams();
	if (search) qs.set('search', search);
	qs.set('page', String(page));
	qs.set('page_size', String(pageSize));

	const raw = await apiFetch<Record<string, unknown>>(
		`/inventory/categories?${qs}`
	);

	const items = (raw.items as MedicationCategory[]) ?? [];
	const pagination = raw.pagination as Record<string, number>;

	return {
		data: items,
		total: pagination?.total ?? items.length,
		page: pagination?.page ?? page,
		pageSize: pagination?.page_size ?? pageSize,
		hasNext: (pagination?.page ?? 1) < (pagination?.total_pages ?? 1)
	};
}

export async function getCategoryOptions(): Promise<MedicationCategory[]> {
	const result = await getCategories(1, 100);
	return result.data;
}

export async function getCategoryById(id: string): Promise<MedicationCategory> {
	return apiFetch<MedicationCategory>(`/inventory/categories/${id}`);
}

export async function createCategory(input: CreateCategoryInput): Promise<MedicationCategory> {
	return apiFetch<MedicationCategory>('/inventory/categories', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function updateCategory(
	id: string,
	input: Partial<CreateCategoryInput>
): Promise<MedicationCategory> {
	return apiFetch<MedicationCategory>(`/inventory/categories/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}

export async function deleteCategory(id: string): Promise<void> {
	await apiFetch(`/inventory/categories/${id}`, { method: 'DELETE' });
}
