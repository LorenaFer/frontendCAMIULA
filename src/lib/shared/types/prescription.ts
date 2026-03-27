// ============================================================
// Tipos del Módulo de Receta Médica
// Preparado para integración futura con el módulo de inventario.
// ============================================================

export interface PrescriptionItem extends Record<string, unknown> {
	id: string;
	medicamento: string;
	presentacion: string;
	dosis: string;
	via: string;
	frecuencia: string;
	duracion: string;
	cantidad: number;
	indicaciones: string;
}

// ─── Opciones de selects ────────────────────────────────────

export const PRESENTACION_OPTIONS = [
	{ value: 'tabletas', label: 'Tabletas' },
	{ value: 'capsulas', label: 'Cápsulas' },
	{ value: 'jarabe', label: 'Jarabe' },
	{ value: 'ampolla', label: 'Ampolla' },
	{ value: 'crema', label: 'Crema' },
	{ value: 'gotas', label: 'Gotas' },
	{ value: 'inyectable', label: 'Inyectable' },
	{ value: 'supositorio', label: 'Supositorio' },
	{ value: 'suspension', label: 'Suspensión' },
	{ value: 'polvo', label: 'Polvo' },
	{ value: 'solucion', label: 'Solución' },
	{ value: 'parche', label: 'Parche' },
	{ value: 'inhalador', label: 'Inhalador' },
	{ value: 'otro', label: 'Otro' }
] as const;

export const VIA_OPTIONS = [
	{ value: 'oral', label: 'Oral' },
	{ value: 'iv', label: 'Intravenosa (IV)' },
	{ value: 'im', label: 'Intramuscular (IM)' },
	{ value: 'sc', label: 'Subcutánea (SC)' },
	{ value: 'sublingual', label: 'Sublingual' },
	{ value: 'topica', label: 'Tópica' },
	{ value: 'inhalatoria', label: 'Inhalatoria' },
	{ value: 'rectal', label: 'Rectal' },
	{ value: 'oftalmica', label: 'Oftálmica' },
	{ value: 'otica', label: 'Ótica' },
	{ value: 'nasal', label: 'Nasal' },
	{ value: 'otro', label: 'Otro' }
] as const;

// ─── Factory ────────────────────────────────────────────────

let _rxCounter = 0;
export function createPrescriptionItem(): PrescriptionItem {
	return {
		id: 'rx-' + (++_rxCounter).toString(36) + '-' + Math.random().toString(36).slice(2, 8),
		medicamento: '',
		presentacion: '',
		dosis: '',
		via: 'oral',
		frecuencia: '',
		duracion: '',
		cantidad: 0,
		indicaciones: ''
	};
}
