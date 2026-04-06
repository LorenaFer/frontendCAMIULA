import type { PageServerLoad } from './$types';
import * as reportsService from '$lib/server/inventory/reports.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import { assertPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { MovementFilters, MedicationOption } from '$domain/inventory/types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);

	const filters: MovementFilters = {
		medication_id: url.searchParams.get('medication_id') ?? undefined,
		movement_type: (url.searchParams.get('movement_type') as MovementFilters['movement_type']) ?? undefined,
		date_from: url.searchParams.get('date_from') ?? undefined,
		date_to: url.searchParams.get('date_to') ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size')))
			? Number(url.searchParams.get('page_size'))
			: 25
	};

	const [movements, medicationOptions] = await Promise.all([
		reportsService.getInventoryMovements(filters).catch(() => ({
			data: [], total: 0, page: 1, pageSize: 25, hasNext: false
		})),
		medicationsService.getMedicationOptions().catch(() => [] as MedicationOption[])
	]);

	return { movements, medicationOptions, filters };
};
