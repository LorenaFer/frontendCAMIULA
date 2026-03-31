// ============================================================
// Dispatches Service — despacho de medicamentos
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import {
	mockDispatches,
	mockPrescriptions,
	mockDispatchLimits,
	mockDispatchExceptions
} from '../mock/data.js';
import { validateDispatchLogic } from './dispatch-validation.js';
import type {
	Dispatch,
	DispatchFilters,
	DispatchValidation,
	ExecuteDispatchInput,
	InventoryPaginatedResponse
} from '$shared/types/inventory.js';

export async function getDispatches(
	filters: DispatchFilters
): Promise<InventoryPaginatedResponse<Dispatch>> {
	if (mockFlags.inventoryDispatches) {
		let data = [...mockDispatches];

		if (filters.status) {
			data = data.filter((d) => d.dispatch_status === filters.status);
		}
		if (filters.patient_id) {
			data = data.filter((d) => d.fk_patient_id === filters.patient_id);
		}
		if (filters.prescription_number) {
			const q = filters.prescription_number.toLowerCase();
			data = data.filter((d) => d.prescription_number.toLowerCase().includes(q));
		}
		if (filters.date_from) {
			data = data.filter((d) => d.dispatch_date >= filters.date_from!);
		}
		if (filters.date_to) {
			data = data.filter((d) => d.dispatch_date <= filters.date_to!);
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
	if (filters.prescription_number) qs.set('prescription_number', filters.prescription_number);
	if (filters.status) qs.set('status', filters.status);
	if (filters.patient_id) qs.set('patient_id', filters.patient_id);
	if (filters.date_from) qs.set('date_from', filters.date_from);
	if (filters.date_to) qs.set('date_to', filters.date_to);
	qs.set('page', String(filters.page ?? 1));
	qs.set('page_size', String(filters.pageSize ?? 25));

	return apiFetch<InventoryPaginatedResponse<Dispatch>>(`/inventory/dispatches?${qs}`);
}

/**
 * Valida si una receta puede ser despachada.
 * En mock: verifica límites mensuales contra los despachos anteriores del paciente.
 */
export async function validateDispatch(
	prescriptionId: string
): Promise<DispatchValidation> {
	if (mockFlags.inventoryDispatches) {
		const prescription = mockPrescriptions.find((p) => p.id === prescriptionId);
		if (!prescription) {
			throw Object.assign(new Error('Receta no encontrada'), { status: 404 });
		}

		return validateDispatchLogic(
			prescription,
			mockDispatches,
			mockDispatchLimits,
			mockDispatchExceptions
		);
	}

	return apiFetch<DispatchValidation>(
		`/inventory/dispatches/validate?prescription_id=${prescriptionId}`
	);
}

/**
 * Ejecuta el despacho. En producción aplica lógica FEFO y transacciones
 * atómicas en el backend. En mock, la operación no está soportada para
 * evitar inconsistencias de stock sin FEFO real.
 */
export async function executeDispatch(input: ExecuteDispatchInput): Promise<Dispatch> {
	if (mockFlags.inventoryDispatches) {
		const prescription = mockPrescriptions.find((p) => p.id === input.prescription_id);
		if (!prescription) {
			throw Object.assign(new Error('Receta no encontrada'), { status: 404 });
		}

		const dispatch: Dispatch = {
			id: `disp-${Date.now()}`,
			fk_prescription_id: prescription.id,
			prescription_number: prescription.prescription_number,
			fk_patient_id: prescription.fk_patient_id,
			patient_name: prescription.patient_name,
			fk_pharmacist_id: input.pharmacist_id,
			pharmacist_name: 'Admin Principal',
			dispatch_date: new Date().toISOString().split('T')[0],
			dispatch_status: 'completed',
			items: prescription.items.map((item) => ({
				id: `di-${Date.now()}-${item.id}`,
				fk_batch_id: 'batch-mock',
				lot_number: 'LOTE-MOCK',
				expiration_date: '2027-12-31',
				fk_medication_id: item.fk_medication_id,
				medication: item.medication,
				quantity_dispatched: item.quantity_prescribed
			})),
			created_at: new Date().toISOString()
		};

		mockDispatches.push(dispatch);
		return dispatch;
	}

	return apiFetch<Dispatch>('/inventory/dispatches', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function cancelDispatch(id: string, reason: string): Promise<void> {
	if (mockFlags.inventoryDispatches) {
		const dispatch = mockDispatches.find((d) => d.id === id);
		if (!dispatch) {
			throw Object.assign(new Error('Despacho no encontrado'), { status: 404 });
		}
		dispatch.dispatch_status = 'cancelled';
		dispatch.notes = reason;
		return;
	}

	await apiFetch(`/inventory/dispatches/${id}/cancel`, {
		method: 'POST',
		body: JSON.stringify({ reason })
	});
}
