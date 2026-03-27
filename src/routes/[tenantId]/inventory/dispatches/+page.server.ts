import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as dispatchesService from '$lib/server/inventory/dispatches.service.js';
import * as prescriptionsService from '$lib/server/inventory/prescriptions.service.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { DispatchFilters } from '$shared/types/inventory.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_DISPATCH);

	const filters: DispatchFilters = {
		prescription_number: url.searchParams.get('prescription_number') ?? undefined,
		status: (url.searchParams.get('status') as DispatchFilters['status']) ?? undefined,
		date_from: url.searchParams.get('date_from') ?? undefined,
		date_to: url.searchParams.get('date_to') ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: 25
	};

	// Si hay un número de receta para buscar, también cargamos la validación
	const prescriptionNumber = url.searchParams.get('validate_prescription');
	const [dispatches, validation] = await Promise.all([
		dispatchesService.getDispatches(filters),
		prescriptionNumber
			? prescriptionsService.getPrescriptionByNumber(prescriptionNumber)
				.then((p) => p ? dispatchesService.validateDispatch(p.id) : null)
				.catch(() => null)
			: Promise.resolve(null)
	]);

	return { dispatches, filters, validation, prescriptionNumber };
};

export const actions: Actions = {
	validarDespacho: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'validarDespacho');

		const fd = await request.formData();
		const prescription_number = String(fd.get('prescription_number') ?? '').trim();
		if (!prescription_number) return fail(400, { error: 'Número de receta requerido' });

		try {
			const prescription = await prescriptionsService.getPrescriptionByNumber(prescription_number);
			if (!prescription) return fail(404, { error: 'Receta no encontrada' });

			const validation = await dispatchesService.validateDispatch(prescription.id);
			return { validation, prescription };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Receta no encontrada' });
			return fail(500, { error: 'Error al validar receta' });
		}
	},

	ejecutarDespacho: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'ejecutarDespacho');

		const fd = await request.formData();
		const prescription_id = String(fd.get('prescription_id') ?? '');
		if (!prescription_id) return fail(400, { error: 'ID de receta requerido' });

		const pharmacistId = locals.user?.pharmacistId ?? locals.user?.id ?? '';

		try {
			const dispatch = await dispatchesService.executeDispatch({
				prescription_id,
				pharmacist_id: pharmacistId
			});
			return { dispatched: true, dispatch };
		} catch (e: unknown) {
			const msg = (e as Error).message ?? '';
			if (msg.includes('backend real')) {
				return fail(503, { error: 'El despacho requiere conexión al backend. Disponible en producción.' });
			}
			return fail(500, { error: 'Error al ejecutar despacho' });
		}
	},

	cancelarDespacho: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'cancelarDespacho');

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const reason = String(fd.get('reason') ?? '').trim();
		if (!id) return fail(400, { error: 'ID de despacho requerido' });
		if (!reason) return fail(400, { error: 'Motivo de cancelación requerido' });

		try {
			await dispatchesService.cancelDispatch(id, reason);
			return { cancelled: true };
		} catch (e: unknown) {
			const status = (e as { status?: number }).status;
			if (status === 404) return fail(404, { error: 'Despacho no encontrado' });
			return fail(500, { error: 'Error al cancelar despacho' });
		}
	}
};
