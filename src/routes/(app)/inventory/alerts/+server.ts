import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as reportsService from '$lib/server/inventory/reports.service.js';
import { assertPermission, assertActionPermission } from '$lib/server/rbac.js';
import { P } from '$shared/rbac-config.js';
import type { AuthUser } from '$shared/types/auth.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user as AuthUser | null;
	const body = await request.json();
	const action = body.action as string;

	if (action === 'generate') {
		assertPermission(user, P.INVENTORY_READ);
		const result = await reportsService.generateStockAlerts();
		return json({ ok: true, new_alerts: result.new_alerts });
	}

	if (action === 'acknowledge') {
		assertPermission(user, P.INVENTORY_READ);
		await reportsService.acknowledgeStockAlert(body.alert_id);
		return json({ ok: true });
	}

	if (action === 'resolve') {
		assertPermission(user, P.INVENTORY_READ);
		await reportsService.resolveStockAlert(body.alert_id);
		return json({ ok: true });
	}

	return json({ ok: false, error: 'Acción no reconocida' }, { status: 400 });
};
