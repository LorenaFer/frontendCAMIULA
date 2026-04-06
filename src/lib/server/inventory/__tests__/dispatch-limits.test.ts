/**
 * Tests de lógica crítica del módulo de inventario.
 *
 * Estos tests validan el comportamiento del motor de validación de despachos
 * (límites mensuales, excepciones, cálculo de stock) de forma aislada del
 * runtime SvelteKit, usando datos idénticos a los mocks de producción.
 */

import { describe, it, expect } from 'vitest';
import type {
	Prescription,
	Dispatch,
	DispatchLimit,
	DispatchException,
	Batch
} from '$domain/inventory/types.js';
import { validateDispatchLogic } from '../dispatch-validation.js';

// ─── Utilidad para calcular daysLeft de un lote ──────────────────────────────

function calcDaysLeft(expiration_date: string): number {
	const exp = new Date(expiration_date);
	const now = new Date();
	exp.setHours(0, 0, 0, 0);
	now.setHours(0, 0, 0, 0);
	return Math.ceil((exp.getTime() - now.getTime()) / 86_400_000);
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const THIS_MONTH = new Date().toISOString().slice(0, 7);

const AMOXICILINA_MED = {
	id: 'med-1',
	code: 'MED-001',
	generic_name: 'Amoxicilina',
	pharmaceutical_form: 'Cápsula',
	unit_measure: 'cápsulas',
	current_stock: 350
};

const basePrescription: Prescription = {
	id: 'presc-test',
	prescription_number: 'RX-TEST-001',
	fk_appointment_id: '99',
	fk_patient_id: 'pat-test',
	fk_doctor_id: 'doc-1',
	prescription_date: TODAY,
	prescription_status: 'issued',
	items: [
		{
			id: 'pi-test-1',
			fk_medication_id: 'med-1',
			medication: AMOXICILINA_MED,
			quantity_prescribed: 21,
			dosage_instructions: '1 cápsula cada 8 horas',
			duration_days: 7
		}
	],
	created_at: new Date().toISOString()
};

const amoxicilinLimit: DispatchLimit = {
	id: 'lim-1',
	fk_medication_id: 'med-1',
	medication: AMOXICILINA_MED,
	monthly_max_quantity: 42,
	applies_to: 'all',
	active: true,
	created_at: '2026-01-01T08:00:00Z'
};

// Despacho previo: ya usó 30 cápsulas este mes
function makePastDispatch(quantityDispatched: number): Dispatch {
	return {
		id: 'disp-past',
		fk_prescription_id: 'presc-prev',
		prescription_number: 'RX-PREV',
		fk_patient_id: 'pat-test',
		fk_pharmacist_id: 'far-1',
		dispatch_date: `${THIS_MONTH}-10`,
		dispatch_status: 'completed',
		items: [
			{
				id: 'di-past',
				fk_batch_id: 'bat-1',
				lot_number: 'LOT-2026-001',
				expiration_date: '2027-06-30',
				fk_medication_id: 'med-1',
				medication: AMOXICILINA_MED,
				quantity_dispatched: quantityDispatched
			}
		],
		created_at: new Date().toISOString()
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Validación de límites de despacho', () => {

	describe('Caso 1: Bloqueo por límite mensual de Amoxicilina (42 cápsulas)', () => {
		it('PASA: permite despacho cuando el paciente no ha usado nada este mes', () => {
			const result = validateDispatchLogic(basePrescription, [], [amoxicilinLimit], []);

			expect(result.can_dispatch).toBe(true);
			expect(result.items[0].can_dispatch).toBe(true);
			expect(result.items[0].monthly_used).toBe(0);
			expect(result.items[0].monthly_remaining).toBe(42); // 42 - 0 = 42
		});

		it('PASA: permite despacho cuando el paciente usó 21 cápsulas (21 + 21 = 42 = límite exacto)', () => {
			const result = validateDispatchLogic(
				basePrescription,
				[makePastDispatch(21)],
				[amoxicilinLimit],
				[]
			);

			expect(result.can_dispatch).toBe(true);
			expect(result.items[0].monthly_used).toBe(21);
			expect(result.items[0].monthly_remaining).toBe(21);
		});

		it('FALLA — BLOQUEA: el paciente ya usó 30 cápsulas, receta pide 21 (30 + 21 = 51 > 42)', () => {
			const result = validateDispatchLogic(
				basePrescription,
				[makePastDispatch(30)],
				[amoxicilinLimit],
				[]
			);

			expect(result.can_dispatch).toBe(false);
			expect(result.items[0].can_dispatch).toBe(false);
			expect(result.items[0].block_reason).toContain('Límite mensual superado');
			expect(result.items[0].block_reason).toContain('30/42');
		});

		it('FALLA — BLOQUEA: el paciente ya consumió exactamente 42 cápsulas (límite agotado)', () => {
			const result = validateDispatchLogic(
				basePrescription,
				[makePastDispatch(42)],
				[amoxicilinLimit],
				[]
			);

			expect(result.can_dispatch).toBe(false);
			expect(result.items[0].monthly_remaining).toBe(0);
		});
	});

	describe('Caso 2: DispatchException activa permite saltarse el bloqueo', () => {
		const activeException: DispatchException = {
			id: 'exc-1',
			fk_patient_id: 'pat-test',
			fk_medication_id: 'med-1',
			authorized_quantity: 15, // permite 15 extras → límite efectivo = 42 + 15 = 57
			valid_from: '2020-01-01',
			valid_until: '2099-12-31',
			reason: 'Tratamiento crónico prolongado autorizado',
			authorized_by: 'Dr. Director',
			medication: AMOXICILINA_MED,
			created_at: new Date().toISOString()
		};

		it('PASA: con excepción activa, 30 + 21 = 51 ≤ 57 (límite efectivo), se permite', () => {
			const result = validateDispatchLogic(
				basePrescription,
				[makePastDispatch(30)],
				[amoxicilinLimit],
				[activeException]
			);

			expect(result.can_dispatch).toBe(true);
			expect(result.items[0].has_exception).toBe(true);
			expect(result.items[0].can_dispatch).toBe(true);
		});

		it('PASA: has_exception es true cuando hay excepción activa', () => {
			const result = validateDispatchLogic(basePrescription, [], [amoxicilinLimit], [activeException]);
			expect(result.items[0].has_exception).toBe(true);
		});

		it('FALLA — BLOQUEA: con excepción activa pero 50 + 21 = 71 > 57, sigue bloqueando', () => {
			const result = validateDispatchLogic(
				basePrescription,
				[makePastDispatch(50)],
				[amoxicilinLimit],
				[activeException]
			);

			expect(result.can_dispatch).toBe(false);
			expect(result.items[0].has_exception).toBe(true); // tiene excepción pero no alcanza
		});

		it('ignora excepciones expiradas', () => {
			const expiredException: DispatchException = {
				...activeException,
				id: 'exc-expired',
				valid_from: '2020-01-01',
				valid_until: '2020-12-31' // ya venció
			};

			const result = validateDispatchLogic(
				basePrescription,
				[makePastDispatch(30)],
				[amoxicilinLimit],
				[expiredException]
			);

			expect(result.can_dispatch).toBe(false); // sin excepción válida, sigue bloqueado
			expect(result.items[0].has_exception).toBe(false);
		});
	});

	describe('Caso 3: Bloqueo por stock insuficiente', () => {
		const lowStockPrescription: Prescription = {
			...basePrescription,
			id: 'presc-low',
			items: [
				{
					...basePrescription.items[0],
					medication: { ...AMOXICILINA_MED, current_stock: 5 },
					quantity_prescribed: 21
				}
			]
		};

		it('FALLA — BLOQUEA: stock disponible (5) < cantidad prescrita (21)', () => {
			const result = validateDispatchLogic(lowStockPrescription, [], [amoxicilinLimit], []);

			expect(result.can_dispatch).toBe(false);
			expect(result.items[0].can_dispatch).toBe(false);
			expect(result.items[0].block_reason).toContain('Stock insuficiente');
			expect(result.items[0].block_reason).toContain('disponible 5');
		});

		it('el stock insuficiente tiene prioridad sobre el límite mensual en block_reason', () => {
			const result = validateDispatchLogic(lowStockPrescription, [makePastDispatch(30)], [amoxicilinLimit], []);

			// Ambas condiciones fallan; el mensaje debe mencionar stock (chequeo de stock primero)
			expect(result.items[0].block_reason).toContain('Stock insuficiente');
		});
	});

	describe('Caso 4: Sin límite configurado', () => {
		it('PASA: medicamento sin límite configrado — solo verifica stock', () => {
			const result = validateDispatchLogic(basePrescription, [], [], []);

			expect(result.can_dispatch).toBe(true);
			expect(result.items[0].monthly_limit).toBeUndefined();
		});
	});
});

describe('Cálculo de daysLeft en lotes', () => {
	it('PASA: lote que vence en el futuro tiene daysLeft positivo', () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 90);
		const days = calcDaysLeft(futureDate.toISOString().slice(0, 10));

		expect(days).toBe(90);
	});

	it('PASA: lote que vence hoy tiene daysLeft = 0', () => {
		const days = calcDaysLeft(TODAY);
		expect(days).toBe(0);
	});

	it('PASA: lote que venció ayer tiene daysLeft negativo (-1)', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const days = calcDaysLeft(yesterday.toISOString().slice(0, 10));

		expect(days).toBe(-1);
	});

	it('PASA: lote LOT-2026-001 (Amoxicilina) vence 2027-06-30 — daysLeft > 0', () => {
		const days = calcDaysLeft('2027-06-30');
		expect(days).toBeGreaterThan(0);
	});

	it('PASA: lote LOT-2026-002 (Ibuprofeno) vence 2026-09-15 — verifica cálculo exacto', () => {
		const exp = new Date('2026-09-15');
		const now = new Date();
		exp.setHours(0, 0, 0, 0);
		now.setHours(0, 0, 0, 0);
		const expected = Math.ceil((exp.getTime() - now.getTime()) / 86_400_000);

		expect(calcDaysLeft('2026-09-15')).toBe(expected);
	});

	describe('Lote LOT-2026-002 (Ibuprofeno, vence 2026-09-15)', () => {
		const batchLot2026002: Partial<Batch> = {
			lot_number: 'LOT-2026-002',
			expiration_date: '2026-09-15',
			batch_status: 'available'
		};

		it('PASA: el lote tiene una fecha de expiración futura válida', () => {
			const days = calcDaysLeft(batchLot2026002.expiration_date!);
			// Según la fecha actual (2026-03-26), vence en ~173 días
			expect(days).toBeGreaterThan(0);
			expect(days).toBeLessThan(365);
		});
	});
});
