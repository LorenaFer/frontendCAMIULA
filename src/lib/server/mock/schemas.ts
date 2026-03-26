import type { MedicalFormSchema } from '$shared/types/form-schema.js';

// ============================================================
// Schemas mock para desarrollo.
// Cada schema replica la estructura del formulario físico
// de la especialidad correspondiente.
// ============================================================

const medicinaGeneral: MedicalFormSchema = {
	id: 'medicina-general-v1',
	version: '1.0',
	specialtyId: 'medicina-general',
	specialtyName: 'Medicina General',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						},
						{
							key: 'anamnesis',
							type: 'textarea',
							label: 'Anamnesis',
							placeholder: 'Historia clínica, antecedentes, evolución del cuadro...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-fisico',
			title: 'Examen Físico',
			icon: 'stethoscope',
			groups: [
				{
					id: 'signos-vitales',
					label: 'Signos Vitales',
					columns: 3,
					fields: [
						{
							key: 'examen_fisico.ta',
							type: 'text',
							label: 'T.A. (mmHg)',
							placeholder: '120/80',
							colSpan: 4,
							unit: 'mmHg'
						},
						{
							key: 'examen_fisico.fc',
							type: 'text',
							label: 'F.C. (lpm)',
							placeholder: '72',
							colSpan: 4,
							unit: 'lpm'
						},
						{
							key: 'examen_fisico.fr',
							type: 'text',
							label: 'F.R. (rpm)',
							placeholder: '16',
							colSpan: 4,
							unit: 'rpm'
						},
						{
							key: 'examen_fisico.temp',
							type: 'text',
							label: 'Temp (°C)',
							placeholder: '36.5',
							colSpan: 4,
							unit: '°C'
						},
						{
							key: 'examen_fisico.peso',
							type: 'text',
							label: 'Peso (kg)',
							placeholder: '70',
							colSpan: 4,
							unit: 'kg'
						},
						{
							key: 'examen_fisico.talla',
							type: 'text',
							label: 'Talla (m)',
							placeholder: '1.70',
							colSpan: 4,
							unit: 'm'
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'J00',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Rinofaringitis aguda',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Tratamiento e Indicaciones',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones',
							placeholder: 'Reposo, dieta, cuidados especiales...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

const cardiologia: MedicalFormSchema = {
	id: 'cardiologia-v1',
	version: '1.0',
	specialtyId: 'cardiologia',
	specialtyName: 'Cardiología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true }
						},
						{
							key: 'anamnesis',
							type: 'textarea',
							label: 'Enfermedad actual',
							placeholder: 'Evolución del cuadro clínico...',
							rows: 4
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-cardio',
			title: 'Antecedentes Cardiovasculares',
			icon: 'heart',
			groups: [
				{
					id: 'factores-riesgo',
					label: 'Factores de Riesgo',
					columns: 3,
					fields: [
						{
							key: 'antecedentes.hipertension',
							type: 'checkbox',
							label: 'Hipertensión arterial',
							colSpan: 4
						},
						{
							key: 'antecedentes.dislipidemia',
							type: 'checkbox',
							label: 'Dislipidemia',
							colSpan: 4
						},
						{
							key: 'antecedentes.diabetes',
							type: 'checkbox',
							label: 'Diabetes mellitus',
							colSpan: 4
						},
						{
							key: 'antecedentes.tabaquismo',
							type: 'checkbox',
							label: 'Tabaquismo',
							colSpan: 4
						},
						{
							key: 'antecedentes.obesidad',
							type: 'checkbox',
							label: 'Obesidad',
							colSpan: 4
						},
						{
							key: 'antecedentes.sedentarismo',
							type: 'checkbox',
							label: 'Sedentarismo',
							colSpan: 4
						},
						{
							key: 'antecedentes.cardiopatia_familiar',
							type: 'checkbox',
							label: 'Cardiopatía familiar',
							colSpan: 4
						}
					]
				},
				{
					id: 'antecedentes-texto',
					fields: [
						{
							key: 'antecedentes.detalle',
							type: 'textarea',
							label: 'Detalle de antecedentes cardiovasculares',
							placeholder: 'Eventos previos, cirugías cardíacas, etc.',
							rows: 3
						}
					]
				}
			]
		},
		{
			id: 'examen-fisico',
			title: 'Examen Físico',
			icon: 'stethoscope',
			groups: [
				{
					id: 'signos-vitales',
					label: 'Signos Vitales',
					columns: 3,
					fields: [
						{
							key: 'examen_fisico.ta',
							type: 'text',
							label: 'T.A. (mmHg)',
							placeholder: '120/80',
							colSpan: 4
						},
						{
							key: 'examen_fisico.fc',
							type: 'text',
							label: 'F.C. (lpm)',
							placeholder: '72',
							colSpan: 4
						},
						{
							key: 'examen_fisico.fr',
							type: 'text',
							label: 'F.R. (rpm)',
							placeholder: '16',
							colSpan: 4
						},
						{
							key: 'examen_fisico.temp',
							type: 'text',
							label: 'Temp (°C)',
							placeholder: '36.5',
							colSpan: 4
						},
						{
							key: 'examen_fisico.peso',
							type: 'text',
							label: 'Peso (kg)',
							placeholder: '70',
							colSpan: 4
						},
						{
							key: 'examen_fisico.talla',
							type: 'text',
							label: 'Talla (m)',
							placeholder: '1.70',
							colSpan: 4
						}
					]
				},
				{
					id: 'examen-cardio',
					label: 'Examen Cardiovascular',
					fields: [
						{
							key: 'examen_fisico.pulso',
							type: 'text',
							label: 'Pulso',
							placeholder: 'Regular, rítmico...',
							colSpan: 6
						},
						{
							key: 'examen_fisico.soplos',
							type: 'text',
							label: 'Soplos',
							placeholder: 'Descripción de soplos si aplica...',
							colSpan: 6
						},
						{
							key: 'examen_fisico.hallazgos_ecg',
							type: 'textarea',
							label: 'Hallazgos Electrocardiograma',
							placeholder: 'Ritmo sinusal, eje, intervalos...',
							rows: 3
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'I10',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Hipertensión arterial esencial',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan de manejo',
							placeholder: 'Cambios en estilo de vida, controles, estudios...',
							rows: 3
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Endocrinología
// ============================================================

const endocrinologia: MedicalFormSchema = {
	id: 'endocrinologia-v1',
	version: '1.0',
	specialtyId: 'endocrinologia',
	specialtyName: 'Endocrinología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						},
						{
							key: 'enfermedad_actual',
							type: 'textarea',
							label: 'Enfermedad actual',
							placeholder: 'Evolución del cuadro clínico endocrinológico...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'evaluacion-antropometrica',
			title: 'Evaluación Antropométrica',
			icon: 'ruler',
			groups: [
				{
					id: 'antropometria-group',
					label: 'Parámetros Antropométricos',
					columns: 3,
					fields: [
						{
							key: 'antropometria.peso',
							type: 'number',
							label: 'Peso',
							placeholder: '70',
							colSpan: 3,
							unit: 'kg',
							validation: { min: 1, max: 300 }
						},
						{
							key: 'antropometria.talla',
							type: 'number',
							label: 'Talla',
							placeholder: '1.70',
							colSpan: 3,
							unit: 'm',
							validation: { min: 0.3, max: 2.5 }
						},
						{
							key: 'antropometria.imc',
							type: 'number',
							label: 'IMC',
							placeholder: '24.2',
							colSpan: 3,
							unit: 'kg/m²',
							validation: { min: 10, max: 80 }
						},
						{
							key: 'antropometria.circunferencia_cintura',
							type: 'number',
							label: 'Circunferencia de cintura',
							placeholder: '85',
							colSpan: 3,
							unit: 'cm',
							validation: { min: 30, max: 200 }
						}
					]
				}
			]
		},
		{
			id: 'control-metabolico',
			title: 'Control Metabólico',
			icon: 'activity',
			groups: [
				{
					id: 'metabolico-group',
					label: 'Parámetros de Laboratorio',
					columns: 2,
					fields: [
						{
							key: 'control_metabolico.glicemia',
							type: 'number',
							label: 'Glicemia',
							placeholder: '95',
							colSpan: 6,
							unit: 'mg/dL'
						},
						{
							key: 'control_metabolico.colesterol',
							type: 'number',
							label: 'Colesterol total',
							placeholder: '200',
							colSpan: 6,
							unit: 'mg/dL'
						},
						{
							key: 'control_metabolico.trigliceridos',
							type: 'number',
							label: 'Triglicéridos',
							placeholder: '150',
							colSpan: 6,
							unit: 'mg/dL'
						},
						{
							key: 'control_metabolico.hba1c',
							type: 'number',
							label: 'HbA1c',
							placeholder: '6.5',
							colSpan: 6,
							unit: '%'
						}
					]
				}
			]
		},
		{
			id: 'examen-fisico',
			title: 'Examen Físico',
			icon: 'stethoscope',
			groups: [
				{
					id: 'examen-fisico-group',
					fields: [
						{
							key: 'examen_fisico.hallazgos',
							type: 'textarea',
							label: 'Hallazgos del examen físico',
							placeholder: 'Tiroides, piel, extremidades, reflejos...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'E11',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Diabetes mellitus tipo 2',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento farmacológico',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan de manejo',
							placeholder: 'Dieta, ejercicio, controles, estudios complementarios...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Gastroenterología
// ============================================================

const gastroenterologia: MedicalFormSchema = {
	id: 'gastroenterologia-v1',
	version: '1.0',
	specialtyId: 'gastroenterologia',
	specialtyName: 'Gastroenterología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						},
						{
							key: 'enfermedad_actual',
							type: 'textarea',
							label: 'Enfermedad actual',
							placeholder: 'Evolución del cuadro clínico digestivo...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-digestivos',
			title: 'Antecedentes Digestivos',
			icon: 'list',
			groups: [
				{
					id: 'antecedentes-digestivos-group',
					label: 'Patologías Digestivas Previas',
					columns: 3,
					fields: [
						{
							key: 'antecedentes.gastritis',
							type: 'checkbox',
							label: 'Gastritis',
							colSpan: 4
						},
						{
							key: 'antecedentes.ulcera_peptica',
							type: 'checkbox',
							label: 'Úlcera péptica',
							colSpan: 4
						},
						{
							key: 'antecedentes.erge',
							type: 'checkbox',
							label: 'ERGE',
							colSpan: 4
						},
						{
							key: 'antecedentes.hernia_hiatal',
							type: 'checkbox',
							label: 'Hernia hiatal',
							colSpan: 4
						},
						{
							key: 'antecedentes.estrenimiento',
							type: 'checkbox',
							label: 'Estreñimiento',
							colSpan: 4
						},
						{
							key: 'antecedentes.diarrea',
							type: 'checkbox',
							label: 'Diarrea crónica',
							colSpan: 4
						},
						{
							key: 'antecedentes.sii',
							type: 'checkbox',
							label: 'Síndrome de intestino irritable (SII)',
							colSpan: 4
						}
					]
				}
			]
		},
		{
			id: 'examen-abdominal',
			title: 'Examen Abdominal',
			icon: 'stethoscope',
			groups: [
				{
					id: 'examen-abdominal-group',
					fields: [
						{
							key: 'examen_fisico.abdomen',
							type: 'textarea',
							label: 'Examen abdominal',
							placeholder: 'Inspección, auscultación, percusión, palpación...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'K21',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Enfermedad por reflujo gastroesofágico',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Dieta, estudios complementarios, controles...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Nefrología
// ============================================================

const nefrologia: MedicalFormSchema = {
	id: 'nefrologia-v1',
	version: '1.0',
	specialtyId: 'nefrologia',
	specialtyName: 'Nefrología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						},
						{
							key: 'enfermedad_actual',
							type: 'textarea',
							label: 'Enfermedad actual',
							placeholder: 'Evolución del cuadro clínico nefrológico...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-nefrologicos',
			title: 'Antecedentes Nefrológicos',
			icon: 'list',
			groups: [
				{
					id: 'antecedentes-nefro-group',
					label: 'Factores de Riesgo Renal',
					columns: 3,
					fields: [
						{
							key: 'antecedentes.diabetes',
							type: 'checkbox',
							label: 'Diabetes mellitus',
							colSpan: 4
						},
						{
							key: 'antecedentes.hipertension',
							type: 'checkbox',
							label: 'Hipertensión arterial',
							colSpan: 4
						},
						{
							key: 'antecedentes.litiasis_renal',
							type: 'checkbox',
							label: 'Litiasis renal',
							colSpan: 4
						},
						{
							key: 'antecedentes.itu_recurrente',
							type: 'checkbox',
							label: 'ITU recurrente',
							colSpan: 4
						},
						{
							key: 'antecedentes.proteinuria',
							type: 'checkbox',
							label: 'Proteinuria',
							colSpan: 4
						}
					]
				}
			]
		},
		{
			id: 'funcion-renal',
			title: 'Función Renal',
			icon: 'activity',
			groups: [
				{
					id: 'funcion-renal-group',
					label: 'Parámetros de Laboratorio',
					columns: 3,
					fields: [
						{
							key: 'funcion_renal.creatinina',
							type: 'number',
							label: 'Creatinina',
							placeholder: '1.0',
							colSpan: 4,
							unit: 'mg/dL'
						},
						{
							key: 'funcion_renal.urea',
							type: 'number',
							label: 'Urea',
							placeholder: '35',
							colSpan: 4,
							unit: 'mg/dL'
						},
						{
							key: 'funcion_renal.potasio',
							type: 'number',
							label: 'Potasio',
							placeholder: '4.5',
							colSpan: 4,
							unit: 'mEq/L'
						},
						{
							key: 'funcion_renal.sodio',
							type: 'number',
							label: 'Sodio',
							placeholder: '140',
							colSpan: 4,
							unit: 'mEq/L'
						},
						{
							key: 'funcion_renal.cloro',
							type: 'number',
							label: 'Cloro',
							placeholder: '100',
							colSpan: 4,
							unit: 'mEq/L'
						}
					]
				}
			]
		},
		{
			id: 'examen-fisico',
			title: 'Examen Físico',
			icon: 'stethoscope',
			groups: [
				{
					id: 'examen-fisico-group',
					fields: [
						{
							key: 'examen_fisico.hallazgos',
							type: 'textarea',
							label: 'Hallazgos del examen físico',
							placeholder: 'Edema, dolor lumbar, puño-percusión, etc.',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'N18',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Enfermedad renal crónica estadio III',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Dieta hipoproteica, restricción de sodio, controles...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Ginecología
// ============================================================

const ginecologia: MedicalFormSchema = {
	id: 'ginecologia-v1',
	version: '1.0',
	specialtyId: 'ginecologia',
	specialtyName: 'Ginecología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-obstetricos',
			title: 'Antecedentes Obstétricos',
			icon: 'file-text',
			groups: [
				{
					id: 'obstetricos-group',
					fields: [
						{
							key: 'antecedentes_obstetricos',
							type: 'textarea',
							label: 'Antecedentes obstétricos',
							placeholder: 'G, P, C, A, FUM, menarquia, ciclos menstruales, método anticonceptivo...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'sintomas-perimenopausicos',
			title: 'Síntomas Perimenopáusicos',
			icon: 'thermometer',
			groups: [
				{
					id: 'perimenopausicos-group',
					fields: [
						{
							key: 'sintomas_perimenopausicos',
							type: 'textarea',
							label: 'Síntomas perimenopáusicos',
							placeholder: 'Bochornos, sudoración nocturna, irregularidad menstrual, sequedad vaginal...',
							rows: 3,
							validation: { maxLength: 3000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-familiares',
			title: 'Antecedentes Familiares',
			icon: 'users',
			groups: [
				{
					id: 'familiares-group',
					fields: [
						{
							key: 'antecedentes_familiares',
							type: 'textarea',
							label: 'Antecedentes familiares relevantes',
							placeholder: 'Cáncer de mama, cáncer de ovario, endometriosis...',
							rows: 3,
							validation: { maxLength: 3000 }
						}
					]
				}
			]
		},
		{
			id: 'historia-obstetrica',
			title: 'Historia Obstétrica',
			icon: 'book',
			groups: [
				{
					id: 'historia-obstetrica-group',
					fields: [
						{
							key: 'historia_obstetrica',
							type: 'textarea',
							label: 'Historia obstétrica detallada',
							placeholder: 'Embarazos previos, complicaciones, partos, cesáreas...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'N92',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Menstruación excesiva y frecuente',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Estudios complementarios, controles, derivaciones...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Neumología
// ============================================================

const neumologia: MedicalFormSchema = {
	id: 'neumologia-v1',
	version: '1.0',
	specialtyId: 'neumologia',
	specialtyName: 'Neumología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-respiratorios',
			title: 'Antecedentes Respiratorios',
			icon: 'wind',
			groups: [
				{
					id: 'antecedentes-resp-group',
					fields: [
						{
							key: 'antecedentes_respiratorios',
							type: 'textarea',
							label: 'Antecedentes respiratorios',
							placeholder: 'Asma, EPOC, tabaquismo, exposición laboral, alergias...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'evaluacion-pulmonar',
			title: 'Evaluación Pulmonar',
			icon: 'activity',
			groups: [
				{
					id: 'evaluacion-pulmonar-group',
					fields: [
						{
							key: 'evaluacion_pulmonar',
							type: 'textarea',
							label: 'Evaluación pulmonar',
							placeholder: 'Espirometría, oximetría, radiografía de tórax, hallazgos...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-fisico',
			title: 'Examen Físico',
			icon: 'stethoscope',
			groups: [
				{
					id: 'examen-fisico-group',
					fields: [
						{
							key: 'examen_fisico.hallazgos',
							type: 'textarea',
							label: 'Hallazgos del examen físico',
							placeholder: 'Auscultación pulmonar, frecuencia respiratoria, uso de músculos accesorios...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'J45',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Asma bronquial',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Evitar alérgenos, técnica inhalatoria, controles...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Dermatología
// ============================================================

const dermatologia: MedicalFormSchema = {
	id: 'dermatologia-v1',
	version: '1.0',
	specialtyId: 'dermatologia',
	specialtyName: 'Dermatología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'descripcion-lesion',
			title: 'Descripción de la Lesión',
			icon: 'eye',
			groups: [
				{
					id: 'lesion-group',
					columns: 2,
					fields: [
						{
							key: 'lesion.forma',
							type: 'text',
							label: 'Forma',
							placeholder: 'Redondeada, irregular, lineal...',
							colSpan: 6
						},
						{
							key: 'lesion.color',
							type: 'text',
							label: 'Color',
							placeholder: 'Eritematosa, hiperpigmentada, hipopigmentada...',
							colSpan: 6
						},
						{
							key: 'lesion.tamano',
							type: 'text',
							label: 'Tamaño',
							placeholder: 'Diámetro en mm o cm',
							colSpan: 6
						},
						{
							key: 'lesion.localizacion',
							type: 'text',
							label: 'Localización',
							placeholder: 'Región anatómica afectada',
							colSpan: 6
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-familiares',
			title: 'Antecedentes Familiares',
			icon: 'users',
			groups: [
				{
					id: 'familiares-group',
					fields: [
						{
							key: 'antecedentes_familiares',
							type: 'textarea',
							label: 'Antecedentes familiares dermatológicos',
							placeholder: 'Psoriasis, dermatitis atópica, melanoma...',
							rows: 3,
							validation: { maxLength: 3000 }
						}
					]
				}
			]
		},
		{
			id: 'body-diagram',
			title: 'Diagrama Corporal',
			icon: 'user',
			groups: [
				{
					id: 'body-diagram-group',
					fields: [
						{
							key: 'diagrama_corporal',
							type: 'widget',
							label: 'Diagrama corporal',
							hint: 'Marque las zonas afectadas en el diagrama',
							widgetConfig: {
								widgetType: 'body_diagram'
							}
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'L20',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Dermatitis atópica',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Tópicos, sistémicos, fototerapia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Cuidados de la piel, fotoprotección, controles...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Fisiatría
// ============================================================

const fisiatria: MedicalFormSchema = {
	id: 'fisiatria-v1',
	version: '1.0',
	specialtyId: 'fisiatria',
	specialtyName: 'Fisiatría',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'evaluacion-funcional',
			title: 'Evaluación Funcional',
			icon: 'activity',
			groups: [
				{
					id: 'funcional-group',
					fields: [
						{
							key: 'evaluacion_funcional',
							type: 'textarea',
							label: 'Evaluación funcional',
							placeholder: 'Capacidad funcional, limitaciones, actividades de la vida diaria...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'escala-dolor',
			title: 'Escala de Dolor',
			icon: 'zap',
			groups: [
				{
					id: 'dolor-group',
					fields: [
						{
							key: 'escala_dolor',
							type: 'widget',
							label: 'Escala de dolor (EVA)',
							hint: 'Seleccione la intensidad del dolor en la escala visual analógica',
							widgetConfig: {
								widgetType: 'pain_scale'
							}
						}
					]
				}
			]
		},
		{
			id: 'examen-osteoarticular',
			title: 'Examen Osteoarticular',
			icon: 'stethoscope',
			groups: [
				{
					id: 'osteoarticular-group',
					fields: [
						{
							key: 'examen_fisico.osteoarticular',
							type: 'textarea',
							label: 'Examen osteoarticular',
							placeholder: 'Rango de movimiento, fuerza muscular, reflejos, pruebas especiales...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'M54',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Dorsalgia',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'plan-rehabilitacion',
			title: 'Plan de Rehabilitación',
			icon: 'pill',
			groups: [
				{
					id: 'rehabilitacion-group',
					fields: [
						{
							key: 'plan_rehabilitacion',
							type: 'textarea',
							label: 'Plan de rehabilitación',
							placeholder: 'Sesiones de fisioterapia, ejercicios, electroterapia, hidroterapia...',
							rows: 4,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones generales',
							placeholder: 'Reposo relativo, ergonomía, controles...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Pediatría
// ============================================================

const pediatria: MedicalFormSchema = {
	id: 'pediatria-v1',
	version: '1.0',
	specialtyId: 'pediatria',
	specialtyName: 'Pediatría',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-personales',
			title: 'Antecedentes Personales',
			icon: 'user',
			groups: [
				{
					id: 'antecedentes-personales-group',
					columns: 2,
					fields: [
						{
							key: 'antecedentes.peso_nacer',
							type: 'number',
							label: 'Peso al nacer',
							placeholder: '3200',
							colSpan: 6,
							unit: 'g'
						},
						{
							key: 'antecedentes.talla_nacer',
							type: 'number',
							label: 'Talla al nacer',
							placeholder: '50',
							colSpan: 6,
							unit: 'cm'
						}
					]
				}
			]
		},
		{
			id: 'signos-vitales',
			title: 'Signos Vitales',
			icon: 'stethoscope',
			groups: [
				{
					id: 'signos-vitales-group',
					columns: 3,
					fields: [
						{
							key: 'examen_fisico.ta',
							type: 'text',
							label: 'T.A. (mmHg)',
							placeholder: '90/60',
							colSpan: 4,
							unit: 'mmHg'
						},
						{
							key: 'examen_fisico.fc',
							type: 'text',
							label: 'F.C. (lpm)',
							placeholder: '100',
							colSpan: 4,
							unit: 'lpm'
						},
						{
							key: 'examen_fisico.fr',
							type: 'text',
							label: 'F.R. (rpm)',
							placeholder: '24',
							colSpan: 4,
							unit: 'rpm'
						},
						{
							key: 'examen_fisico.temp',
							type: 'text',
							label: 'Temp (°C)',
							placeholder: '36.5',
							colSpan: 4,
							unit: '°C'
						},
						{
							key: 'examen_fisico.peso',
							type: 'text',
							label: 'Peso (kg)',
							placeholder: '12',
							colSpan: 4,
							unit: 'kg'
						},
						{
							key: 'examen_fisico.talla',
							type: 'text',
							label: 'Talla (cm)',
							placeholder: '85',
							colSpan: 4,
							unit: 'cm'
						}
					]
				}
			]
		},
		{
			id: 'desarrollo-psicomotor',
			title: 'Desarrollo Psicomotor',
			icon: 'trending-up',
			groups: [
				{
					id: 'desarrollo-group',
					label: 'Áreas del Desarrollo',
					columns: 3,
					fields: [
						{
							key: 'desarrollo.motor',
							type: 'checkbox',
							label: 'Motor (adecuado para la edad)',
							colSpan: 4
						},
						{
							key: 'desarrollo.social_emocional',
							type: 'checkbox',
							label: 'Social-emocional (adecuado para la edad)',
							colSpan: 4
						},
						{
							key: 'desarrollo.cognitivo',
							type: 'checkbox',
							label: 'Cognitivo (adecuado para la edad)',
							colSpan: 4
						}
					]
				}
			]
		},
		{
			id: 'vacunacion',
			title: 'Vacunación',
			icon: 'shield',
			groups: [
				{
					id: 'vacunacion-group',
					fields: [
						{
							key: 'vacunacion',
							type: 'widget',
							label: 'Esquema de vacunación',
							hint: 'Registre las vacunas administradas y pendientes',
							widgetConfig: {
								widgetType: 'vaccination_table'
							}
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'Z00.1',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Control de salud de rutina del niño',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis según peso, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Alimentación, cuidados, próximo control...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Nutrición
// ============================================================

const nutricion: MedicalFormSchema = {
	id: 'nutricion-v1',
	version: '1.0',
	specialtyId: 'nutricion',
	specialtyName: 'Nutrición',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'antropometria',
			title: 'Parámetros Antropométricos',
			icon: 'ruler',
			groups: [
				{
					id: 'antropometria-group',
					columns: 2,
					fields: [
						{
							key: 'antropometria.peso',
							type: 'number',
							label: 'Peso',
							placeholder: '70',
							colSpan: 6,
							unit: 'kg',
							validation: { min: 1, max: 300 }
						},
						{
							key: 'antropometria.talla',
							type: 'number',
							label: 'Talla',
							placeholder: '1.70',
							colSpan: 6,
							unit: 'm',
							validation: { min: 0.3, max: 2.5 }
						},
						{
							key: 'antropometria.imc',
							type: 'number',
							label: 'IMC',
							placeholder: '24.2',
							colSpan: 6,
							unit: 'kg/m²',
							validation: { min: 10, max: 80 }
						},
						{
							key: 'antropometria.circunferencia_cintura',
							type: 'number',
							label: 'Circunferencia de cintura',
							placeholder: '85',
							colSpan: 6,
							unit: 'cm',
							validation: { min: 30, max: 200 }
						}
					]
				}
			]
		},
		{
			id: 'parametros-bioquimicos',
			title: 'Parámetros Bioquímicos',
			icon: 'activity',
			groups: [
				{
					id: 'bioquimicos-group',
					fields: [
						{
							key: 'parametros_bioquimicos',
							type: 'widget',
							label: 'Parámetros bioquímicos',
							hint: 'Registre los resultados de laboratorio relevantes',
							widgetConfig: {
								widgetType: 'lab_grid'
							}
						}
					]
				}
			]
		},
		{
			id: 'actividad-fisica',
			title: 'Actividad Física',
			icon: 'trending-up',
			groups: [
				{
					id: 'actividad-fisica-group',
					columns: 2,
					fields: [
						{
							key: 'actividad_fisica.tipo',
							type: 'select',
							label: 'Tipo de actividad',
							colSpan: 6,
							options: [
								{ value: 'sedentario', label: 'Sedentario' },
								{ value: 'ligero', label: 'Actividad ligera' },
								{ value: 'moderado', label: 'Actividad moderada' },
								{ value: 'intenso', label: 'Actividad intensa' },
								{ value: 'muy_intenso', label: 'Actividad muy intensa' }
							]
						},
						{
							key: 'actividad_fisica.frecuencia',
							type: 'select',
							label: 'Frecuencia',
							colSpan: 6,
							options: [
								{ value: 'nunca', label: 'Nunca' },
								{ value: '1-2', label: '1-2 veces/semana' },
								{ value: '3-4', label: '3-4 veces/semana' },
								{ value: '5-6', label: '5-6 veces/semana' },
								{ value: 'diario', label: 'Diario' }
							]
						}
					]
				}
			]
		},
		{
			id: 'evaluacion-dietetica',
			title: 'Evaluación Dietética',
			icon: 'file-text',
			groups: [
				{
					id: 'dietetica-group',
					fields: [
						{
							key: 'evaluacion_dietetica',
							type: 'textarea',
							label: 'Evaluación dietética',
							placeholder: 'Hábitos alimentarios, recordatorio 24h, frecuencia de consumo...',
							rows: 5,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'E66',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Obesidad',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Nutricional',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Plan alimentario',
							placeholder: 'Distribución calórica, macronutrientes, suplementos...',
							rows: 4,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y seguimiento',
							placeholder: 'Metas, controles, educación alimentaria...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Cirugía General
// ============================================================

const cirugiaGeneral: MedicalFormSchema = {
	id: 'cirugia-general-v1',
	version: '1.0',
	specialtyId: 'cirugia-general',
	specialtyName: 'Cirugía General',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						},
						{
							key: 'enfermedad_actual',
							type: 'textarea',
							label: 'Enfermedad actual',
							placeholder: 'Evolución del cuadro clínico quirúrgico...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-quirurgicos',
			title: 'Antecedentes Quirúrgicos',
			icon: 'file-text',
			groups: [
				{
					id: 'quirurgicos-group',
					fields: [
						{
							key: 'antecedentes_quirurgicos',
							type: 'textarea',
							label: 'Antecedentes quirúrgicos',
							placeholder: 'Cirugías previas, complicaciones, alergias a anestésicos...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-abdominal',
			title: 'Examen Abdominal',
			icon: 'stethoscope',
			groups: [
				{
					id: 'examen-abdominal-group',
					fields: [
						{
							key: 'examen_fisico.abdomen',
							type: 'textarea',
							label: 'Examen abdominal',
							placeholder: 'Inspección, auscultación, percusión, palpación, signos peritoneales...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'plan-quirurgico',
			title: 'Plan Quirúrgico',
			icon: 'calendar',
			groups: [
				{
					id: 'plan-quirurgico-group',
					columns: 3,
					fields: [
						{
							key: 'plan_quirurgico.fecha',
							type: 'date',
							label: 'Fecha programada',
							colSpan: 4
						},
						{
							key: 'plan_quirurgico.tipo',
							type: 'text',
							label: 'Tipo de cirugía',
							placeholder: 'Laparoscópica, abierta, ambulatoria...',
							colSpan: 4
						},
						{
							key: 'plan_quirurgico.indicacion',
							type: 'text',
							label: 'Indicación quirúrgica',
							placeholder: 'Razón principal de la intervención',
							colSpan: 4
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'K80',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Colelitiasis',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, preparación prequirúrgica...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Ayuno, exámenes preoperatorios, cuidados postquirúrgicos...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Control Prenatal
// ============================================================

const controlPrenatal: MedicalFormSchema = {
	id: 'control-prenatal-v1',
	version: '1.0',
	specialtyId: 'control-prenatal',
	specialtyName: 'Control Prenatal',
	sections: [
		{
			id: 'signos-vitales',
			title: 'Signos Vitales',
			icon: 'stethoscope',
			groups: [
				{
					id: 'signos-vitales-group',
					columns: 3,
					fields: [
						{
							key: 'signos_vitales.fcf',
							type: 'text',
							label: 'FCF (lpm)',
							placeholder: '140',
							colSpan: 4,
							unit: 'lpm'
						},
						{
							key: 'signos_vitales.ta',
							type: 'text',
							label: 'T.A. (mmHg)',
							placeholder: '120/80',
							colSpan: 4,
							unit: 'mmHg'
						},
						{
							key: 'signos_vitales.peso',
							type: 'number',
							label: 'Peso (kg)',
							placeholder: '65',
							colSpan: 4,
							unit: 'kg'
						}
					]
				}
			]
		},
		{
			id: 'estado-embarazo',
			title: 'Estado del Embarazo',
			icon: 'heart',
			groups: [
				{
					id: 'embarazo-group',
					fields: [
						{
							key: 'estado_embarazo',
							type: 'textarea',
							label: 'Estado del embarazo',
							placeholder: 'Semanas de gestación, altura uterina, movimientos fetales, presentación...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'medicacion',
			title: 'Medicación',
			icon: 'pill',
			groups: [
				{
					id: 'medicacion-group',
					fields: [
						{
							key: 'medicacion',
							type: 'textarea',
							label: 'Medicación actual',
							placeholder: 'Ácido fólico, hierro, calcio, vitaminas prenatales...',
							rows: 3,
							validation: { maxLength: 3000 }
						}
					]
				}
			]
		},
		{
			id: 'vacunacion',
			title: 'Esquema de Vacunación',
			icon: 'shield',
			groups: [
				{
					id: 'vacunacion-group',
					fields: [
						{
							key: 'vacunacion',
							type: 'widget',
							label: 'Esquema de vacunación prenatal',
							hint: 'Registre las vacunas administradas durante el embarazo',
							widgetConfig: {
								widgetType: 'vaccination_table'
							}
						}
					]
				}
			]
		},
		{
			id: 'examen-fisico',
			title: 'Examen Físico',
			icon: 'stethoscope',
			groups: [
				{
					id: 'examen-fisico-group',
					fields: [
						{
							key: 'examen_fisico.hallazgos',
							type: 'textarea',
							label: 'Hallazgos del examen físico',
							placeholder: 'Edema, varices, maniobras de Leopold, tono uterino...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'Z34',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Supervisión de embarazo normal',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan de Seguimiento',
			icon: 'calendar',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Indicaciones',
							placeholder: 'Suplementos, reposo, actividad, signos de alarma...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Plan y próximos estudios',
							placeholder: 'Ecografía, laboratorio, próximo control...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Urología
// ============================================================

const urologia: MedicalFormSchema = {
	id: 'urologia-v1',
	version: '1.0',
	specialtyId: 'urologia',
	specialtyName: 'Urología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'sintomas-urinarios',
			title: 'Síntomas Urinarios',
			icon: 'list',
			groups: [
				{
					id: 'sintomas-urinarios-group',
					label: 'Síntomas Urinarios',
					columns: 2,
					fields: [
						{
							key: 'sintomas.disuria',
							type: 'checkbox',
							label: 'Disuria',
							colSpan: 6
						},
						{
							key: 'sintomas.hematuria',
							type: 'checkbox',
							label: 'Hematuria',
							colSpan: 6
						},
						{
							key: 'sintomas.polaquiuria',
							type: 'checkbox',
							label: 'Polaquiuria',
							colSpan: 6
						},
						{
							key: 'sintomas.nicturia',
							type: 'checkbox',
							label: 'Nicturia',
							colSpan: 6
						}
					]
				}
			]
		},
		{
			id: 'examen-abdominal-lumbar',
			title: 'Examen Abdominal / Lumbar',
			icon: 'stethoscope',
			groups: [
				{
					id: 'examen-abdominal-lumbar-group',
					fields: [
						{
							key: 'examen_fisico.abdomen_lumbar',
							type: 'textarea',
							label: 'Examen abdominal y lumbar',
							placeholder: 'Palpación de flancos, puño-percusión, globo vesical...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-genitourinario',
			title: 'Examen Genitourinario',
			icon: 'stethoscope',
			groups: [
				{
					id: 'genitourinario-group',
					fields: [
						{
							key: 'examen_fisico.genitourinario',
							type: 'textarea',
							label: 'Examen genitourinario',
							placeholder: 'Genitales externos, meato uretral, testículos...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-prostatico',
			title: 'Examen Prostático',
			icon: 'stethoscope',
			groups: [
				{
					id: 'prostatico-group',
					fields: [
						{
							key: 'examen_fisico.prostatico',
							type: 'textarea',
							label: 'Examen prostático (tacto rectal)',
							placeholder: 'Tamaño, consistencia, superficie, sensibilidad, surco medio...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'N40',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Hiperplasia prostática benigna',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, dosis, frecuencia...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Estudios complementarios, controles, derivaciones...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// ORL (Otorrinolaringología)
// ============================================================

const orl: MedicalFormSchema = {
	id: 'orl-v1',
	version: '1.0',
	specialtyId: 'orl',
	specialtyName: 'Otorrinolaringología (ORL)',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'sintomas-actuales',
			title: 'Síntomas Actuales',
			icon: 'list',
			groups: [
				{
					id: 'sintomas-group',
					fields: [
						{
							key: 'sintomas_actuales',
							type: 'textarea',
							label: 'Síntomas actuales',
							placeholder: 'Otalgia, rinorrea, disfonía, disfagia, vértigo...',
							rows: 3,
							validation: { maxLength: 3000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-otologico',
			title: 'Examen Otológico',
			icon: 'ear',
			groups: [
				{
					id: 'otologico-group',
					label: 'Hallazgos Otológicos',
					columns: 3,
					fields: [
						{
							key: 'examen_oido.otitis',
							type: 'checkbox',
							label: 'Otitis',
							colSpan: 4
						},
						{
							key: 'examen_oido.hipoacusia_conductiva',
							type: 'checkbox',
							label: 'Hipoacusia conductiva',
							colSpan: 4
						},
						{
							key: 'examen_oido.hipoacusia_neurosensorial',
							type: 'checkbox',
							label: 'Hipoacusia neurosensorial',
							colSpan: 4
						}
					]
				}
			]
		},
		{
			id: 'examen-nasal-sinusal',
			title: 'Examen Nasal / Sinusal',
			icon: 'stethoscope',
			groups: [
				{
					id: 'nasal-sinusal-group',
					fields: [
						{
							key: 'examen_fisico.nasal_sinusal',
							type: 'textarea',
							label: 'Examen nasal y sinusal',
							placeholder: 'Rinoscopia, tabique, cornetes, secreciones, puntos sinusales...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-laringeo',
			title: 'Examen Laríngeo',
			icon: 'stethoscope',
			groups: [
				{
					id: 'laringeo-group',
					fields: [
						{
							key: 'examen_fisico.laringeo',
							type: 'textarea',
							label: 'Examen laríngeo',
							placeholder: 'Laringoscopia indirecta, cuerdas vocales, epiglotis...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'H66',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Otitis media supurativa',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Medicamentos, gotas óticas, lavados nasales...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Estudios audiológicos, controles, derivaciones...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Odontología
// ============================================================

const odontologia: MedicalFormSchema = {
	id: 'odontologia-v1',
	version: '1.0',
	specialtyId: 'odontologia',
	specialtyName: 'Odontología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes',
			title: 'Antecedentes',
			icon: 'file-text',
			groups: [
				{
					id: 'antecedentes-group',
					fields: [
						{
							key: 'antecedentes',
							type: 'textarea',
							label: 'Antecedentes odontológicos y médicos',
							placeholder: 'Tratamientos previos, alergias, medicamentos, enfermedades sistémicas...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'examen-dental',
			title: 'Examen Dental',
			icon: 'grid',
			groups: [
				{
					id: 'dental-chart-group',
					fields: [
						{
							key: 'examen_dental',
							type: 'widget',
							label: 'Odontograma',
							hint: 'Registre el estado de cada pieza dental',
							widgetConfig: {
								widgetType: 'dental_chart'
							}
						}
					]
				}
			]
		},
		{
			id: 'evaluacion-periodontal',
			title: 'Evaluación Periodontal',
			icon: 'stethoscope',
			groups: [
				{
					id: 'periodontal-group',
					fields: [
						{
							key: 'evaluacion_periodontal',
							type: 'textarea',
							label: 'Evaluación periodontal',
							placeholder: 'Estado de encías, sondaje periodontal, movilidad dental, sangrado...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'K02',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Caries dental',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'plan-tratamiento',
			title: 'Plan de Tratamiento',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Plan de tratamiento',
							placeholder: 'Restauraciones, endodoncia, periodoncia, cirugía, prótesis...',
							rows: 4,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones',
							placeholder: 'Higiene oral, cepillado, uso de hilo dental, controles...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

// ============================================================
// Oftalmología
// ============================================================

const oftalmologia: MedicalFormSchema = {
	id: 'oftalmologia-v1',
	version: '1.0',
	specialtyId: 'oftalmologia',
	specialtyName: 'Oftalmología',
	sections: [
		{
			id: 'motivo',
			title: 'Motivo de Consulta',
			icon: 'clipboard',
			groups: [
				{
					id: 'motivo-group',
					fields: [
						{
							key: 'motivo_consulta',
							type: 'textarea',
							label: 'Motivo de consulta',
							placeholder: 'Describa el motivo principal de la consulta...',
							rows: 2,
							validation: { required: true, maxLength: 2000 }
						}
					]
				}
			]
		},
		{
			id: 'antecedentes-oculares',
			title: 'Antecedentes Oculares',
			icon: 'eye',
			groups: [
				{
					id: 'antecedentes-oculares-group',
					fields: [
						{
							key: 'antecedentes_oculares',
							type: 'textarea',
							label: 'Antecedentes oculares',
							placeholder: 'Uso de lentes, cirugías oculares previas, glaucoma, diabetes...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'agudeza-visual',
			title: 'Agudeza Visual',
			icon: 'eye',
			groups: [
				{
					id: 'agudeza-visual-group',
					columns: 2,
					fields: [
						{
							key: 'agudeza_visual.od',
							type: 'text',
							label: 'Agudeza visual OD',
							placeholder: '20/20',
							colSpan: 6
						},
						{
							key: 'agudeza_visual.oi',
							type: 'text',
							label: 'Agudeza visual OI',
							placeholder: '20/20',
							colSpan: 6
						}
					]
				}
			]
		},
		{
			id: 'presion-intraocular',
			title: 'Presión Intraocular',
			icon: 'activity',
			groups: [
				{
					id: 'presion-intraocular-group',
					columns: 2,
					fields: [
						{
							key: 'presion_intraocular.od',
							type: 'number',
							label: 'PIO OD',
							placeholder: '14',
							colSpan: 6,
							unit: 'mmHg'
						},
						{
							key: 'presion_intraocular.oi',
							type: 'number',
							label: 'PIO OI',
							placeholder: '14',
							colSpan: 6,
							unit: 'mmHg'
						}
					]
				}
			]
		},
		{
			id: 'lampara-hendidura',
			title: 'Examen con Lámpara de Hendidura',
			icon: 'stethoscope',
			groups: [
				{
					id: 'lampara-hendidura-group',
					fields: [
						{
							key: 'examen_fisico.lampara_hendidura',
							type: 'textarea',
							label: 'Examen con lámpara de hendidura',
							placeholder: 'Córnea, cámara anterior, cristalino, iris...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'fondo-ojo',
			title: 'Fondo de Ojo',
			icon: 'eye',
			groups: [
				{
					id: 'fondo-ojo-group',
					fields: [
						{
							key: 'examen_fisico.fondo_ojo',
							type: 'textarea',
							label: 'Fondo de ojo',
							placeholder: 'Papila, vasos, mácula, retina periférica...',
							rows: 4,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		},
		{
			id: 'diagnostico',
			title: 'Diagnóstico',
			icon: 'search',
			groups: [
				{
					id: 'diagnostico-group',
					columns: 2,
					fields: [
						{
							key: 'diagnostico.cie10',
							type: 'text',
							label: 'Código CIE-10',
							placeholder: 'H52',
							colSpan: 3
						},
						{
							key: 'diagnostico.descripcion',
							type: 'text',
							label: 'Descripción diagnóstica',
							placeholder: 'Ej: Trastornos de la refracción',
							colSpan: 9
						}
					]
				}
			]
		},
		{
			id: 'tratamiento',
			title: 'Plan Terapéutico',
			icon: 'pill',
			groups: [
				{
					id: 'tratamiento-group',
					fields: [
						{
							key: 'tratamiento',
							type: 'textarea',
							label: 'Tratamiento',
							placeholder: 'Corrección óptica, colirios, medicamentos...',
							rows: 3,
							validation: { maxLength: 5000 }
						},
						{
							key: 'indicaciones',
							type: 'textarea',
							label: 'Indicaciones y plan',
							placeholder: 'Uso de lentes, controles, estudios complementarios...',
							rows: 3,
							validation: { maxLength: 5000 }
						}
					]
				}
			]
		}
	]
};

/** Mapa de schemas indexado por specialtyId */
export const mockSchemas: Record<string, MedicalFormSchema> = {
	'medicina-general': medicinaGeneral,
	cardiologia: cardiologia,
	endocrinologia: endocrinologia,
	gastroenterologia: gastroenterologia,
	nefrologia: nefrologia,
	ginecologia: ginecologia,
	neumologia: neumologia,
	dermatologia: dermatologia,
	fisiatria: fisiatria,
	pediatria: pediatria,
	nutricion: nutricion,
	'cirugia-general': cirugiaGeneral,
	'control-prenatal': controlPrenatal,
	urologia: urologia,
	orl: orl,
	odontologia: odontologia,
	oftalmologia: oftalmologia
};

/** Schema fallback para especialidades sin schema definido */
export const fallbackSchema = medicinaGeneral;
