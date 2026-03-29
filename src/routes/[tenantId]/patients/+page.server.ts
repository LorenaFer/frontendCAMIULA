import type { PageServerLoad } from './$types';
import { findFullByCedula, findFullByNHM } from '$lib/server/pacientes.service';
import { findByPaciente, findById as findHistoriaById } from '$lib/server/historias.service';

type SearchType = 'cedula' | 'nhm';

type TimelineCategory = 'consulta' | 'laboratorio' | 'vacunacion' | 'administrativo';

interface TimelineEntry {
	id: string;
	fecha: string;
	titulo: string;
	detalle: string;
	categoria: TimelineCategory;
	formulario?: {
		motivoConsulta?: string;
		anamnesis?: string;
		diagnostico?: string;
		tratamiento?: string;
		indicaciones?: string;
	};
}

interface PharmacyDelivery {
	id: string;
	fecha: string;
	medicamento: string;
	dosis: string;
	cantidad: string;
	estado: 'entregado' | 'pendiente';
}

function fallbackAdminByPatient(patientId: string): string {
	const byPatient: Record<string, string> = {
		'pac-001': 'Ana Torres',
		'pac-002': 'Carlos Rivas',
		'pac-003': 'Mariana Perez'
	};

	return byPatient[patientId] ?? 'Administrativo no especificado';
}

function adminDisplayName(value: string | undefined, patientId: string): string {
	const username = value?.trim();
	if (!username) return fallbackAdminByPatient(patientId);

	const byUsername: Record<string, string> = {
		portal_publico: 'Portal Publico',
		analista_01: 'Ana Torres',
		doctor_emergencia: 'Dr. de Emergencia'
	};

	return byUsername[username] ?? username;
}

function pharmacyDeliveriesForPatient(patientId: string): PharmacyDelivery[] {
	const byPatient: Record<string, PharmacyDelivery[]> = {
		'pac-001': [
			{
				id: 'farm-001',
				fecha: '2025-03-10',
				medicamento: 'Losartan 50 mg',
				dosis: '1 tableta cada 12 horas',
				cantidad: '30 tabletas',
				estado: 'entregado'
			},
			{
				id: 'farm-002',
				fecha: '2025-02-01',
				medicamento: 'Paracetamol 500 mg',
				dosis: '1 tableta cada 8 horas por 3 dias',
				cantidad: '9 tabletas',
				estado: 'entregado'
			}
		],
		'pac-002': [
			{
				id: 'farm-003',
				fecha: '2025-03-02',
				medicamento: 'Loratadina 10 mg',
				dosis: '1 tableta diaria por 7 dias',
				cantidad: '7 tabletas',
				estado: 'entregado'
			}
		],
		'pac-003': [
			{
				id: 'farm-004',
				fecha: '2025-01-18',
				medicamento: 'Diclofenac gel',
				dosis: 'Aplicar 2 veces al dia',
				cantidad: '1 tubo',
				estado: 'entregado'
			}
		]
	};

	return byPatient[patientId] ?? [];
}

function normalizeSearchType(value: string | null): SearchType {
	return value === 'nhm' ? 'nhm' : 'cedula';
}

export const load: PageServerLoad = async ({ url }) => {
	const searchType = normalizeSearchType(url.searchParams.get('searchType'));
	const query = url.searchParams.get('query')?.trim() ?? '';
	const searched = query.length > 0;

	let patient = null;
	let validationMessage: string | undefined;
	let medicalSnapshot: {
		tipoSangre: string;
		alergias: string[];
		condiciones: string[];
	} | null = null;
	let registrationMeta: {
		administrativo: string;
	} | null = null;
	let historyTimeline: TimelineEntry[] = [];
	let pharmacyDeliveries: PharmacyDelivery[] = [];

	if (searched) {
		let fullPatient = null;

		if (searchType === 'nhm') {
			const nhm = Number(query);

			if (!Number.isInteger(nhm) || nhm <= 0) {
				validationMessage = 'El número de historia debe ser un entero positivo.';
			} else {
				fullPatient = await findFullByNHM(nhm);
			}
		} else {
			fullPatient = await findFullByCedula(query);
		}

		if (fullPatient) {
			const createdBy = (fullPatient as { created_by?: string }).created_by;
			const administrativo = adminDisplayName(createdBy, fullPatient.id);

			patient = {
				id: fullPatient.id,
				nhm: fullPatient.nhm,
				cedula: fullPatient.cedula,
				nombre: fullPatient.nombre,
				apellido: fullPatient.apellido,
				edad: fullPatient.edad,
				relacion_univ: fullPatient.relacion_univ,
				es_nuevo: fullPatient.es_nuevo
			};

			medicalSnapshot = {
				tipoSangre: fullPatient.datos_medicos?.tipo_sangre || 'No registrado',
				alergias: fullPatient.datos_medicos?.alergias ?? [],
				condiciones: fullPatient.datos_medicos?.condiciones ?? []
			};

			registrationMeta = {
				administrativo
			};

			const condiciones = fullPatient.datos_medicos?.condiciones ?? [];
			const alergias = fullPatient.datos_medicos?.alergias ?? [];

			const previousHistories = await findByPaciente(fullPatient.id, { limit: 8 });

			const historyEvents: TimelineEntry[] = await Promise.all(
				previousHistories.map(async (entry) => {
					const titulo = entry.diagnostico_descripcion?.trim()
						? entry.diagnostico_descripcion
						: `Consulta de ${entry.especialidad}`;
					const detalle = `${entry.especialidad} • ${entry.doctor_nombre}`;
					const historia = await findHistoriaById(entry.id);
					const evaluacion = historia?.evaluacion;

					return {
						id: entry.id,
						fecha: entry.fecha,
						titulo,
						detalle,
						categoria: 'consulta',
						formulario: evaluacion
							? {
								motivoConsulta: evaluacion.motivo_consulta,
								anamnesis: evaluacion.anamnesis,
								diagnostico: evaluacion.diagnostico?.descripcion,
								tratamiento: evaluacion.tratamiento,
								indicaciones: evaluacion.indicaciones
							}
							: undefined
					};
				})
			);

			const syntheticEvents: TimelineEntry[] = [
				{
					id: `adm-${fullPatient.id}`,
					fecha: fullPatient.created_at.slice(0, 10),
					titulo: 'Registro del paciente en sistema',
					detalle: `Apertura de expediente clinico por ${administrativo}`,
					categoria: 'administrativo'
				}
			];

			if (condiciones.length > 0) {
				syntheticEvents.push({
					id: `cond-${fullPatient.id}`,
					fecha: fullPatient.created_at.slice(0, 10),
					titulo: 'Condiciones cronicas registradas',
					detalle: condiciones.join(', '),
					categoria: 'laboratorio'
				});
			}

			if (alergias.length > 0) {
				syntheticEvents.push({
					id: `aler-${fullPatient.id}`,
					fecha: fullPatient.created_at.slice(0, 10),
					titulo: 'Alergias documentadas',
					detalle: alergias.join(', '),
					categoria: 'vacunacion'
				});
			}

			historyTimeline = [...historyEvents, ...syntheticEvents]
				.sort((a, b) => b.fecha.localeCompare(a.fecha))
				.slice(0, 10);

			pharmacyDeliveries = pharmacyDeliveriesForPatient(fullPatient.id).sort((a, b) =>
				b.fecha.localeCompare(a.fecha)
			);

		}
	}

	return {
		filters: {
			searchType,
			query
		},
		patient,
		medicalSnapshot,
		registrationMeta,
		historyTimeline,
		pharmacyDeliveries,
		searched,
		validationMessage
	};
};