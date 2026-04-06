import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createPaciente } from '$lib/server/patients/patients.service.js';
import type { CreatePacienteInput } from '$lib/server/patients/patients.service.js';
import type { Sexo, EstadoCivil, RelacionUniversidad } from '$domain/patients/types.js';

function toEnum<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

const sexoValues = ['M', 'F'] as const;
const estadoCivilValues = ['soltero', 'casado', 'divorciado', 'viudo', 'union_libre'] as const;
const relacionUnivCodeMap = {
  P: 'profesor',
  E: 'empleado',
  O: 'tercero',
  F: 'tercero',
  B: 'estudiante',
  C: 'tercero',
  R: 'tercero',
  S: 'tercero',
  T: 'tercero',
  X: 'tercero'
} as const satisfies Record<string, RelacionUniversidad>;

const relacionUnivCodes = Object.keys(relacionUnivCodeMap) as Array<keyof typeof relacionUnivCodeMap>;

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const rawValues: Record<string, FormDataEntryValue> = Object.fromEntries(formData.entries());
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawValues)) {
      values[k] = typeof v === 'string' ? v : '';
    }

    const requiredFields = ['cedula', 'nombre', 'apellido', 'sexo', 'relacion_univ'];
    const fieldErrors: Record<string, string> = {};
    for (const field of requiredFields) {
      if (!values[field]) fieldErrors[field] = 'Campo requerido';
    }

    const sexo = toEnum<Sexo>(values.sexo, sexoValues);
    if (!sexo) fieldErrors.sexo = 'Valor inválido';
    const estado_civil = values.estado_civil ? toEnum<EstadoCivil>(values.estado_civil, estadoCivilValues) : undefined;
    if (values.estado_civil && !estado_civil) fieldErrors.estado_civil = 'Valor inválido';
    const relacionUnivCode = toEnum(values.relacion_univ, relacionUnivCodes);
    if (!relacionUnivCode) fieldErrors.relacion_univ = 'Valor inválido';
    const relacion_univ = relacionUnivCode ? relacionUnivCodeMap[relacionUnivCode] : undefined;

    if (Object.keys(fieldErrors).length > 0) {
      return fail(400, { error: 'Por favor completa los campos obligatorios.', fieldErrors, values });
    }

    const input: CreatePacienteInput = {
      cedula: values.cedula,
      nombre: values.nombre,
      apellido: values.apellido,
      sexo,
      fecha_nacimiento: values.fecha_nacimiento || undefined,
      telefono: values.telefono || undefined,
      direccion_habitacion: values.direccion_habitacion || undefined,
      estado_civil,
      relacion_univ: relacion_univ as RelacionUniversidad,
      datos_medicos: {},
    };

    try {
      await createPaciente(input);
      return { success: true, fieldErrors: {} as Record<string, string> };
    } catch (e: unknown) {
      console.error('[patients/new] Error al registrar paciente:', e);
      return fail(500, { error: 'Error al registrar paciente.', fieldErrors: {} as Record<string, string>, values });
    }
  }
};
