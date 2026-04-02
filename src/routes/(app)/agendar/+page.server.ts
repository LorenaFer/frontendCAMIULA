import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import * as pacientesService from '$lib/server/pacientes.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';
import * as citasService from '$lib/server/citas.service.js';
import { computeAvailableSlots, getMinBookingDate, isDateAllowed } from '$lib/server/slots.service.js';

export const load: PageServerLoad = async () => {
	const [doctores, especialidades] = await Promise.all([
		doctoresService.getDoctorOptions(),
		doctoresService.getEspecialidades()
	]);

	return {
		doctores,
		especialidades,
		minDate: getMinBookingDate()
	};
};

export const actions: Actions = {
	buscarPaciente: async ({ request }) => {
		const fd = await request.formData();
		const query = String(fd.get('query') ?? '').trim();
		const queryType = String(fd.get('queryType') ?? '');

		if (!query) return fail(400, { error: 'Ingrese su cédula o NHM' });
		if (queryType !== 'nhm' && queryType !== 'cedula') {
			return fail(400, { error: 'Tipo de búsqueda inválido' });
		}

		if (queryType === 'nhm') {
			const nhm = parseInt(query, 10);
			if (isNaN(nhm) || nhm < 0 || nhm > 100_000) {
				return fail(400, { error: 'NHM debe ser un número entre 0 y 100.000' });
			}
			const paciente = await pacientesService.findByNHM(nhm);
			return { found: !!paciente, paciente: paciente ?? undefined };
		}

		const paciente = await pacientesService.findByCedula(query);
		return { found: !!paciente, paciente: paciente ?? undefined, query };
	},

	registrarPaciente: async ({ request }) => {
		const fd = await request.formData();
		const nombre = String(fd.get('nombre') ?? '').trim();
		const apellido = String(fd.get('apellido') ?? '').trim();
		const cedula = String(fd.get('cedula') ?? '').trim();
		const relacion_univ = String(fd.get('relacion_univ') ?? '');
		const parentesco = String(fd.get('parentesco') ?? '') || undefined;
		const titular_cedula = String(fd.get('titular_cedula') ?? '').trim() || undefined;
		const tipo_sangre = String(fd.get('tipo_sangre') ?? '').trim() || undefined;
		const alergias = String(fd.get('alergias') ?? '');
		const numero_contacto = String(fd.get('numero_contacto') ?? '').trim() || undefined;

		// Validaciones
		if (!nombre || !apellido || !cedula) {
			return fail(400, { error: 'Nombre, apellido y cédula son requeridos' });
		}
		if (!['empleado', 'estudiante', 'profesor', 'tercero'].includes(relacion_univ)) {
			return fail(400, { error: 'Relación con la universidad inválida' });
		}
		if (relacion_univ === 'tercero') {
			if (!parentesco || !['hijo', 'padre', 'madre'].includes(parentesco)) {
				return fail(400, { field: 'parentesco', error: 'Parentesco requerido para familiares' });
			}
			if (!titular_cedula) {
				return fail(400, { field: 'titular_cedula', error: 'Cédula del titular requerida' });
			}
		}

		// Verificar unicidad de cédula
		const existente = await pacientesService.findByCedula(cedula);
		if (existente) {
			return fail(400, { field: 'cedula', error: 'Esta cédula ya está registrada en el sistema' });
		}

		// Verificar titular si es tercero
		let titular_nhm: number | undefined;
		if (relacion_univ === 'tercero' && titular_cedula) {
			const titular = await pacientesService.findByCedula(titular_cedula);
			if (!titular) {
				return fail(400, { field: 'titular_cedula', error: 'No se encontró el titular universitario con esa cédula' });
			}
			titular_nhm = titular.nhm;
		}

		const paciente = await pacientesService.createPaciente({
			cedula,
			nombre,
			apellido,
			relacion_univ: relacion_univ as any,
			parentesco: parentesco as any,
			titular_nhm,
			datos_medicos: {
				tipo_sangre,
				alergias: alergias ? alergias.split(',').map((a) => a.trim()).filter(Boolean) : [],
				numero_contacto
			}
		});

		return { registered: true, paciente: { id: paciente.id, nhm: paciente.nhm, nombre: paciente.nombre, apellido: paciente.apellido, relacion_univ: paciente.relacion_univ, es_nuevo: paciente.es_nuevo } };
	},

	obtenerSlots: async ({ request }) => {
		const fd = await request.formData();
		const doctorId = String(fd.get('doctorId') ?? '').trim();
		const fecha = String(fd.get('fecha') ?? '');
		const esNuevo = String(fd.get('esNuevo') ?? '') === 'true';

		if (!fecha || !isDateAllowed(fecha)) {
			return fail(400, { error: 'Fecha inválida — debe ser al menos 2 días después de hoy' });
		}
		if (!doctorId) {
			return fail(400, { error: 'Doctor inválido' });
		}

		const fechaDate = new Date(fecha + 'T00:00:00');
		// getDay(): 0=Dom, 1=Lun … convertir a Lunes=1
		const dayOfWeek = fechaDate.getDay() === 0 ? 7 : fechaDate.getDay();

		const [disponibilidad, tieneExcepcion, citasExistentes] = await Promise.all([
			doctoresService.getDisponibilidad(doctorId, dayOfWeek),
			doctoresService.hasExcepcion(doctorId, fecha),
			citasService.getCitasByDoctorFecha(doctorId, fecha)
		]);

		if (tieneExcepcion || disponibilidad.length === 0) {
			return { slots: [], duracion: 30, es_primera_vez: esNuevo, mensaje: 'El doctor no tiene disponibilidad ese día' };
		}

		const duracion: 30 | 60 = esNuevo ? 60 : 30;
		const slots = computeAvailableSlots(disponibilidad, citasExistentes, duracion);

		return { slots, duracion, es_primera_vez: esNuevo };
	},

	obtenerFechasDisponibles: async ({ request }) => {
		const fd = await request.formData();
		const doctorId = String(fd.get('doctorId') ?? '').trim();
		const year = parseInt(String(fd.get('year') ?? ''), 10);
		const month = parseInt(String(fd.get('month') ?? ''), 10);

		if (!doctorId || isNaN(year) || isNaN(month)) {
			return fail(400, { error: 'Parámetros inválidos' });
		}

		const minDate = getMinBookingDate();
		const daysInMonth = new Date(year, month, 0).getDate();

		// Una sola consulta batch por disponibilidad y citas del mes
		const [allDisponibilidad, citasMes] = await Promise.all([
			doctoresService.getAllDisponibilidad(doctorId),
			citasService.getCitasByDoctorMes(doctorId, year, month)
		]);

		const availableDates: string[] = [];
		const mo = String(month).padStart(2, '0');

		for (let d = 1; d <= daysInMonth; d++) {
			const fecha = `${year}-${mo}-${String(d).padStart(2, '0')}`;
			if (fecha < minDate) continue;

			// Convertir getDay() (0=Dom) a 1=Lun … 7=Dom
			const dow = new Date(fecha + 'T12:00:00').getDay();
			const dayOfWeek = dow === 0 ? 7 : dow;

			const disponibilidad = allDisponibilidad.filter((d) => d.day_of_week === dayOfWeek);
			if (disponibilidad.length === 0) continue;

			const citasDelDia = citasMes.filter((c) => c.fecha === fecha);
			const slots = computeAvailableSlots(disponibilidad, citasDelDia, 30);
			if (slots.some((s) => s.disponible)) {
				availableDates.push(fecha);
			}
		}

		return { availableDates };
	},

	confirmarCita: async ({ request }) => {
		const fd = await request.formData();
		const pacienteId = String(fd.get('pacienteId') ?? '').trim();
		const doctorId = String(fd.get('doctorId') ?? '').trim();
		const especialidadId = String(fd.get('especialidadId') ?? '').trim();
		const fecha = String(fd.get('fecha') ?? '');
		const hora_inicio = String(fd.get('hora_inicio') ?? '');
		const hora_fin = String(fd.get('hora_fin') ?? '');
		const duracion_min = parseInt(String(fd.get('duracion_min') ?? '30'), 10) as 30 | 60;
		const es_primera_vez = String(fd.get('es_primera_vez') ?? '') === 'true';
		const motivo_consulta = String(fd.get('motivo_consulta') ?? '').trim() || undefined;

		// Validaciones
		if (!pacienteId || !doctorId || !especialidadId || !fecha || !hora_inicio || !hora_fin) {
			return fail(400, { error: 'Faltan datos para confirmar la cita' });
		}
		if (!isDateAllowed(fecha)) {
			return fail(400, { error: 'Fecha inválida — no puede agendar para hoy ni mañana' });
		}

		// Verificar disponibilidad del slot (guard contra race condition)
		const ocupado = await citasService.isSlotOccupied(doctorId, fecha, hora_inicio);
		if (ocupado) {
			return fail(409, { error: 'Este horario ya fue tomado. Por favor seleccione otro.' });
		}

		const cita = await citasService.createCita({
			paciente_id: pacienteId,
			doctor_id: doctorId,
			especialidad_id: especialidadId,
			fecha,
			hora_inicio,
			hora_fin,
			duracion_min,
			es_primera_vez,
			motivo_consulta,
			created_by: 'portal_publico'
		});

		const confirmationCode = `CITA-${String(cita.id).padStart(6, '0')}`;
		redirect(303, `/agendar/confirmacion?citaId=${cita.id}&code=${confirmationCode}`);
	}
};
