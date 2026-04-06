// ============================================================
// Tipos del Dominio: Historias Médicas
// ============================================================

// ─── Evaluación médica ───────────────────────────────────

export interface ExamenFisico {
	ta?: string; // tensión arterial
	fc?: string; // frecuencia cardíaca
	fr?: string; // frecuencia respiratoria
	temp?: string; // temperatura
	peso?: string;
	talla?: string;
}

export interface Diagnostico {
	cie10?: string;
	descripcion?: string;
}

export interface Evaluacion {
	motivo_consulta?: string;
	anamnesis?: string;
	examen_fisico?: ExamenFisico;
	diagnostico?: Diagnostico;
	tratamiento?: string;
	indicaciones?: string;
}

export interface HistoriaMedica {
	id: string;
	cita_id: string;
	paciente_id: string;
	doctor_id: string;
	evaluacion: Evaluacion;
	preparado: boolean;
	preparado_at?: string;
	created_at: string;
	updated_at: string;
}

// ─── Extensiones dinámicas ───────────────────────────────

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
