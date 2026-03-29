// ============================================================
// Suppliers Service — gestión de proveedores
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockSuppliers } from '../mock/data.js';
import type {
	Supplier,
	SupplierOption,
	CreateSupplierInput,
	InventoryPaginatedResponse
} from '$shared/types/inventory.js';

export async function getSuppliers(
	page = 1,
	pageSize = 25
): Promise<InventoryPaginatedResponse<Supplier>> {
	if (mockFlags.inventorySuppliers) {
		const start = (page - 1) * pageSize;
		return {
			data: mockSuppliers.slice(start, start + pageSize),
			total: mockSuppliers.length,
			page,
			pageSize,
			hasNext: start + pageSize < mockSuppliers.length
		};
	}

	return apiFetch<InventoryPaginatedResponse<Supplier>>(
		`/inventory/suppliers?page=${page}&page_size=${pageSize}`
	);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
	if (mockFlags.inventorySuppliers) {
		return mockSuppliers.find((s) => s.id === id) ?? null;
	}
	return apiFetch<Supplier>(`/inventory/suppliers/${id}`);
}

export async function getSupplierOptions(): Promise<SupplierOption[]> {
	if (mockFlags.inventorySuppliers) {
		return mockSuppliers
			.filter((s) => s.supplier_status === 'active')
			.map((s) => ({ id: s.id, name: s.name, rif: s.rif }));
	}
	return apiFetch<SupplierOption[]>('/inventory/suppliers/options');
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
	if (mockFlags.inventorySuppliers) {
		const existing = mockSuppliers.find(
			(s) => s.rif.toLowerCase() === input.rif.toLowerCase()
		);
		if (existing) {
			throw Object.assign(new Error('Ya existe un proveedor con ese RIF'), { status: 409 });
		}

		const nuevo: Supplier = {
			id: `sup-${Date.now()}`,
			...input,
			supplier_status: 'active',
			created_at: new Date().toISOString()
		};
		mockSuppliers.push(nuevo);
		return nuevo;
	}

	return apiFetch<Supplier>('/inventory/suppliers', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function updateSupplier(
	id: string,
	input: Partial<CreateSupplierInput>
): Promise<Supplier> {
	if (mockFlags.inventorySuppliers) {
		const idx = mockSuppliers.findIndex((s) => s.id === id);
		if (idx === -1) {
			throw Object.assign(new Error('Proveedor no encontrado'), { status: 404 });
		}
		Object.assign(mockSuppliers[idx], input);
		return mockSuppliers[idx];
	}

	return apiFetch<Supplier>(`/inventory/suppliers/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}
