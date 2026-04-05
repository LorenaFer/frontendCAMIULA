// ============================================================
// Prescriptions Service — recetas médicas
// ============================================================

import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
import { mockPrescriptions, mockMedications } from '../mock/data.js';
import type { Prescription, CreatePrescriptionInput } from '$shared/types/inventory.js';

export async function getPrescriptionByAppointment(
	appointmentId: string
): Promise<Prescription | null> {
	if (mockFlags.inventoryPrescriptions) {
		return (
			mockPrescriptions.find((p) => p.fk_appointment_id === appointmentId) ?? null
		);
	}
	return apiFetch<Prescription | null>(
		`/inventory/prescriptions?appointment_id=${appointmentId}`
	);
}

export async function getPrescriptionById(id: string): Promise<Prescription | null> {
	if (mockFlags.inventoryPrescriptions) {
		return mockPrescriptions.find((p) => p.id === id) ?? null;
	}
	return apiFetch<Prescription>(`/inventory/prescriptions/${id}`);
}

export async function getPrescriptionByNumber(
	prescriptionNumber: string
): Promise<Prescription | null> {
	if (mockFlags.inventoryPrescriptions) {
		return (
			mockPrescriptions.find((p) => p.prescription_number === prescriptionNumber) ?? null
		);
	}
	return apiFetch<Prescription | null>(
		`/inventory/prescriptions?prescription_number=${encodeURIComponent(prescriptionNumber)}`
	);
}

export async function getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
	if (mockFlags.inventoryPrescriptions) {
		return mockPrescriptions.filter((p) => p.fk_patient_id === patientId);
	}
	const raw = await apiFetch<unknown>(`/inventory/prescriptions?patient_id=${patientId}`);
	// El backend puede devolver array o { items, pagination }
	if (Array.isArray(raw)) return raw as Prescription[];
	const obj = raw as Record<string, unknown>;
	if (obj.items) return obj.items as Prescription[];
	return [];
}

export async function createPrescription(
	input: CreatePrescriptionInput
): Promise<Prescription> {
	if (mockFlags.inventoryPrescriptions) {
		// Resolver datos de medicamentos desde el mock para que los ítems
		// devuelvan el objeto medication completo.
		const resolvedItems = input.items.map((item, i) => {
			const med = mockMedications.find((m) => m.id === item.medication_id);
			return {
				id: `pi-${Date.now()}-${i}`,
				fk_medication_id: item.medication_id,
				medication: med
					? {
							id: med.id,
							code: med.code,
							generic_name: med.generic_name,
							pharmaceutical_form: med.pharmaceutical_form,
							unit_measure: med.unit_measure,
							current_stock: med.current_stock
						}
					: {
							id: item.medication_id,
							code: '?',
							generic_name: 'Desconocido',
							pharmaceutical_form: '?',
							unit_measure: '?',
							current_stock: 0
						},
				quantity_prescribed: item.quantity_prescribed,
				dosage_instructions: item.dosage_instructions,
				duration_days: item.duration_days
			};
		});

		const nueva: Prescription = {
			id: `presc-${Date.now()}`,
			prescription_number: `RX-${Date.now()}`,
			fk_appointment_id: input.fk_appointment_id,
			fk_patient_id: input.fk_patient_id,
			fk_doctor_id: 'doc-mock',
			prescription_date: new Date().toISOString().slice(0, 10),
			notes: input.notes,
			prescription_status: 'issued',
			items: resolvedItems,
			created_at: new Date().toISOString()
		};

		mockPrescriptions.push(nueva);
		return nueva;
	}

	return apiFetch<Prescription>('/inventory/prescriptions', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}
