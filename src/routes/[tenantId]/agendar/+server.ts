// ============================================================
// REST API para el wizard de agendamiento.
// Devuelve { status: 'success'|'error', message, data }
// con HTTP status codes correctos (200, 400, 409, 500).
// ============================================================

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as pacientesService from '$lib/server/pacientes.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';
import * as citasService from '$lib/server/citas.service.js';
import { computeAvailableSlots, getMinBookingDate, isDateAllowed } from '$lib/server/slots.service.js';

type ApiResponse<T = unknown> =
	| { status: 'success'; message: string; data: T }
	| { status: 'error'; message: string; data?: unknown };

function ok<T>(data: T, message = 'OK'): Response {
	return json({ status: 'success', message, data } satisfies ApiResponse<T>, { status: 200 });
}

function err(message: string, httpStatus = 400, data?: unknown): Response {
	return json({ status: 'error', message, data } satisfies ApiResponse, { status: httpStatus });
}

export const POST: RequestHandler = async ({ request, params }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return err('Cuerpo de solicitud inválido — se esperaba JSON', 400);
	}

	const { action } = body;

	switch (action) {
		// ── Buscar paciente ──────────────────────────────────────
		case 'buscarPaciente': {
			const query = String(body.query ?? '').trim();
			const queryType = String(body.queryType ?? '');

			if (!query) return err('Ingrese su cédula o NHM');
			if (queryType !== 'nhm' && queryType !== 'cedula') return err('Tipo de búsqueda inválido');

			if (queryType === 'nhm') {
				const nhm = parseInt(query, 10);
				if (isNaN(nhm) || nhm < 0 || nhm > 100_000)
					return err('NHM debe ser un número entre 0 y 100.000');
				const paciente = await pacientesService.findByNHM(nhm);
				return ok({ found: !!paciente, paciente: paciente ?? null });
			}

			const paciente = await pacientesService.findByCedula(query);
			return ok({ found: !!paciente, paciente: paciente ?? null });
		}

		// ── Registrar paciente ───────────────────────────────────
		case 'registrarPaciente': {
			const nombre = String(body.nombre ?? '').trim();
			const apellido = String(body.apellido ?? '').trim();
			const cedula = String(body.cedula ?? '').trim();
			const relacion_univ = String(body.relacion_univ ?? '');
			const parentesco = String(body.parentesco ?? '') || undefined;
			const titular_cedula = String(body.titular_cedula ?? '').trim() || undefined;
			const tipo_sangre = String(body.tipo_sangre ?? '').trim() || undefined;
			const alergias = String(body.alergias ?? '');
			const numero_contacto = String(body.numero_contacto ?? '').trim() || undefined;

			if (!nombre || !apellido || !cedula)
				return err('Nombre, apellido y cédula son requeridos');
			if (!['empleado', 'estudiante', 'profesor', 'tercero'].includes(relacion_univ))
				return err('Relación con la universidad inválida');
			if (relacion_univ === 'tercero') {
				if (!parentesco || !['hijo', 'padre', 'madre'].includes(parentesco))
					return err('Parentesco requerido para familiares (hijo, padre, madre)');
				if (!titular_cedula)
					return err('Cédula del titular requerida');
			}

			const existente = await pacientesService.findByCedula(cedula);
			if (existente) return err('Esta cédula ya está registrada en el sistema', 409);

			let titular_nhm: number | undefined;
			if (relacion_univ === 'tercero' && titular_cedula) {
				const titular = await pacientesService.findByCedula(titular_cedula);
				if (!titular) return err('No se encontró el titular universitario con esa cédula', 404);
				titular_nhm = titular.nhm;
			}

			const paciente = await pacientesService.createPaciente({
				cedula, nombre, apellido,
				relacion_univ: relacion_univ as 'empleado' | 'estudiante' | 'profesor' | 'tercero',
				parentesco: parentesco as 'hijo' | 'padre' | 'madre' | undefined,
				titular_nhm,
				datos_medicos: {
					tipo_sangre,
					alergias: alergias ? alergias.split(',').map((a) => a.trim()).filter(Boolean) : [],
					numero_contacto
				}
			});

			return ok({
				paciente: {
					id: paciente.id, nhm: paciente.nhm,
					nombre: paciente.nombre, apellido: paciente.apellido,
					relacion_univ: paciente.relacion_univ, es_nuevo: paciente.es_nuevo
				}
			}, 'Paciente registrado exitosamente');
		}

		// ── Obtener slots ────────────────────────────────────────
		case 'obtenerSlots': {
			const doctorId = Number(body.doctorId);
			const fecha = String(body.fecha ?? '');
			const esNuevo = body.esNuevo === true || body.esNuevo === 'true';

			if (!fecha || !isDateAllowed(fecha))
				return err('Fecha inválida — debe ser al menos 2 días después de hoy');
			if (!doctorId || isNaN(doctorId))
				return err('Doctor inválido');

			const dow = new Date(fecha + 'T12:00:00').getDay();
			const dayOfWeek = dow === 0 ? 7 : dow;

			const [disponibilidad, tieneExcepcion, citasExistentes] = await Promise.all([
				doctoresService.getDisponibilidad(doctorId, dayOfWeek),
				doctoresService.hasExcepcion(doctorId, fecha),
				citasService.getCitasByDoctorFecha(doctorId, fecha)
			]);

			if (tieneExcepcion || disponibilidad.length === 0) {
				return ok({ slots: [], duracion: 30 }, 'El doctor no tiene disponibilidad ese día');
			}

			const duracion: 30 | 60 = esNuevo ? 60 : 30;
			const slots = computeAvailableSlots(disponibilidad, citasExistentes, duracion);

			return ok({ slots, duracion });
		}

		// ── Confirmar cita ───────────────────────────────────────
		case 'confirmarCita': {
			const pacienteId = Number(body.pacienteId);
			const doctorId = Number(body.doctorId);
			const especialidadId = Number(body.especialidadId);
			const fecha = String(body.fecha ?? '');
			const hora_inicio = String(body.hora_inicio ?? '');
			const hora_fin = String(body.hora_fin ?? '');
			const duracion_min = Number(body.duracion_min ?? 30) as 30 | 60;
			const es_primera_vez = body.es_primera_vez === true || body.es_primera_vez === 'true';
			const motivo_consulta = String(body.motivo_consulta ?? '').trim() || undefined;

			if (!pacienteId || !doctorId || !especialidadId || !fecha || !hora_inicio || !hora_fin)
				return err('Faltan datos para confirmar la cita');
			if (!isDateAllowed(fecha))
				return err('Fecha inválida — no puede agendar para hoy ni mañana');

			const ocupado = await citasService.isSlotOccupied(doctorId, fecha, hora_inicio);
			if (ocupado)
				return err('Este horario ya fue tomado. Por favor seleccione otro.', 409);

			const cita = await citasService.createCita({
				paciente_id: pacienteId, doctor_id: doctorId, especialidad_id: especialidadId,
				fecha, hora_inicio, hora_fin, duracion_min, es_primera_vez,
				motivo_consulta, created_by: 'portal_publico'
			});

			const confirmationCode = `CITA-${String(cita.id).padStart(6, '0')}`;
			const redirectUrl = `/${params.tenantId}/agendar/confirmacion?citaId=${cita.id}&code=${confirmationCode}`;

			return ok({ citaId: cita.id, confirmationCode, redirectUrl }, 'Cita confirmada exitosamente');
		}

		default:
			return err(`Acción desconocida: ${action}`, 400);
	}
};
