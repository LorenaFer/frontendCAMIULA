// ============================================================
// Tipos del Módulo de Inventario
// Contrato compartido entre servicios server y componentes UI.
// ============================================================

// ─── Enums / Union Types ─────────────────────────────────────

export type SupplierStatus = 'active' | 'inactive';
export type MedicationStatus = 'active' | 'discontinued' | 'pending';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
export type BatchStatus = 'available' | 'depleted' | 'expired' | 'quarantine';
export type PrescriptionStatus = 'draft' | 'issued' | 'dispensed' | 'cancelled';
export type DispatchStatus = 'pending' | 'completed' | 'cancelled';
export type StockAlert = 'ok' | 'low' | 'critical' | 'expired';
export type LimitAppliesTo = 'all' | 'student' | 'employee' | 'professor';

// ─── Proveedores ─────────────────────────────────────────────

export interface Supplier {
	id: string;
	name: string;
	rif: string;
	phone?: string;
	email?: string;
	contact_name?: string;
	payment_terms?: string;
	supplier_status: SupplierStatus;
	created_at: string;
}

export interface SupplierOption {
	id: string;
	name: string;
	rif: string;
}

// ─── Medicamentos ─────────────────────────────────────────────

export interface Medication {
	id: string;
	code: string;
	generic_name: string;
	commercial_name?: string;
	pharmaceutical_form: string;
	concentration?: string;
	unit_measure: string;
	therapeutic_class?: string;
	controlled_substance: boolean;
	requires_refrigeration: boolean;
	medication_status: MedicationStatus;
	/** Calculado en query — stock total disponible */
	current_stock: number;
	created_at: string;
}

export interface MedicationOption {
	id: string;
	code: string;
	generic_name: string;
	pharmaceutical_form: string;
	unit_measure: string;
	current_stock: number;
}

// ─── Órdenes de Compra ────────────────────────────────────────

export interface PurchaseOrderItem {
	id: string;
	medication_id: string;
	medication: MedicationOption;
	quantity_ordered: number;
	quantity_received: number;
	unit_cost: number;
}

export interface PurchaseOrder {
	id: string;
	order_number: string;
	fk_supplier_id: string;
	supplier: SupplierOption;
	order_date: string;
	expected_date?: string;
	notes?: string;
	order_status: PurchaseOrderStatus;
	items: PurchaseOrderItem[];
	/** Calculado en frontend: suma de items */
	total_amount: number;
	created_at: string;
	created_by?: string;
	sent_at?: string;
	sent_by?: string;
	received_at?: string;
	received_by?: string;
}

// ─── Lotes ────────────────────────────────────────────────────

export interface Batch {
	id: string;
	fk_medication_id: string;
	medication: MedicationOption;
	fk_supplier_id?: string;
	supplier_name?: string;
	lot_number: string;
	expiration_date: string;
	quantity_received: number;
	quantity_available: number;
	unit_cost?: number;
	batch_status: BatchStatus;
	received_at: string;
}

// ─── Stock (vista consolidada por medicamento) ────────────────

export interface StockItem {
	medication_id: string;
	code: string;
	generic_name: string;
	pharmaceutical_form: string;
	unit_measure: string;
	total_available: number;
	batch_count: number;
	/** ISO date del lote que vence antes */
	nearest_expiration?: string;
	days_to_expiration?: number;
	stock_alert: StockAlert;
}

// ─── Recetas / Prescripciones ─────────────────────────────────

export interface PrescriptionItem {
	id: string;
	fk_medication_id: string;
	medication: MedicationOption;
	quantity_prescribed: number;
	dosage_instructions?: string;
	duration_days?: number;
}

export interface Prescription {
	id: string;
	prescription_number: string;
	fk_appointment_id: string;
	fk_patient_id: string;
	fk_doctor_id: string;
	patient_name?: string;
	doctor_name?: string;
	prescription_date: string;
	notes?: string;
	prescription_status: PrescriptionStatus;
	items: PrescriptionItem[];
	created_at: string;
}

// ─── Despachos ────────────────────────────────────────────────

export interface DispatchItem {
	id: string;
	fk_batch_id: string;
	lot_number: string;
	expiration_date: string;
	fk_medication_id: string;
	medication: MedicationOption;
	quantity_dispatched: number;
}

export interface Dispatch {
	id: string;
	fk_prescription_id: string;
	prescription_number: string;
	fk_patient_id: string;
	patient_name?: string;
	fk_pharmacist_id: string;
	pharmacist_name?: string;
	dispatch_date: string;
	notes?: string;
	dispatch_status: DispatchStatus;
	items: DispatchItem[];
	created_at: string;
}

// ─── Validación previa al despacho ───────────────────────────

export interface DispatchValidationItem {
	medication_id: string;
	generic_name: string;
	quantity_prescribed: number;
	quantity_available: number;
	monthly_limit?: number;
	monthly_used: number;
	monthly_remaining: number;
	has_exception: boolean;
	can_dispatch: boolean;
	block_reason?: string;
}

export interface DispatchValidation {
	can_dispatch: boolean;
	prescription_id: string;
	patient_id: string;
	items: DispatchValidationItem[];
}

// ─── Límites de Despacho ──────────────────────────────────────

export interface DispatchLimit {
	id: string;
	fk_medication_id: string;
	medication: MedicationOption;
	monthly_max_quantity: number;
	applies_to: LimitAppliesTo;
	active: boolean;
	created_at: string;
}

export interface DispatchException {
	id: string;
	fk_patient_id: string;
	patient_name?: string;
	fk_medication_id: string;
	medication: MedicationOption;
	authorized_quantity: number;
	valid_from: string;
	valid_until: string;
	reason: string;
	authorized_by?: string;
	created_at: string;
}

// ─── Reportes ─────────────────────────────────────────────────

export interface StockReport {
	generated_at: string;
	items: StockItem[];
	total_medications: number;
	critical_count: number;
	expired_count: number;
}

export interface ConsumptionItem {
	medication_id: string;
	generic_name: string;
	total_dispatched: number;
	dispatch_count: number;
	patient_count: number;
}

export interface ConsumptionReport {
	/** Formato YYYY-MM */
	period: string;
	items: ConsumptionItem[];
}

export interface ExpirationReport {
	generated_at: string;
	threshold_days: number;
	batches: Batch[];
}

// ─── Filtros ──────────────────────────────────────────────────

export interface MedicationFilters {
	search?: string;
	status?: MedicationStatus;
	therapeutic_class?: string;
	page?: number;
	pageSize?: number;
}

export interface BatchFilters {
	medication_id?: string;
	status?: BatchStatus;
	/** ISO date — lotes que vencen antes de esta fecha */
	expiring_before?: string;
	page?: number;
	pageSize?: number;
}

export interface DispatchFilters {
	patient_id?: string;
	prescription_number?: string;
	status?: DispatchStatus;
	date_from?: string;
	date_to?: string;
	page?: number;
	pageSize?: number;
}

// ─── Inputs de creación ───────────────────────────────────────

export interface CreateMedicationInput {
	code: string;
	generic_name: string;
	commercial_name?: string;
	pharmaceutical_form: string;
	concentration?: string;
	unit_measure: string;
	therapeutic_class?: string;
	controlled_substance: boolean;
	requires_refrigeration: boolean;
}

export interface CreateSupplierInput {
	name: string;
	rif: string;
	phone?: string;
	email?: string;
	contact_name?: string;
	payment_terms?: string;
}

export interface CreatePurchaseOrderInput {
	fk_supplier_id: string;
	expected_date?: string;
	notes?: string;
	items: Array<{
		medication_id: string;
		quantity_ordered: number;
		unit_cost: number;
	}>;
}

export interface ReceivePurchaseOrderInput {
	order_id: string;
	items: Array<{
		purchase_order_item_id: string;
		quantity_received: number;
		lot_number: string;
		expiration_date: string;
		unit_cost?: number;
	}>;
}

export interface CreatePrescriptionInput {
	fk_appointment_id: string;
	fk_patient_id: string;
	notes?: string;
	items: Array<{
		medication_id: string;
		quantity_prescribed: number;
		dosage_instructions?: string;
		duration_days?: number;
	}>;
}

export interface ExecuteDispatchInput {
	prescription_id: string;
	pharmacist_id: string;
	notes?: string;
}

export interface CreateDispatchLimitInput {
	fk_medication_id: string;
	monthly_max_quantity: number;
	applies_to: LimitAppliesTo;
}

export interface CreateDispatchExceptionInput {
	fk_patient_id: string;
	fk_medication_id: string;
	authorized_quantity: number;
	valid_from: string;
	valid_until: string;
	reason: string;
}

// ─── Prescription Item Draft (UI) ─────────────────────────────

/** Draft de ítem de receta antes de serializar al servidor */
export interface PrescriptionItemDraft {
	medication_id: string;
	medication_name: string;
	pharmaceutical_form: string;
	unit_measure: string;
	quantity_prescribed: number;
	dosage_instructions: string;
	duration_days: number;
}

// ─── Pagination (módulo inventario) ───────────────────────────

/** Respuesta paginada del módulo de inventario (mock y API) */
export interface InventoryPaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	hasNext: boolean;
}
