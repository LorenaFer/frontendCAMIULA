import type { PageServerLoad } from './$types';
import * as reportsService from '$lib/server/inventory/reports.service.js';
import { assertPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);
	const stockReport = await reportsService.getStockReport();
	return { stockReport };
};
