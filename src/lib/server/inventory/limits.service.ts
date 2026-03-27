// ============================================================
// Limits Service — límites y excepciones de despacho
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockDispatchLimits, mockDispatchExceptions, mockMedications } from '../mock/data.js';
import type {
	DispatchLimit,
	DispatchException,
	CreateDispatchLimitInput,
	CreateDispatchExceptionInput
} from '$shared/types/inventory.js';

export async function getDispatchLimits(): Promise<DispatchLimit[]> {
	if (mockFlags.inventoryLimits) {
		return mockDispatchLimits;
	}
	return apiFetch<DispatchLimit[]>('/inventory/dispatch-limits');
}

export async function createDispatchLimit(
	input: CreateDispatchLimitInput
): Promise<DispatchLimit> {
	if (mockFlags.inventoryLimits) {
		const med = mockMedications.find((m) => m.id === input.fk_medication_id);
		if (!med) {
			throw Object.assign(new Error('Medicamento no encontrado'), { status: 404 });
		}

		const nuevo: DispatchLimit = {
			id: `lim-${Date.now()}`,
			fk_medication_id: input.fk_medication_id,
			medication: {
				id: med.id,
				code: med.code,
				generic_name: med.generic_name,
				pharmaceutical_form: med.pharmaceutical_form,
				unit_measure: med.unit_measure,
				current_stock: med.current_stock
			},
			monthly_max_quantity: input.monthly_max_quantity,
			applies_to: input.applies_to,
			active: true,
			created_at: new Date().toISOString()
		};

		mockDispatchLimits.push(nuevo);
		return nuevo;
	}

	return apiFetch<DispatchLimit>('/inventory/dispatch-limits', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function updateDispatchLimit(
	id: string,
	input: Partial<CreateDispatchLimitInput>
): Promise<DispatchLimit> {
	if (mockFlags.inventoryLimits) {
		const idx = mockDispatchLimits.findIndex((l) => l.id === id);
		if (idx === -1) {
			throw Object.assign(new Error('Límite no encontrado'), { status: 404 });
		}
		Object.assign(mockDispatchLimits[idx], input);
		return mockDispatchLimits[idx];
	}

	return apiFetch<DispatchLimit>(`/inventory/dispatch-limits/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}

export async function getDispatchExceptions(): Promise<DispatchException[]> {
	if (mockFlags.inventoryLimits) {
		return mockDispatchExceptions;
	}
	return apiFetch<DispatchException[]>('/inventory/dispatch-exceptions');
}

export async function createDispatchException(
	input: CreateDispatchExceptionInput
): Promise<DispatchException> {
	if (mockFlags.inventoryLimits) {
		const med = mockMedications.find((m) => m.id === input.fk_medication_id);
		if (!med) {
			throw Object.assign(new Error('Medicamento no encontrado'), { status: 404 });
		}

		const nueva: DispatchException = {
			id: `exc-${Date.now()}`,
			fk_patient_id: input.fk_patient_id,
			fk_medication_id: input.fk_medication_id,
			medication: {
				id: med.id,
				code: med.code,
				generic_name: med.generic_name,
				pharmaceutical_form: med.pharmaceutical_form,
				unit_measure: med.unit_measure,
				current_stock: med.current_stock
			},
			authorized_quantity: input.authorized_quantity,
			valid_from: input.valid_from,
			valid_until: input.valid_until,
			reason: input.reason,
			created_at: new Date().toISOString()
		};

		mockDispatchExceptions.push(nueva);
		return nueva;
	}

	return apiFetch<DispatchException>('/inventory/dispatch-exceptions', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}
