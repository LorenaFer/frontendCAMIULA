// ─── EPI report data shapes (matches backend MPPS / SIS-04 forms) ───

export interface EPI12Data {
	year: number;
	week: number;
	start_date: string;
	end_date: string;
	total_cases: number;
	diseases: Array<{
		cie10: string;
		disease_name: string;
		total: number;
		age_groups: Record<string, { H: number; M: number }>;
	}>;
}

export interface EPI13Data {
	year: number;
	week: number;
	start_date: string;
	end_date: string;
	total_cases: number;
	cases: Array<{
		date: string;
		patient_name: string;
		age: number;
		sex: string;
		address: string;
		disease: string;
		cie10: string;
	}>;
}

export interface EPI15Data {
	year: number;
	month: number;
	month_name: string;
	total_cases: number;
	categories: Array<{
		name: string;
		subcategories: Array<{
			name: string;
			diseases: Array<{
				order: number;
				name: string;
				cie10_range: string;
				count: number;
				accumulated: number;
			}>;
		}>;
	}>;
}

export type ReportTab = 'epi12' | 'epi13' | 'epi15';

export interface ReportsPageData {
	tab: ReportTab | string;
	year: number;
	week: number;
	month: number;
	epi12: EPI12Data | null;
	epi13: EPI13Data | null;
	epi15: EPI15Data | null;
}

// ─── Constantes compartidas ───

export const AGE_GROUPS = [
	'<1', '1-4', '5-6', '7-9', '10-11', '12-14',
	'15-19', '20-24', '25-44', '45-59', '60-64', '65+'
];

export const MONTHS = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ─── Traducción de categorías y enfermedades del EPI-15 (backend devuelve en inglés) ───

export const translations: Record<string, string> = {
	// Categorías
	'I. Infectious and Parasitic Diseases': 'I. Enfermedades Infecciosas y Parasitarias',
	'II. Neoplasms': 'II. Neoplasias',
	'III. Blood Diseases': 'III. Enfermedades de la Sangre',
	'IV. Endocrine and Metabolic Diseases': 'IV. Enfermedades Endocrinas y Metabólicas',
	'V. Mental and Behavioral Disorders': 'V. Trastornos Mentales y del Comportamiento',
	'VI. Nervous System Diseases': 'VI. Enfermedades del Sistema Nervioso',
	'VII. Eye Diseases': 'VII. Enfermedades del Ojo',
	'VIII. Ear Diseases': 'VIII. Enfermedades del Oído',
	'IX. Circulatory System Diseases': 'IX. Enfermedades del Sistema Circulatorio',
	'X. Respiratory System Diseases': 'X. Enfermedades del Sistema Respiratorio',
	'XI. Digestive System Diseases': 'XI. Enfermedades del Sistema Digestivo',
	'XII. Skin Diseases': 'XII. Enfermedades de la Piel',
	'XIII. Musculoskeletal Diseases': 'XIII. Enfermedades del Sistema Osteomuscular',
	'XIV. Genitourinary Diseases': 'XIV. Enfermedades del Sistema Genitourinario',
	'XV. Pregnancy and Childbirth': 'XV. Embarazo, Parto y Puerperio',
	'XVI. Perinatal Conditions': 'XVI. Condiciones Perinatales',
	'XVII. Congenital Malformations': 'XVII. Malformaciones Congénitas',
	'XVIII. Symptoms and Signs': 'XVIII. Síntomas y Signos',
	'XIX. Injury and Poisoning': 'XIX. Traumatismos y Envenenamientos',
	'XX. External Causes': 'XX. Causas Externas',
	// Subcategorías
	'Ia. Waterborne and Foodborne': 'Ia. Transmitidas por agua y alimentos',
	'Ib. Vaccine-preventable Diseases': 'Ib. Prevenibles por vacunación',
	'Ic. Tuberculosis': 'Ic. Tuberculosis',
	'Id. Zoonoses': 'Id. Zoonosis',
	'Ie. STIs': 'Ie. Infecciones de transmisión sexual',
	'If. Vector-borne Diseases': 'If. Transmitidas por vectores',
	'Ig. Viral Hepatitis': 'Ig. Hepatitis virales',
	'Ih. Other Infectious Diseases': 'Ih. Otras enfermedades infecciosas',
	'IIa. Neoplasms': 'IIa. Neoplasias',
	'IIIa. Blood Disorders': 'IIIa. Trastornos de la sangre',
	'IVa. Endocrine/Metabolic': 'IVa. Endocrinas y metabólicas',
	'Va. Mental Health': 'Va. Salud mental',
	'VIa. Nervous System': 'VIa. Sistema nervioso',
	'VIIa. Eye': 'VIIa. Enfermedades del ojo',
	'VIIIa. Ear': 'VIIIa. Enfermedades del oído',
	'IXa. Cardiovascular': 'IXa. Cardiovasculares',
	'Xa. Upper Respiratory': 'Xa. Vías respiratorias superiores',
	'Xa. Acute Respiratory': 'Xa. Respiratorias agudas',
	'Xb. Lower Respiratory': 'Xb. Vías respiratorias inferiores',
	'Xb. Chronic Respiratory Diseases': 'Xb. Enfermedades respiratorias crónicas',
	'XIa. Digestive Diseases': 'XIa. Enfermedades digestivas',
	'XIIa. Skin Diseases': 'XIIa. Enfermedades de la piel',
	'XIIIa. Musculoskeletal': 'XIIIa. Osteomusculares',
	'XIVa. Genitourinary': 'XIVa. Genitourinarias',
	'XVa. Obstetric': 'XVa. Obstétricas',
	'XVIa. Perinatal': 'XVIa. Perinatales',
	'XVIIa. Congenital': 'XVIIa. Congénitas',
	'XVIIIa. Symptoms': 'XVIIIa. Síntomas',
	'XIXa. Injuries': 'XIXa. Traumatismos',
	'XXa. Other': 'XXa. Otras causas',
	// Enfermedades comunes
	'Cholera (A00)': 'Cólera (A00)',
	'Amebiasis (A06)': 'Amebiasis (A06)',
	'Typhoid and Paratyphoid fever (A01)': 'Fiebre tifoidea y paratifoidea (A01)',
	'Food poisoning (A05)': 'Intoxicación alimentaria (A05)',
	'Hepatitis A (B15)': 'Hepatitis A (B15)',
	'Measles (B05)': 'Sarampión (B05)',
	'Rubella (B06)': 'Rubéola (B06)',
	'Varicella (B01)': 'Varicela (B01)',
	'Pulmonary Tuberculosis (A15)': 'Tuberculosis pulmonar (A15)',
	'Extrapulmonary Tuberculosis (A17-A19)': 'Tuberculosis extrapulmonar (A17-A19)',
	'Essential hypertension (I10)': 'Hipertensión arterial esencial (I10)',
	'Acute nasopharyngitis (J00)': 'Rinofaringitis aguda (J00)',
	'Influenza (J09-J11)': 'Influenza (J09-J11)',
	'Pneumonia (J12-J18)': 'Neumonía (J12-J18)',
	'Asthma (J45)': 'Asma (J45)',
	'Diabetes mellitus (E10-E14)': 'Diabetes mellitus (E10-E14)',
	'Malnutrition (E40-E46)': 'Desnutrición (E40-E46)',
	'Dengue (A90-A91)': 'Dengue (A90-A91)',
	'Malaria (B50-B54)': 'Malaria (B50-B54)',
	'Chagas disease (B57)': 'Enfermedad de Chagas (B57)',
	'Syphilis (A50-A53)': 'Sífilis (A50-A53)',
	'Gonorrhea (A54)': 'Gonorrea (A54)',
	'HIV/AIDS (B20-B24)': 'VIH/SIDA (B20-B24)',
	// Respiratorias
	'Common cold (J00)': 'Resfriado común (J00)',
	'Acute sinusitis (J01)': 'Sinusitis aguda (J01)',
	'Acute pharyngitis (J02)': 'Faringitis aguda (J02)',
	'Acute tonsillitis (J03)': 'Amigdalitis aguda (J03)',
	'Acute bronchitis (J20)': 'Bronquitis aguda (J20)',
	'COPD (J44)': 'EPOC (J44)',
	// Digestivas
	'Gastritis and duodenitis (K29)': 'Gastritis y duodenitis (K29)',
	'Gastric and duodenal ulcer (K25-K27)': 'Úlcera gástrica y duodenal (K25-K27)',
	// Musculoesqueléticas
	'Low back pain (M54)': 'Lumbalgia (M54)',
	// Genitourinarias
	'Urinary tract infection (N39)': 'Infección urinaria (N39)',
	'Vaginitis (N76)': 'Vaginitis (N76)',
	// Traumatismos
	'Fractures (S02-S92)': 'Fracturas (S02-S92)',
	'Open wounds (S01-S91)': 'Heridas abiertas (S01-S91)',
	// Otras
	'Other causes': 'Otras causas',
	'Anemia (D50-D64)': 'Anemia (D50-D64)',
	'Obesity (E66)': 'Obesidad (E66)',
	'Conjunctivitis (H10)': 'Conjuntivitis (H10)',
	'Otitis media (H65-H66)': 'Otitis media (H65-H66)',
	'Ischemic heart disease (I20-I25)': 'Cardiopatía isquémica (I20-I25)',
	'Cerebrovascular disease (I60-I69)': 'Enfermedad cerebrovascular (I60-I69)',
	'Dermatitis (L20-L30)': 'Dermatitis (L20-L30)',
	'Scabies (B86)': 'Escabiosis (B86)',
	'Intestinal parasitosis (B65-B83)': 'Parasitosis intestinal (B65-B83)',
	'Leishmaniasis (B55)': 'Leishmaniasis (B55)',
	'Leptospirosis (A27)': 'Leptospirosis (A27)',
	'Rabies (A82)': 'Rabia (A82)',
	'Hepatitis B (B16)': 'Hepatitis B (B16)',
	'Hepatitis C (B17.1)': 'Hepatitis C (B17.1)',
	'Whooping cough (A37)': 'Tos ferina (A37)',
	'Diphtheria (A36)': 'Difteria (A36)',
	'Tetanus (A33-A35)': 'Tétanos (A33-A35)',
	'Mumps (B26)': 'Parotiditis (B26)',
	'Meningitis (G00-G03)': 'Meningitis (G00-G03)',
	'Epilepsy (G40)': 'Epilepsia (G40)'
};

// Traducir dinámicamente: busca en el diccionario, si no encuentra usa original
// También traduce patrones como "Diarrhea in children <1 year"
export function t(text: string): string {
	if (translations[text]) return translations[text];
	// Traducir patrones de diarrea
	if (text.startsWith('Diarrhea')) {
		return text
			.replace('Diarrhea in children', 'Diarrea en niños')
			.replace('Diarrhea', 'Diarrea')
			.replace('years', 'años')
			.replace('year', 'año');
	}
	return text;
}

export function formatReportDate(iso: string): string {
	try {
		return new Date(iso + 'T12:00:00').toLocaleDateString('es-VE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	} catch {
		return iso;
	}
}
