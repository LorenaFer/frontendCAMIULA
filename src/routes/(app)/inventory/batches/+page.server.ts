import type { PageServerLoad } from './$types';
import * as batchesService from '$lib/server/inventory/batches.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import { assertPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { BatchFilters } from '$shared/types/inventory.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);

	const view = (url.searchParams.get('view') ?? 'stock') as 'stock' | 'batches';

	const filters: BatchFilters = {
		medication_id: url.searchParams.get('medication_id') ?? undefined,
		status: (url.searchParams.get('status') as BatchFilters['status']) ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size'))) ? Number(url.searchParams.get('page_size')) : 25
	};

	const [batches, stockItems, medicationOptions] = await Promise.all([
		view === 'batches' ? batchesService.getBatches(filters).catch(() => ({ data: [], total: 0, page: 1, pageSize: 25, hasNext: false })) : Promise.resolve(null),
		view === 'stock'   ? batchesService.getCurrentStock().catch(() => [])   : Promise.resolve(null),
		medicationsService.getMedicationOptions().catch(() => [])
	]);

	return { batches, stockItems, medicationOptions, filters, view };
};
