import type { PageServerLoad } from './$types';
import * as batchesService from '$lib/server/inventory/batches.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import { assertPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { BatchFilters, Batch, MedicationOption } from '$shared/types/inventory.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);

	const view = (url.searchParams.get('view') ?? 'stock') as 'stock' | 'batches';

	const filters: BatchFilters = {
		medication_id: url.searchParams.get('medication_id') ?? undefined,
		status: (url.searchParams.get('status') as BatchFilters['status']) ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size'))) ? Number(url.searchParams.get('page_size')) : 25
	};

	const [batchesRaw, stockItems, medicationOptions] = await Promise.all([
		view === 'batches' ? batchesService.getBatches(filters).catch(() => ({ data: [] as Batch[], total: 0, page: 1, pageSize: 25, hasNext: false })) : Promise.resolve(null),
		view === 'stock'   ? batchesService.getCurrentStock().catch(() => [])   : Promise.resolve(null),
		medicationsService.getMedicationOptions().catch(() => [] as MedicationOption[])
	]);

	// Resolver FKs de batches — el backend no trae medication nested
	const medMap = new Map(medicationOptions.map(m => [m.id, m]));
	const batches = batchesRaw ? {
		...batchesRaw,
		data: batchesRaw.data.map(b => {
			const raw = b as unknown as Record<string, unknown>;
			const medId = String(raw.fk_medication_id ?? b.fk_medication_id ?? '');
			return {
				...b,
				medication: b.medication ?? medMap.get(medId) ?? { id: medId, code: '?', generic_name: 'Desconocido', pharmaceutical_form: '', unit_measure: '', current_stock: 0 },
				supplier_name: b.supplier_name ?? (raw.fk_supplier_id ? 'Proveedor' : undefined)
			};
		})
	} : null;

	return { batches, stockItems, medicationOptions, filters, view };
};
