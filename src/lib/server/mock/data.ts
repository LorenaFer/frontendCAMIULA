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
		preparado_at: '2026-03-15T10:00:00Z',
		created_at: '2026-03-15T10:00:00Z',
		updated_at: '2026-03-15T10:00:00Z'
	},
	// Pedro González — consulta previa de medicina general
	{
		id: 'hist-002',
		cita_id: 'cit-prev-001',
		paciente_id: PAC_IDS[0],
		doctor_id: DOC_IDS[0],
		evaluacion: {
			motivo_consulta: 'Dolor lumbar crónico',
			anamnesis: 'Paciente refiere dolor lumbar de 3 meses. Sin irradiación. Mejora con reposo.',
			examen_fisico: { ta: '130/85', fc: '78', fr: '18', temp: '36.7', peso: '82', talla: '1.72' },
			diagnostico: { cie10: 'M54.5', descripcion: 'Lumbago no especificado' },
			tratamiento: 'Ibuprofeno 400mg c/8h por 5 días + relajante muscular',
			indicaciones: 'Evitar cargar peso. Aplicar calor local. Control en 2 semanas.'
		},
		preparado: true,
		preparado_at: '2026-02-10T09:30:00Z',
		created_at: '2026-02-10T09:30:00Z',
		updated_at: '2026-02-10T09:30:00Z'
	},
	// Laura Martínez — historial de consultas
	{
		id: 'hist-003',
		cita_id: 'cit-prev-002',
		paciente_id: PAC_IDS[1],
		doctor_id: DOC_IDS[0],
		evaluacion: {
			motivo_consulta: 'Control de hipertensión',
			anamnesis: 'Paciente hipertensa en tratamiento. T.A. controlada con Losartán 50mg.',
			examen_fisico: { ta: '140/90', fc: '76', fr: '16', temp: '36.4', peso: '68', talla: '1.60' },
			diagnostico: { cie10: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
			tratamiento: 'Continuar Losartán 50mg/día',
			indicaciones: 'Dieta baja en sodio. Ejercicio aeróbico 30 min/día. Control mensual.'
		},
		preparado: true,
		preparado_at: '2026-03-01T11:00:00Z',
		created_at: '2026-03-01T11:00:00Z',
		updated_at: '2026-03-01T11:00:00Z'
	},
	{
		id: 'hist-004',
		cita_id: 'cit-prev-003',
		paciente_id: PAC_IDS[1],
		doctor_id: DOC_IDS[1],
		evaluacion: {
			motivo_consulta: 'Cefalea recurrente',
			anamnesis: 'Cefalea frontal pulsátil, 2-3 veces por semana. Empeora con estrés.',
			examen_fisico: { ta: '135/88', fc: '80', fr: '17', temp: '36.5', peso: '68', talla: '1.60' },
			diagnostico: { cie10: 'G43.9', descripcion: 'Migraña sin especificar' },
			tratamiento: 'Paracetamol 500mg PRN + Amitriptilina 10mg/noche',
			indicaciones: 'Llevar diario de cefaleas. Evitar factores desencadenantes.'
		},
		preparado: true,
		preparado_at: '2026-01-15T14:00:00Z',
		created_at: '2026-01-15T14:00:00Z',
		updated_at: '2026-01-15T14:00:00Z'
	},
	// Roberto Jiménez — historial (primera vez actual, pero tiene consultas en otro servicio)
	{
		id: 'hist-005',
		cita_id: 'cit-prev-004',
		paciente_id: PAC_IDS[2],
		doctor_id: DOC_IDS[1],
		evaluacion: {
			motivo_consulta: 'Dolor de espalda irradiado a miembros inferiores',
			anamnesis: 'Dolor lumbar de 6 meses con irradiación a pierna derecha. Parestesias en pie.',
			examen_fisico: { ta: '125/80', fc: '70', fr: '16', temp: '36.6', peso: '90', talla: '1.78' },
			diagnostico: { cie10: 'M51.1', descripcion: 'Trastorno de disco lumbar con radiculopatía' },
			tratamiento: 'Pregabalina 75mg c/12h + fisioterapia',
			indicaciones: 'Reposo relativo. Fisioterapia 3 veces/semana. RMN lumbar. Control en 1 mes.'
		},
		preparado: true,
		preparado_at: '2026-02-20T10:00:00Z',
		created_at: '2026-02-20T10:00:00Z',
		updated_at: '2026-02-20T10:00:00Z'
	},
	{
		id: 'hist-006',
		cita_id: 'cit-prev-005',
		paciente_id: PAC_IDS[2],
		doctor_id: DOC_IDS[2],
		evaluacion: {
			motivo_consulta: 'Evaluación odontológica',
			anamnesis: 'Dolor molar inferior derecho. Caries visible en pieza 46.',
			examen_fisico: { ta: '120/80', fc: '68', fr: '15', temp: '36.5', peso: '90', talla: '1.78' },
			diagnostico: { cie10: 'K02.1', descripcion: 'Caries de la dentina' },
			tratamiento: 'Obturación pieza 46',
			indicaciones: 'Higiene oral reforzada. Control en 6 meses.'
		},
		preparado: true,
		preparado_at: '2025-12-05T09:00:00Z',
		created_at: '2025-12-05T09:00:00Z',
		updated_at: '2025-12-05T09:00:00Z'
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
		items: [
			{ id: 'poi-1', medication_id: 'med-1', medication: { id: 'med-1', code: 'MED-001', generic_name: 'Amoxicilina', pharmaceutical_form: 'Cápsula', unit_measure: 'cápsulas', current_stock: 350 }, quantity_ordered: 500, quantity_received: 500, unit_cost: 0.85 },
			{ id: 'poi-2', medication_id: 'med-2', medication: { id: 'med-2', code: 'MED-002', generic_name: 'Ibuprofeno', pharmaceutical_form: 'Tableta', unit_measure: 'tabletas', current_stock: 200 }, quantity_ordered: 1000, quantity_received: 1000, unit_cost: 0.35 }
		],
		total_amount: 775.0,
		created_at: '2026-03-01T09:00:00Z',
		created_by: 'Admin Principal',
		sent_at: '2026-03-02T10:30:00Z',
		sent_by: 'Admin Principal',
		received_at: '2026-03-14T14:20:00Z',
		received_by: 'Farm. María López'
	},
	{
		id: 'po-2',
		order_number: 'OC-2026-002',
		fk_supplier_id: 'sup-2',
		supplier: { id: 'sup-2', name: 'Laboratorios Roche Venezuela', rif: 'J-98765432-1' },
		order_date: '2026-03-20',
		expected_date: '2026-04-05',
		notes: '',
		order_status: 'sent',
		items: [
			{ id: 'poi-3', medication_id: 'med-3', medication: { id: 'med-3', code: 'MED-003', generic_name: 'Losartán', pharmaceutical_form: 'Tableta', unit_measure: 'tabletas', current_stock: 80 }, quantity_ordered: 300, quantity_received: 0, unit_cost: 1.20 },
			{ id: 'poi-4', medication_id: 'med-4', medication: { id: 'med-4', code: 'MED-004', generic_name: 'Metformina', pharmaceutical_form: 'Tableta', unit_measure: 'tabletas', current_stock: 45 }, quantity_ordered: 500, quantity_received: 0, unit_cost: 0.60 },
			{ id: 'poi-5', medication_id: 'med-1', medication: { id: 'med-1', code: 'MED-001', generic_name: 'Amoxicilina', pharmaceutical_form: 'Cápsula', unit_measure: 'cápsulas', current_stock: 350 }, quantity_ordered: 200, quantity_received: 0, unit_cost: 0.90 }
		],
		total_amount: 840.0,
		created_at: '2026-03-20T11:00:00Z',
		created_by: 'Admin Principal',
		sent_at: '2026-03-21T08:15:00Z',
		sent_by: 'Admin Principal'
	},
	{
		id: 'po-3',
		order_number: 'OC-2026-003',
		fk_supplier_id: 'sup-1',
		supplier: { id: 'sup-1', name: 'Distribuidora Médica Caracas C.A.', rif: 'J-12345678-9' },
		order_date: '2026-03-28',
		expected_date: '2026-04-10',
		order_status: 'draft',
		items: [
			{ id: 'poi-6', medication_id: 'med-5', medication: { id: 'med-5', code: 'MED-005', generic_name: 'Omeprazol', pharmaceutical_form: 'Cápsula', unit_measure: 'cápsulas', current_stock: 120 }, quantity_ordered: 400, quantity_received: 0, unit_cost: 0.45 }
		],
		total_amount: 180.0,
		created_at: '2026-03-28T16:00:00Z',
		created_by: 'Admin Principal'
	}
];

// ─── Prescripciones ───────────────────────────────────────────

export const mockPrescriptions: Prescription[] = [
	{
		id: 'presc-1',
		prescription_number: 'RX-2026-001',
		fk_appointment_id: CITA_IDS[2],
		fk_patient_id: PAC_IDS[0],
		fk_doctor_id: DOC_IDS[0],
		patient_name: 'Pedro González',
		doctor_name: 'Dr. Carlos Mendoza',
		prescription_date: '2026-03-20',
		prescription_status: 'dispensed',
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
	},
	{
		id: 'presc-2',
		prescription_number: 'RX-2026-002',
		fk_appointment_id: CITA_IDS[4],
		fk_patient_id: PAC_IDS[0],
		fk_doctor_id: DOC_IDS[0],
		patient_name: 'Pedro González',
		doctor_name: 'Dr. Carlos Mendoza',
		prescription_date: '2026-03-28',
		prescription_status: 'issued',
		items: [
			{
				id: 'pi-2',
				fk_medication_id: 'med-2',
				medication: { id: 'med-2', code: 'MED-002', generic_name: 'Ibuprofeno', pharmaceutical_form: 'Tableta', unit_measure: 'tabletas', current_stock: 200 },
				quantity_prescribed: 30,
				dosage_instructions: '1 tableta cada 8 horas con alimentos',
				duration_days: 10
			},
			{
				id: 'pi-3',
				fk_medication_id: 'med-5',
				medication: { id: 'med-5', code: 'MED-005', generic_name: 'Omeprazol', pharmaceutical_form: 'Cápsula', unit_measure: 'cápsulas', current_stock: 120 },
				quantity_prescribed: 14,
				dosage_instructions: '1 cápsula en ayunas',
				duration_days: 14
			}
		],
		created_at: '2026-03-28T09:00:00Z'
	},
	{
		id: 'presc-3',
		prescription_number: 'RX-2026-003',
		fk_appointment_id: CITA_IDS[3],
		fk_patient_id: PAC_IDS[1],
		fk_doctor_id: DOC_IDS[2],
		patient_name: 'Laura Martínez',
		doctor_name: 'Dr. Ana Rodríguez',
		prescription_date: '2026-03-25',
		prescription_status: 'issued',
		items: [
			{
				id: 'pi-4',
				fk_medication_id: 'med-4',
				medication: { id: 'med-4', code: 'MED-004', generic_name: 'Losartán', pharmaceutical_form: 'Tableta', unit_measure: 'tabletas', current_stock: 180 },
				quantity_prescribed: 30,
				dosage_instructions: '1 tableta cada 24 horas en la mañana',
				duration_days: 30
			}
		],
		created_at: '2026-03-25T14:00:00Z'
	}
];

// ─── Despachos ────────────────────────────────────────────────

export const mockDispatches: Dispatch[] = [
	{
		id: 'disp-1',
		fk_prescription_id: 'presc-1',
		prescription_number: 'RX-2026-001',
		fk_patient_id: PAC_IDS[0],
		patient_name: 'Pedro González',
		fk_pharmacist_id: 'pharm-1',
		pharmacist_name: 'Farm. María López',
		dispatch_date: '2026-03-20',
		dispatch_status: 'completed',
		items: [
			{ id: 'di-1', fk_batch_id: 'batch-1', lot_number: 'L2026-A001', expiration_date: '2027-06-15', fk_medication_id: 'med-1', medication: { id: 'med-1', code: 'MED-001', generic_name: 'Amoxicilina', pharmaceutical_form: 'Cápsula', unit_measure: 'cápsulas', current_stock: 350 }, quantity_dispatched: 21 }
		],
		created_at: '2026-03-20T10:30:00Z'
	},
	{
		id: 'disp-2',
		fk_prescription_id: 'presc-2',
		prescription_number: 'RX-2026-002',
		fk_patient_id: PAC_IDS[0],
		patient_name: 'Pedro González',
		fk_pharmacist_id: 'pharm-1',
		pharmacist_name: 'Farm. María López',
		dispatch_date: '2026-03-28',
		dispatch_status: 'pending',
		items: [
			{ id: 'di-2', fk_batch_id: 'batch-2', lot_number: 'L2026-B003', expiration_date: '2027-03-01', fk_medication_id: 'med-2', medication: { id: 'med-2', code: 'MED-002', generic_name: 'Ibuprofeno', pharmaceutical_form: 'Tableta', unit_measure: 'tabletas', current_stock: 200 }, quantity_dispatched: 30 },
			{ id: 'di-3', fk_batch_id: 'batch-3', lot_number: 'L2026-C001', expiration_date: '2027-09-20', fk_medication_id: 'med-5', medication: { id: 'med-5', code: 'MED-005', generic_name: 'Omeprazol', pharmaceutical_form: 'Cápsula', unit_measure: 'cápsulas', current_stock: 120 }, quantity_dispatched: 14 }
		],
		created_at: '2026-03-28T09:15:00Z'
	},
	{
		id: 'disp-3',
		fk_prescription_id: 'presc-3',
		prescription_number: 'RX-2026-003',
		fk_patient_id: PAC_IDS[1],
		patient_name: 'Laura Martínez',
		fk_pharmacist_id: 'pharm-1',
		pharmacist_name: 'Farm. María López',
		dispatch_date: '2026-03-25',
		dispatch_status: 'completed',
		items: [
			{ id: 'di-4', fk_batch_id: 'batch-4', lot_number: 'L2026-D001', expiration_date: '2027-12-01', fk_medication_id: 'med-4', medication: { id: 'med-4', code: 'MED-004', generic_name: 'Losartán', pharmaceutical_form: 'Tableta', unit_measure: 'tabletas', current_stock: 180 }, quantity_dispatched: 30 }
		],
		created_at: '2026-03-25T14:00:00Z'
	}
];

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
