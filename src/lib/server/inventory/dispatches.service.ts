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
} from '$domain/inventory/types.js';

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

	const raw = await apiFetch<Record<string, unknown>>(`/inventory/dispatches?${qs}`);
	const items = ((raw.items as Record<string, unknown>[]) ?? []).map(mapDispatchFromApi);
	const pagination = raw.pagination as Record<string, number>;
	return {
		data: items,
		total: pagination.total,
		page: pagination.page,
		pageSize: pagination.page_size,
		hasNext: pagination.page < pagination.pages
	};
}

/**
 * Normaliza los nombres de campo del backend FastAPI a los tipos del dominio.
 * El backend usa snake_case con variantes (`patient_full_name`, `batch_number`, `medication_name`)
 * mientras que la UI espera (`patient_name`, `lot_number`, `medication.generic_name`).
 */
function mapDispatchFromApi(raw: Record<string, unknown>): Dispatch {
	const rawItems = (raw.items as Record<string, unknown>[]) ?? [];
	return {
		id: String(raw.id ?? ''),
		fk_prescription_id: String(raw.fk_prescription_id ?? raw.prescription_id ?? ''),
		prescription_number: String(raw.prescription_number ?? ''),
		fk_patient_id: String(raw.fk_patient_id ?? raw.patient_id ?? ''),
		patient_name: (raw.patient_name ?? raw.patient_full_name) as string | undefined,
		fk_pharmacist_id: String(raw.fk_pharmacist_id ?? raw.pharmacist_id ?? ''),
		pharmacist_name: (raw.pharmacist_name ?? raw.pharmacist_full_name) as string | undefined,
		dispatch_date: String(raw.dispatch_date ?? ''),
		notes: raw.notes as string | undefined,
		dispatch_status: raw.dispatch_status as Dispatch['dispatch_status'],
		items: rawItems.map(mapDispatchItemFromApi),
		created_at: String(raw.created_at ?? '')
	};
}

function mapDispatchItemFromApi(raw: Record<string, unknown>): Dispatch['items'][number] {
	const medicationId = String(raw.fk_medication_id ?? raw.medication_id ?? '');
	const genericName = String(
		raw.generic_name
		?? raw.medication_name
		?? (raw.medication as Record<string, unknown> | undefined)?.generic_name
		?? ''
	);
	const pharmaceuticalForm = String(
		raw.pharmaceutical_form
		?? (raw.medication as Record<string, unknown> | undefined)?.pharmaceutical_form
		?? ''
	);
	const unitMeasure = String(
		raw.unit_measure
		?? (raw.medication as Record<string, unknown> | undefined)?.unit_measure
		?? ''
	);
	return {
		id: String(raw.id ?? ''),
		fk_batch_id: String(raw.fk_batch_id ?? raw.batch_id ?? ''),
		lot_number: String(raw.lot_number ?? raw.batch_number ?? ''),
		expiration_date: String(raw.expiration_date ?? ''),
		fk_medication_id: medicationId,
		medication: {
			id: medicationId,
			generic_name: genericName,
			pharmaceutical_form: pharmaceuticalForm,
			unit_measure: unitMeasure
		} as Dispatch['items'][number]['medication'],
		quantity_dispatched: Number(raw.quantity_dispatched ?? 0)
	};
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
