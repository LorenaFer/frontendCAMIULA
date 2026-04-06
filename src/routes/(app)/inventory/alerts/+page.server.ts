import type { PageServerLoad } from './$types';
import * as reportsService from '$lib/server/inventory/reports.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import { assertPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { StockAlertFilters, MedicationOption } from '$domain/inventory/types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);

	const filters: StockAlertFilters = {
		alert_status: (url.searchParams.get('alert_status') as StockAlertFilters['alert_status']) ?? undefined,
		alert_level: (url.searchParams.get('alert_level') as StockAlertFilters['alert_level']) ?? undefined,
		medication_id: url.searchParams.get('medication_id') ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: [10, 25, 50, 100].includes(Number(url.searchParams.get('page_size')))
			? Number(url.searchParams.get('page_size'))
			: 25
	};

	const [alerts, medicationOptions] = await Promise.all([
		reportsService.getStockAlerts(filters).catch(() => ({
			items: [], total: 0, active_count: 0, resolved_count: 0,
			page: 1, pageSize: 25, hasNext: false
		})),
		medicationsService.getMedicationOptions().catch(() => [] as MedicationOption[])
	]);

	return { alerts, medicationOptions, filters };
};
