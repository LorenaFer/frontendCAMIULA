// ============================================================
// Tipos extendidos para Historias Médicas con schema dinámico.
// Extiende los tipos base en appointments.ts sin romperlos.
// ============================================================

import type { HistoriaMedica } from './appointments.js';

/** Evaluación dinámica: las keys coinciden con los field keys del schema */
export interface DynamicEvaluacion {
	[key: string]: unknown;
}

/** Historia médica con referencia al schema usado */
export interface HistoriaMedicaDynamic extends HistoriaMedica {
	schema_id: string;
	schema_version: string;
	evaluacion: DynamicEvaluacion;
}

/** Examen solicitado en una consulta */
export interface ExamenSolicitadoEntry {
	nombre: string;
	indicaciones?: string;
}

/** Resumen de historia previa para el panel de insights */
export interface HistorialPrevioEntry {
	id: string;
	fecha: string;
	especialidad: string;
	doctor_nombre: string;
	diagnostico_descripcion?: string;
	diagnostico_cie10?: string;
	examenes_solicitados?: ExamenSolicitadoEntry[];
}
