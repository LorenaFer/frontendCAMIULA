// ============================================================
// Datos mock — replican exactamente el contrato de la API real
// IDs son UUIDs (string) para coincidir con el backend.
// ============================================================

import type {
	Especialidad,
	DoctorConEspecialidad,
	DisponibilidadDoctor,
	Paciente,
	Cita,
	CitaConPaciente,
	HistoriaMedica,
	DoctorOption
} from '$shared/types/appointments.js';
import type {
	Supplier,
	Medication,
	Batch,
	StockItem,
	PurchaseOrder,
	Prescription,
	Dispatch,
	DispatchLimit,
	DispatchException
} from '$shared/types/inventory.js';

// ─── IDs estables para mock ─────────────────────────────────

const ESP_IDS = ['esp-001', 'esp-002', 'esp-003', 'esp-004', 'esp-005'];
const DOC_IDS = ['doc-001', 'doc-002', 'doc-003', 'doc-004', 'doc-005'];
const PAC_IDS = ['pac-001', 'pac-002', 'pac-003'];
const CITA_IDS = ['cit-001', 'cit-002', 'cit-003', 'cit-004', 'cit-005', 'cit-006'];

// ─── Especialidades ──────────────────────────────────────────

export const mockEspecialidades: Especialidad[] = [
	{ id: ESP_IDS[0], nombre: 'Medicina General', activo: true },
	{ id: ESP_IDS[1], nombre: 'Odontología', activo: true },
	{ id: ESP_IDS[2], nombre: 'Ginecología', activo: true },
	{ id: ESP_IDS[3], nombre: 'Pediatría', activo: true },
	{ id: ESP_IDS[4], nombre: 'Oftalmología', activo: true }
];

// ─── Doctores ────────────────────────────────────────────────

export const mockDoctores: DoctorConEspecialidad[] = [
	{
		id: DOC_IDS[0],
		nombre: 'Carlos',
		apellido: 'Mendoza',
		especialidad_id: ESP_IDS[0],
		activo: true,
		especialidad: mockEspecialidades[0]
	},
	{
		id: DOC_IDS[1],
		nombre: 'María',
		apellido: 'Rodríguez',
		especialidad_id: ESP_IDS[0],
		activo: true,
		especialidad: mockEspecialidades[0]
	},
	{
		id: DOC_IDS[2],
		nombre: 'José',
		apellido: 'Pérez',
		especialidad_id: ESP_IDS[1],
		activo: true,
		especialidad: mockEspecialidades[1]
	},
	{
		id: DOC_IDS[3],
		nombre: 'Ana',
		apellido: 'García',
		especialidad_id: ESP_IDS[2],
		activo: true,
		especialidad: mockEspecialidades[2]
	},
	{
		id: DOC_IDS[4],
		nombre: 'Luis',
		apellido: 'Torres',
		especialidad_id: ESP_IDS[3],
		activo: true,
		especialidad: mockEspecialidades[3]
	}
];

export const mockDoctorOptions: DoctorOption[] = mockDoctores.map((d) => ({
	id: d.id,
	nombre_completo: `${d.nombre} ${d.apellido}`,
	especialidad: d.especialidad.nombre,
	especialidad_id: d.especialidad_id,
	dias_trabajo: [1, 2, 3, 4, 5] // L-V por defecto en mock
}));

// ─── Disponibilidad ──────────────────────────────────────────

// Cada doctor trabaja L-V 8:00-12:00 y 14:00-17:00, slots de 30 min
function buildDisponibilidad(doctorId: string): DisponibilidadDoctor[] {
	const result: DisponibilidadDoctor[] = [];
	let seq = 0;
	for (const dow of [1, 2, 3, 4, 5] as const) {
		result.push(
			{ id: `disp-${doctorId}-${seq++}`, doctor_id: doctorId, day_of_week: dow, hora_inicio: '08:00', hora_fin: '12:00', duracion_slot: 30 },
			{ id: `disp-${doctorId}-${seq++}`, doctor_id: doctorId, day_of_week: dow, hora_inicio: '14:00', hora_fin: '17:00', duracion_slot: 30 }
		);
	}
	return result;
}

export const mockDisponibilidad: DisponibilidadDoctor[] = [
	...buildDisponibilidad(DOC_IDS[0]),
	...buildDisponibilidad(DOC_IDS[1]),
	...buildDisponibilidad(DOC_IDS[2]),
	...buildDisponibilidad(DOC_IDS[3]),
	...buildDisponibilidad(DOC_IDS[4])
];

// ─── Pacientes ───────────────────────────────────────────────

export const mockPacientes: Paciente[] = [
	{
		id: PAC_IDS[0],
		nhm: 1001,
		cedula: 'V-12345678',
		nombre: 'Pedro',
		apellido: 'González',
		sexo: 'M',
		fecha_nacimiento: '1985-06-15',
		lugar_nacimiento: 'Mérida',
		edad: 40,
		estado_civil: 'casado',
		procedencia: 'Mérida',
		direccion_habitacion: 'Av. Las Américas, Mérida',
		telefono: '0412-1234567',
		profesion: 'Ingeniero',
		ocupacion_actual: 'Docente',
		relacion_univ: 'empleado',
		datos_medicos: { tipo_sangre: 'O+', alergias: ['Penicilina'], numero_contacto: '0412-1234567' },
		contacto_emergencia: { nombre: 'María González', parentesco: 'Esposa', telefono: '0414-1112233' },
		es_nuevo: false,
		created_at: '2024-01-10T10:00:00Z'
	},
	{
		id: PAC_IDS[1],
		nhm: 1002,
		cedula: 'V-23456789',
		nombre: 'Laura',
		apellido: 'Martínez',
		sexo: 'F',
		fecha_nacimiento: '2000-03-22',
		lugar_nacimiento: 'Barinas',
		edad: 25,
		estado_civil: 'soltero',
		procedencia: 'Barinas',
		direccion_habitacion: 'Residencias ULA, Mérida',
		telefono: '0414-9876543',
		profesion: 'Estudiante',
		ocupacion_actual: 'Estudiante de Medicina',
		relacion_univ: 'estudiante',
		datos_medicos: { tipo_sangre: 'A+', alergias: [], numero_contacto: '0414-9876543' },
		es_nuevo: false,
		created_at: '2024-02-15T09:00:00Z'
	},
	{
		id: PAC_IDS[2],
		nhm: 1003,
		cedula: 'V-34567890',
		nombre: 'Roberto',
		apellido: 'Jiménez',
		sexo: 'M',
		fecha_nacimiento: '1970-11-08',
		lugar_nacimiento: 'Trujillo',
		edad: 55,
		estado_civil: 'divorciado',
		procedencia: 'Trujillo',
		direccion_habitacion: 'Urb. La Hacienda, Mérida',
		telefono: '0416-5554433',
		profesion: 'Abogado',
		ocupacion_actual: 'Profesor titular',
		relacion_univ: 'profesor',
		datos_medicos: { tipo_sangre: 'B-', alergias: ['Aspirina'], numero_contacto: '0416-5554433' },
		contacto_emergencia: { nombre: 'Ana Jiménez', parentesco: 'Hija', telefono: '0412-9998877' },
		es_nuevo: true,
		created_at: '2025-03-01T08:30:00Z'
	}
];

// ─── Citas ───────────────────────────────────────────────────

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);

function daysFrom(n: number): string {
	const d = new Date(today);
	d.setDate(d.getDate() + n);
	return fmt(d);
}

export const mockCitas: Cita[] = [
	{
		id: CITA_IDS[4],
		paciente_id: PAC_IDS[1],
		doctor_id: DOC_IDS[0],
		especialidad_id: ESP_IDS[0],
		fecha: fmt(today),
		hora_inicio: '08:00',
		hora_fin: '08:30',
		duracion_min: 30,
		es_primera_vez: false,
		estado: 'pendiente',
		motivo_consulta: 'Chequeo general',
		created_at: new Date().toISOString(),
		created_by: 'portal_publico'
	},
	{
		id: CITA_IDS[5],
		paciente_id: PAC_IDS[2],
		doctor_id: DOC_IDS[0],
		especialidad_id: ESP_IDS[0],
		fecha: fmt(today),
		hora_inicio: '08:30',
		hora_fin: '09:30',
		duracion_min: 60,
		es_primera_vez: true,
		estado: 'confirmada',
		motivo_consulta: 'Primera consulta — dolor crónico de espalda',
		created_at: new Date().toISOString(),
		created_by: 'portal_publico'
	},
	{
		id: CITA_IDS[0],
		paciente_id: PAC_IDS[0],
		doctor_id: DOC_IDS[0],
		especialidad_id: ESP_IDS[0],
		fecha: daysFrom(3),
		hora_inicio: '09:00',
		hora_fin: '09:30',
		duracion_min: 30,
		es_primera_vez: false,
		estado: 'pendiente',
		motivo_consulta: 'Control rutinario',
		created_at: new Date().toISOString(),
		created_by: 'portal_publico'
	},
	{
		id: CITA_IDS[1],
		paciente_id: PAC_IDS[1],
		doctor_id: DOC_IDS[0],
		especialidad_id: ESP_IDS[0],
		fecha: daysFrom(3),
		hora_inicio: '09:30',
		hora_fin: '10:00',
		duracion_min: 30,
		es_primera_vez: false,
		estado: 'confirmada',
		motivo_consulta: 'Dolor de cabeza',
		created_at: new Date().toISOString(),
		created_by: 'portal_publico'
	},
	{
		id: CITA_IDS[2],
		paciente_id: PAC_IDS[2],
		doctor_id: DOC_IDS[1],
		especialidad_id: ESP_IDS[0],
		fecha: fmt(today),
		hora_inicio: '10:00',
		hora_fin: '11:00',
		duracion_min: 60,
		es_primera_vez: true,
		estado: 'pendiente',
		motivo_consulta: 'Primera evaluación',
		created_at: new Date().toISOString(),
		created_by: 'portal_publico'
	},
	{
		id: CITA_IDS[3],
		paciente_id: PAC_IDS[0],
		doctor_id: DOC_IDS[2],
		especialidad_id: ESP_IDS[1],
		fecha: fmt(today),
		hora_inicio: '08:00',
		hora_fin: '08:30',
		duracion_min: 30,
		es_primera_vez: false,
		estado: 'atendida',
		motivo_consulta: 'Limpieza dental',
		created_at: new Date().toISOString(),
		created_by: 'analista_01'
	}
];

export const mockCitasConPaciente: CitaConPaciente[] = mockCitas.map((c) => {
	const paciente = mockPacientes.find((p) => p.id === c.paciente_id)!;
	const doctor = mockDoctores.find((d) => d.id === c.doctor_id)!;
	return { ...c, paciente, doctor };
});

// ─── Historias Médicas ───────────────────────────────────────

export const mockHistorias: HistoriaMedica[] = [
	{
		id: 'hist-001',
		cita_id: CITA_IDS[3],
		paciente_id: PAC_IDS[0],
		doctor_id: DOC_IDS[2],
		evaluacion: {
			motivo_consulta: 'Limpieza dental de rutina',
			anamnesis: 'Paciente sin antecedentes relevantes',
			examen_fisico: { ta: '120/80', fc: '72', fr: '16', temp: '36.5', peso: '75', talla: '1.75' },
			diagnostico: { cie10: 'Z29.8', descripcion: 'Control odontológico preventivo' },
			tratamiento: 'Limpieza supragingival',
			indicaciones: 'Cepillado 3 veces al día, hilo dental'
		},
		preparado: true,
		preparado_at: new Date().toISOString(),
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	}
];

// ─── Helpers ─────────────────────────────────────────────────

export function getNextNHM(): number {
	return Math.max(...mockPacientes.map((p) => p.nhm)) + 1;
}

// ============================================================
// Mock Inventario
// ============================================================

// ─── Proveedores ─────────────────────────────────────────────

export const mockSuppliers: Supplier[] = [
	{
		id: 'sup-1',
		name: 'Distribuidora Médica Caracas C.A.',
		rif: 'J-12345678-9',
		phone: '0212-555-1234',
		email: 'ventas@dimedica.com',
		contact_name: 'Juan López',
		payment_terms: '30 días netos',
		supplier_status: 'active',
		created_at: '2026-01-10T08:00:00Z'
	},
	{
		id: 'sup-2',
		name: 'Laboratorios Roche Venezuela',
		rif: 'J-98765432-1',
		phone: '0212-555-5678',
		email: 'pedidos@roche.com.ve',
		contact_name: 'Ana García',
		payment_terms: '60 días netos',
		supplier_status: 'active',
		created_at: '2026-01-15T08:00:00Z'
	}
];

// ─── Medicamentos ─────────────────────────────────────────────

export const mockMedications: Medication[] = [
	{
		id: 'med-1',
		code: 'MED-001',
		generic_name: 'Amoxicilina',
		commercial_name: 'Amoxil',
		pharmaceutical_form: 'Cápsula',
		concentration: '500mg',
		unit_measure: 'cápsulas',
		therapeutic_class: 'Antibiótico',
		controlled_substance: false,
		requires_refrigeration: false,
		medication_status: 'active',
		current_stock: 350,
		created_at: '2026-01-01T08:00:00Z'
	},
	{
		id: 'med-2',
		code: 'MED-002',
		generic_name: 'Ibuprofeno',
		commercial_name: 'Advil',
		pharmaceutical_form: 'Tableta',
		concentration: '400mg',
		unit_measure: 'tabletas',
		therapeutic_class: 'Antiinflamatorio',
		controlled_substance: false,
		requires_refrigeration: false,
		medication_status: 'active',
		current_stock: 120,
		created_at: '2026-01-01T08:00:00Z'
	},
	{
		id: 'med-3',
		code: 'MED-003',
		generic_name: 'Metformina',
		commercial_name: 'Glucophage',
		pharmaceutical_form: 'Tableta',
		concentration: '850mg',
		unit_measure: 'tabletas',
		therapeutic_class: 'Antidiabético',
		controlled_substance: false,
		requires_refrigeration: false,
		medication_status: 'active',
		current_stock: 8,
		created_at: '2026-01-01T08:00:00Z'
	}
];

// ─── Lotes ────────────────────────────────────────────────────

export const mockBatches: Batch[] = [
	{
		id: 'bat-1',
		fk_medication_id: 'med-1',
		medication: {
			id: 'med-1',
			code: 'MED-001',
			generic_name: 'Amoxicilina',
			pharmaceutical_form: 'Cápsula',
			unit_measure: 'cápsulas',
			current_stock: 350
		},
		fk_supplier_id: 'sup-1',
		supplier_name: 'Distribuidora Médica Caracas C.A.',
		lot_number: 'LOT-2026-001',
		expiration_date: '2027-06-30',
		quantity_received: 500,
		quantity_available: 350,
		unit_cost: 0.85,
		batch_status: 'available',
		received_at: '2026-01-20T10:00:00Z'
	},
	{
		id: 'bat-2',
		fk_medication_id: 'med-2',
		medication: {
			id: 'med-2',
			code: 'MED-002',
			generic_name: 'Ibuprofeno',
			pharmaceutical_form: 'Tableta',
			unit_measure: 'tabletas',
			current_stock: 120
		},
		fk_supplier_id: 'sup-1',
		supplier_name: 'Distribuidora Médica Caracas C.A.',
		lot_number: 'LOT-2026-002',
		expiration_date: '2026-09-15',
		quantity_received: 200,
		quantity_available: 120,
		unit_cost: 0.45,
		batch_status: 'available',
		received_at: '2026-01-22T10:00:00Z'
	}
];

// ─── Stock consolidado ────────────────────────────────────────

export const mockStockItems: StockItem[] = [
	{
		medication_id: 'med-1',
		code: 'MED-001',
		generic_name: 'Amoxicilina',
		pharmaceutical_form: 'Cápsula',
		unit_measure: 'cápsulas',
		total_available: 350,
		batch_count: 1,
		nearest_expiration: '2027-06-30',
		days_to_expiration: 462,
		stock_alert: 'ok'
	},
	{
		medication_id: 'med-2',
		code: 'MED-002',
		generic_name: 'Ibuprofeno',
		pharmaceutical_form: 'Tableta',
		unit_measure: 'tabletas',
		total_available: 120,
		batch_count: 1,
		nearest_expiration: '2026-09-15',
		days_to_expiration: 174,
		stock_alert: 'low'
	},
	{
		medication_id: 'med-3',
		code: 'MED-003',
		generic_name: 'Metformina',
		pharmaceutical_form: 'Tableta',
		unit_measure: 'tabletas',
		total_available: 8,
		batch_count: 1,
		nearest_expiration: '2027-03-01',
		days_to_expiration: 341,
		stock_alert: 'critical'
	}
];

// ─── Órdenes de Compra ────────────────────────────────────────

export const mockPurchaseOrders: PurchaseOrder[] = [
	{
		id: 'po-1',
		order_number: 'OC-2026-001',
		fk_supplier_id: 'sup-1',
		supplier: { id: 'sup-1', name: 'Distribuidora Médica Caracas C.A.', rif: 'J-12345678-9' },
		order_date: '2026-03-01',
		expected_date: '2026-03-15',
		notes: 'Pedido urgente de antibióticos',
		order_status: 'received',
		items: [],
		total_amount: 850.0,
		created_at: '2026-03-01T09:00:00Z'
	}
];

// ─── Prescripciones ───────────────────────────────────────────

export const mockPrescriptions: Prescription[] = [
	{
		id: 'presc-1',
		prescription_number: 'RX-2026-001',
		fk_appointment_id: '1',
		fk_patient_id: '1',
		fk_doctor_id: 'doc-1',
		patient_name: 'Pedro González',
		doctor_name: 'Dr. Carlos Mendoza',
		prescription_date: '2026-03-20',
		prescription_status: 'issued',
		items: [
			{
				id: 'pi-1',
				fk_medication_id: 'med-1',
				medication: {
					id: 'med-1',
					code: 'MED-001',
					generic_name: 'Amoxicilina',
					pharmaceutical_form: 'Cápsula',
					unit_measure: 'cápsulas',
					current_stock: 350
				},
				quantity_prescribed: 21,
				dosage_instructions: '1 cápsula cada 8 horas',
				duration_days: 7
			}
		],
		created_at: '2026-03-20T10:00:00Z'
	}
];

// ─── Despachos ────────────────────────────────────────────────

export const mockDispatches: Dispatch[] = [];

// ─── Límites de Despacho ──────────────────────────────────────

export const mockDispatchLimits: DispatchLimit[] = [
	{
		id: 'lim-1',
		fk_medication_id: 'med-1',
		medication: {
			id: 'med-1',
			code: 'MED-001',
			generic_name: 'Amoxicilina',
			pharmaceutical_form: 'Cápsula',
			unit_measure: 'cápsulas',
			current_stock: 350
		},
		monthly_max_quantity: 42,
		applies_to: 'all',
		active: true,
		created_at: '2026-01-01T08:00:00Z'
	}
];

// ─── Excepciones de Despacho ──────────────────────────────────

export const mockDispatchExceptions: DispatchException[] = [];
