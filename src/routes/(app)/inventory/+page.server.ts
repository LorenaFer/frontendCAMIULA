import type { PageServerLoad } from './$types';
import * as reportsService from '$lib/server/inventory/reports.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import * as batchesService from '$lib/server/inventory/batches.service.js';
import * as dispatchesService from '$lib/server/inventory/dispatches.service.js';
import { assertPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';

const emptyStockReport = { generated_at: '', items: [], total_medications: 0, critical_count: 0, expired_count: 0 };
const emptyExpReport = { generated_at: '', threshold_days: 90, batches: [] };
const emptyConsumption = { period: '', items: [] };
const emptyDispatches = { data: [], total: 0, page: 1, pageSize: 25, hasNext: false };

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, P.INVENTORY_READ);

	const hoy = new Date().toISOString().slice(0, 10);
	const mesActual = hoy.slice(0, 7);

	const [stockReport, expirationReport, consumptionReport, recentDispatches] = await Promise.all([
		reportsService.getStockReport().catch(() => emptyStockReport),
		reportsService.getExpirationReport(90).catch(() => emptyExpReport),
		reportsService.getConsumptionReport(mesActual).catch(() => emptyConsumption),
		dispatchesService.getDispatches({ page: 1, pageSize: 10 }).catch(() => emptyDispatches)
	]);

	return {
		stockReport,
		expirationReport,
		consumptionReport,
		recentDispatches,
		mesActual
	};
};
