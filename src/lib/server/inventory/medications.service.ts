// ============================================================
// Medications Service — catálogo de medicamentos
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockMedications } from '../mock/data.js';
import type {
	Medication,
	MedicationOption,
	MedicationFilters,
	CreateMedicationInput,
	InventoryPaginatedResponse
} from '$shared/types/inventory.js';

export async function getMedications(
	filters: MedicationFilters
): Promise<InventoryPaginatedResponse<Medication>> {
	if (mockFlags.inventoryMedications) {
		let data = [...mockMedications];

		if (filters.search) {
			const q = filters.search.toLowerCase();
			data = data.filter(
				(m) =>
					m.generic_name.toLowerCase().includes(q) ||
					m.code.toLowerCase().includes(q) ||
					(m.commercial_name?.toLowerCase().includes(q) ?? false)
			);
		}
		if (filters.status) {
			data = data.filter((m) => m.medication_status === filters.status);
		}
		if (filters.therapeutic_class) {
			data = data.filter((m) => m.therapeutic_class === filters.therapeutic_class);
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
	if (filters.search) qs.set('q', filters.search);
	if (filters.status) qs.set('status', filters.status);
	if (filters.therapeutic_class) qs.set('therapeutic_class', filters.therapeutic_class);
	if (filters.category_id) qs.set('category_id', filters.category_id);
	qs.set('page', String(filters.page ?? 1));
	qs.set('page_size', String(filters.pageSize ?? 25));

	const raw = await apiFetch<Record<string, unknown>>(`/inventory/medications?${qs}`);
	const items = (raw.items as Medication[]) ?? [];
	const pagination = raw.pagination as Record<string, number>;
	return {
		data: items,
		total: pagination.total,
		page: pagination.page,
		pageSize: pagination.page_size,
		hasNext: pagination.page < pagination.pages
	};
}

export async function getMedicationById(id: string): Promise<Medication | null> {
	if (mockFlags.inventoryMedications) {
		return mockMedications.find((m) => m.id === id) ?? null;
	}
	return apiFetch<Medication>(`/inventory/medications/${id}`);
}

export async function getMedicationOptions(): Promise<MedicationOption[]> {
	if (mockFlags.inventoryMedications) {
		return mockMedications.map((m) => ({
			id: m.id,
			code: m.code,
			generic_name: m.generic_name,
			pharmaceutical_form: m.pharmaceutical_form,
			concentration: m.concentration,
			unit_measure: m.unit_measure,
			current_stock: m.current_stock
		}));
	}
	return apiFetch<MedicationOption[]>('/inventory/medications/options');
}

export async function createMedication(input: CreateMedicationInput): Promise<Medication> {
	if (mockFlags.inventoryMedications) {
		const existing = mockMedications.find(
			(m) => m.code.toLowerCase() === input.code.toLowerCase()
		);
		if (existing) {
			throw Object.assign(new Error('Ya existe un medicamento con ese código'), { status: 409 });
		}

		const nuevo: Medication = {
			id: `med-${Date.now()}`,
			...input,
			medication_status: 'active',
			current_stock: 0,
			created_at: new Date().toISOString()
		};
		mockMedications.push(nuevo);
		return nuevo;
	}

	return apiFetch<Medication>('/inventory/medications', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function updateMedication(
	id: string,
	input: Partial<CreateMedicationInput>
): Promise<Medication> {
	if (mockFlags.inventoryMedications) {
		const idx = mockMedications.findIndex((m) => m.id === id);
		if (idx === -1) {
			throw Object.assign(new Error('Medicamento no encontrado'), { status: 404 });
		}
		Object.assign(mockMedications[idx], input);
		return mockMedications[idx];
	}

	return apiFetch<Medication>(`/inventory/medications/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}
