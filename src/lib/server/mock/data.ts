// ============================================================
// Datos mock — replican exactamente el contrato de la API real
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

// ─── Especialidades ──────────────────────────────────────────

export const mockEspecialidades: Especialidad[] = [
	{ id: 1, nombre: 'Medicina General', activo: true },
	{ id: 2, nombre: 'Odontología', activo: true },
	{ id: 3, nombre: 'Ginecología', activo: true },
	{ id: 4, nombre: 'Pediatría', activo: true },
	{ id: 5, nombre: 'Oftalmología', activo: true }
];

// ─── Doctores ────────────────────────────────────────────────

export const mockDoctores: DoctorConEspecialidad[] = [
	{
		id: 1,
		nombre: 'Carlos',
		apellido: 'Mendoza',
		especialidad_id: 1,
		activo: true,
		especialidad: mockEspecialidades[0]
	},
	{
		id: 2,
		nombre: 'María',
		apellido: 'Rodríguez',
		especialidad_id: 1,
		activo: true,
		especialidad: mockEspecialidades[0]
	},
	{
		id: 3,
		nombre: 'José',
		apellido: 'Pérez',
		especialidad_id: 2,
		activo: true,
		especialidad: mockEspecialidades[1]
	},
	{
		id: 4,
		nombre: 'Ana',
		apellido: 'García',
		especialidad_id: 3,
		activo: true,
		especialidad: mockEspecialidades[2]
	},
	{
		id: 5,
		nombre: 'Luis',
		apellido: 'Torres',
		especialidad_id: 4,
		activo: true,
		especialidad: mockEspecialidades[3]
	}
];

export const mockDoctorOptions: DoctorOption[] = mockDoctores.map((d) => ({
	id: d.id,
	nombreCompleto: `${d.nombre} ${d.apellido}`,
	especialidad: d.especialidad.nombre,
	especialidadId: d.especialidad_id,
	diasTrabajo: [1, 2, 3, 4, 5] // L-V por defecto en mock
}));

// ─── Disponibilidad ──────────────────────────────────────────

// Cada doctor trabaja L-V 8:00-12:00 y 14:00-17:00, slots de 30 min
function buildDisponibilidad(doctorId: number): DisponibilidadDoctor[] {
	const result: DisponibilidadDoctor[] = [];
	let id = (doctorId - 1) * 10 + 1;
	for (const dow of [1, 2, 3, 4, 5] as const) {
		result.push(
			{ id: id++, doctor_id: doctorId, day_of_week: dow, hora_inicio: '08:00', hora_fin: '12:00', duracion_slot: 30 },
			{ id: id++, doctor_id: doctorId, day_of_week: dow, hora_inicio: '14:00', hora_fin: '17:00', duracion_slot: 30 }
		);
	}
	return result;
}

export const mockDisponibilidad: DisponibilidadDoctor[] = [
	...buildDisponibilidad(1),
	...buildDisponibilidad(2),
	...buildDisponibilidad(3),
	...buildDisponibilidad(4),
	...buildDisponibilidad(5)
];

// ─── Pacientes ───────────────────────────────────────────────

export const mockPacientes: Paciente[] = [
	{
		id: 1,
		nhm: 1001,
		cedula: 'V-12345678',
		nombre: 'Pedro',
		apellido: 'González',
		relacion_univ: 'empleado',
		datos_medicos: { tipo_sangre: 'O+', alergias: ['Penicilina'], numero_contacto: '0412-1234567' },
		es_nuevo: false,
		created_at: '2024-01-10T10:00:00Z'
	},
	{
		id: 2,
		nhm: 1002,
		cedula: 'V-23456789',
		nombre: 'Laura',
		apellido: 'Martínez',
		relacion_univ: 'estudiante',
		datos_medicos: { tipo_sangre: 'A+', alergias: [], numero_contacto: '0414-9876543' },
		es_nuevo: false,
		created_at: '2024-02-15T09:00:00Z'
	},
	{
		id: 3,
		nhm: 1003,
		cedula: 'V-34567890',
		nombre: 'Roberto',
		apellido: 'Jiménez',
		relacion_univ: 'profesor',
		datos_medicos: { tipo_sangre: 'B-', alergias: ['Aspirina'], numero_contacto: '0416-5554433' },
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
		id: 1,
		paciente_id: 1,
		doctor_id: 1,
		especialidad_id: 1,
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
		id: 2,
		paciente_id: 2,
		doctor_id: 1,
		especialidad_id: 1,
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
		id: 3,
		paciente_id: 3,
		doctor_id: 2,
		especialidad_id: 1,
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
		id: 4,
		paciente_id: 1,
		doctor_id: 3,
		especialidad_id: 2,
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
		id: 1,
		cita_id: 4,
		paciente_id: 1,
		doctor_id: 3,
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
