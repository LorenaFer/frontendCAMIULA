import type { FieldCondition } from '$domain/medical-records/form-schema.js';

/**
 * Obtiene un valor anidado usando dot-path.
 * getNestedValue({ a: { b: 1 } }, "a.b") → 1
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	const keys = path.split('.');
	let current: unknown = obj;
	for (const key of keys) {
		if (current == null || typeof current !== 'object') return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return current;
}

/**
 * Establece un valor anidado usando dot-path (inmutable — retorna nuevo objeto).
 * setNestedValue({ a: { b: 1 } }, "a.b", 2) → { a: { b: 2 } }
 */
export function setNestedValue(
	obj: Record<string, unknown>,
	path: string,
	value: unknown
): Record<string, unknown> {
	const keys = path.split('.');
	if (keys.length === 1) {
		return { ...obj, [keys[0]]: value };
	}

	const [first, ...rest] = keys;
	const nested = (obj[first] ?? {}) as Record<string, unknown>;
	return {
		...obj,
		[first]: setNestedValue(
			typeof nested === 'object' && nested !== null ? nested : {},
			rest.join('.'),
			value
		)
	};
}

/**
 * Evalúa una condición de visibilidad contra los datos del formulario.
 */
export function evaluateCondition(
	condition: FieldCondition,
	formData: Record<string, unknown>
): boolean {
	const fieldValue = getNestedValue(formData, condition.field);
	const { operator, value: compareValue } = condition;

	switch (operator) {
		case 'truthy':
			return !!fieldValue;
		case 'falsy':
			return !fieldValue;
		case 'eq':
			return fieldValue === compareValue;
		case 'neq':
			return fieldValue !== compareValue;
		case 'gt':
			return typeof fieldValue === 'number' && fieldValue > (compareValue as number);
		case 'lt':
			return typeof fieldValue === 'number' && fieldValue < (compareValue as number);
		case 'gte':
			return typeof fieldValue === 'number' && fieldValue >= (compareValue as number);
		case 'lte':
			return typeof fieldValue === 'number' && fieldValue <= (compareValue as number);
		case 'in':
			return Array.isArray(compareValue) && compareValue.includes(fieldValue);
		case 'not_in':
			return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
		default:
			return true;
	}
}

/**
 * Evalúa un array de condiciones (lógica AND — todas deben cumplirse).
 * Si no hay condiciones, retorna true (siempre visible).
 */
export function evaluateConditions(
	conditions: FieldCondition[] | undefined,
	formData: Record<string, unknown>
): boolean {
	if (!conditions || conditions.length === 0) return true;
	return conditions.every((c) => evaluateCondition(c, formData));
}
