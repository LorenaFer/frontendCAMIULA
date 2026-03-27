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
import type {
	Dispatch,
	DispatchFilters,
	DispatchValidation,
	DispatchValidationItem,
	ExecuteDispatchInput,
	PaginatedResponse
} from '$shared/types/inventory.js';

export async function getDispatches(
	filters: DispatchFilters
): Promise<PaginatedResponse<Dispatch>> {
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

	return apiFetch<PaginatedResponse<Dispatch>>(`/inventory/dispatches?${qs}`);
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

		const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

		// Calcular despachos del paciente en el mes actual
		const patientDispatches = mockDispatches.filter(
			(d) =>
				d.fk_patient_id === prescription.fk_patient_id &&
				d.dispatch_date.startsWith(currentMonth) &&
				d.dispatch_status === 'completed'
		);

		const items: DispatchValidationItem[] = prescription.items.map((pi) => {
			// Cuánto se despachó de este medicamento al paciente este mes
			const monthlyUsed = patientDispatches.reduce((sum, d) => {
				const matchItem = d.items.find((di) => di.fk_medication_id === pi.fk_medication_id);
				return sum + (matchItem?.quantity_dispatched ?? 0);
			}, 0);

			// Límite configurado para este medicamento
			const limit = mockDispatchLimits.find(
				(l) => l.fk_medication_id === pi.fk_medication_id && l.active
			);

			// Excepción activa para este paciente y medicamento
			const today = new Date().toISOString().slice(0, 10);
			const exception = mockDispatchExceptions.find(
				(e) =>
					e.fk_patient_id === prescription.fk_patient_id &&
					e.fk_medication_id === pi.fk_medication_id &&
					e.valid_from <= today &&
					e.valid_until >= today
			);

			const monthlyLimit = limit?.monthly_max_quantity;
			const effectiveLimit = monthlyLimit
				? monthlyLimit + (exception?.authorized_quantity ?? 0)
				: undefined;
			const monthlyRemaining = effectiveLimit !== undefined
				? Math.max(0, effectiveLimit - monthlyUsed)
				: pi.quantity_prescribed;

			const stockOk = pi.medication.current_stock >= pi.quantity_prescribed;
			const limitOk =
				effectiveLimit === undefined || monthlyUsed + pi.quantity_prescribed <= effectiveLimit;

			const can_dispatch = stockOk && limitOk;
			let block_reason: string | undefined;
			if (!stockOk) {
				block_reason = `Stock insuficiente: disponible ${pi.medication.current_stock}, necesario ${pi.quantity_prescribed}`;
			} else if (!limitOk) {
				block_reason = `Límite mensual superado: usado ${monthlyUsed}/${effectiveLimit}`;
			}

			return {
				medication_id: pi.fk_medication_id,
				generic_name: pi.medication.generic_name,
				quantity_prescribed: pi.quantity_prescribed,
				quantity_available: pi.medication.current_stock,
				monthly_limit: monthlyLimit,
				monthly_used: monthlyUsed,
				monthly_remaining: monthlyRemaining,
				has_exception: exception !== undefined,
				can_dispatch,
				block_reason
			};
		});

		return {
			can_dispatch: items.every((i) => i.can_dispatch),
			prescription_id: prescriptionId,
			patient_id: prescription.fk_patient_id,
			items
		};
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
		throw new Error(
			'El despacho requiere backend real: necesita FEFO, SELECT FOR UPDATE y transacciones atómicas.'
		);
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
