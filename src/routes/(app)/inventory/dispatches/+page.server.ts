import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import * as dispatchesService from '$lib/server/inventory/dispatches.service.js';
import * as prescriptionsService from '$lib/server/inventory/prescriptions.service.js';
import { ApiError } from '$lib/server/api.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { DispatchFilters } from '$domain/inventory/types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_DISPATCH);

	const filters: DispatchFilters = {
		prescription_number: url.searchParams.get('prescription_number') ?? undefined,
		status: (url.searchParams.get('status') as DispatchFilters['status']) ?? undefined,
		date_from: url.searchParams.get('date_from') ?? undefined,
		date_to: url.searchParams.get('date_to') ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size'))) ? Number(url.searchParams.get('page_size')) : 25
	};

	// Si hay un número de receta para buscar, también cargamos la validación
	const prescriptionNumber = url.searchParams.get('validate_prescription');
	const [dispatches, validation] = await Promise.all([
		dispatchesService.getDispatches(filters).catch(() => ({
			data: [], total: 0, page: 1, pageSize: 25, hasNext: false
		})),
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
			if (!prescription) return fail(404, { error: `No existe ninguna receta con el número "${prescription_number}".` });

			const validation = await dispatchesService.validateDispatch(prescription.id);
			return { validation, prescription };
		} catch (e: unknown) {
			if (e instanceof ApiError) {
				return fail(e.status || 500, { error: e.detail });
			}
			const status = (e as { status?: number }).status;
			const message = (e as Error).message;
			if (status && message) return fail(status, { error: message });
			return fail(500, { error: 'Error al validar receta. Intente nuevamente.' });
		}
	},

	ejecutarDespacho: async ({ request, locals }) => {
		assertActionPermission(locals.user, 'ejecutarDespacho');

		const fd = await request.formData();
		const prescription_id = String(fd.get('prescription_id') ?? '');
		if (!prescription_id) return fail(400, { error: 'ID de receta requerido' });

		const pharmacistId = locals.user?.pharmacistId ?? locals.user?.id ?? 'unknown';

		try {
			const dispatch = await dispatchesService.executeDispatch({
				prescription_id,
				pharmacist_id: pharmacistId
			});
			return { dispatched: true, dispatch };
		} catch (e: unknown) {
			if (e instanceof ApiError) {
				return fail(e.status || 500, { error: e.detail });
			}
			const msg = (e as Error).message ?? '';
			if (msg.includes('backend real')) {
				return fail(503, { error: 'El despacho requiere conexión al backend. Disponible en producción.' });
			}
			return fail(500, { error: msg || 'Error al ejecutar despacho. Intente nuevamente.' });
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
			if (e instanceof ApiError) {
				return fail(e.status || 500, { error: e.detail });
			}
			const status = (e as { status?: number }).status;
			const message = (e as Error).message;
			if (status && message) return fail(status, { error: message });
			return fail(500, { error: 'Error al cancelar despacho. Intente nuevamente.' });
		}
	}
};
