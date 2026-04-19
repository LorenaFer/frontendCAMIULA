import type { FieldValidation, FormFieldSchema, FormSection } from '$domain/medical-records/form-schema.js';
import { evaluateConditions } from './field-helpers.js';

/**
 * Valida un valor contra las reglas de FieldValidation.
 * Retorna string con mensaje de error, o null si es válido.
 */
export function validateFieldValue(
	value: unknown,
	validation: FieldValidation | undefined,
	label: string
): string | null {
	if (!validation) return null;

	const isEmpty = value === undefined || value === null || value === '';

	if (validation.required && isEmpty) {
		return `${label} es requerido`;
	}

	// Si el campo está vacío y no es requerido, no validar más
	if (isEmpty) return null;

	if (typeof value === 'number') {
		if (validation.min !== undefined && value < validation.min) {
			return `${label} debe ser al menos ${validation.min}`;
		}
		if (validation.max !== undefined && value > validation.max) {
			return `${label} debe ser máximo ${validation.max}`;
		}
	}

	if (typeof value === 'string') {
		if (validation.minLength !== undefined && value.length < validation.minLength) {
			return `${label} debe tener al menos ${validation.minLength} caracteres`;
		}
		if (validation.maxLength !== undefined && value.length > validation.maxLength) {
			return `${label} debe tener máximo ${validation.maxLength} caracteres`;
		}
		if (validation.pattern) {
			const regex = new RegExp(validation.pattern);
			if (!regex.test(value)) {
				return validation.patternMessage ?? `${label} tiene un formato inválido`;
			}
		}
	}

	return null;
}

/**
 * Recorre todas las secciones/grupos/campos del schema y valida los visibles.
 * Retorna un Record<fieldKey, errorMessage> con todos los errores encontrados.
 */
export function validateAllFields(
	sections: FormSection[],
	data: Record<string, unknown>
): Record<string, string> {
	const errors: Record<string, string> = {};

	for (const section of sections) {
		if (!evaluateConditions(section.conditions, data)) continue;

		for (const group of section.groups) {
			if (!evaluateConditions(group.conditions, data)) continue;

			for (const field of group.fields) {
				if (!evaluateConditions(field.conditions, data)) continue;

				const error = validateFieldValue(
					getFieldValue(data, field),
					field.validation,
					field.label
				);
				if (error) {
					errors[field.key] = error;
				}
			}
		}
	}

	return errors;
}

/** Helper para obtener el valor de un campo desde los datos usando su key */
function getFieldValue(data: Record<string, unknown>, field: FormFieldSchema): unknown {
	const keys = field.key.split('.');
	let current: unknown = data;
	for (const key of keys) {
		if (current == null || typeof current !== 'object') return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return current;
}
