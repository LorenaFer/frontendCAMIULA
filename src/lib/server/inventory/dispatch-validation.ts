// ============================================================
// Motor de validación de despachos — lógica pura sin side-effects
// Compartida entre el servicio (mock) y los tests.
// ============================================================

import type {
	Prescription,
	Dispatch,
	DispatchLimit,
	DispatchException,
	DispatchValidation,
	DispatchValidationItem
} from '$shared/types/inventory.js';

/**
 * Valida si una receta puede ser despachada según límites mensuales,
 * excepciones activas y stock disponible.
 */
export function validateDispatchLogic(
	prescription: Prescription,
	dispatches: Dispatch[],
	limits: DispatchLimit[],
	exceptions: DispatchException[]
): DispatchValidation {
	const currentMonth = new Date().toISOString().slice(0, 7);

	const patientDispatches = dispatches.filter(
		(d) =>
			d.fk_patient_id === prescription.fk_patient_id &&
			d.dispatch_date.startsWith(currentMonth) &&
			d.dispatch_status === 'completed'
	);

	const items: DispatchValidationItem[] = prescription.items.map((pi) => {
		const monthlyUsed = patientDispatches.reduce((sum, d) => {
			const matchItem = d.items.find((di) => di.fk_medication_id === pi.fk_medication_id);
			return sum + (matchItem?.quantity_dispatched ?? 0);
		}, 0);

		const limit = limits.find(
			(l) => l.fk_medication_id === pi.fk_medication_id && l.active
		);

		const today = new Date().toISOString().slice(0, 10);
		const exception = exceptions.find(
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
		prescription_id: prescription.id,
		patient_id: prescription.fk_patient_id,
		items
	};
}
