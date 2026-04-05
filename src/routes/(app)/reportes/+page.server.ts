import type { PageServerLoad } from './$types';
import { apiFetch } from '$lib/server/api.js';

export interface EPI12Data {
	year: number;
	week: number;
	start_date: string;
	end_date: string;
	total_cases: number;
	diseases: Array<{
		cie10: string;
		disease_name: string;
		total: number;
		age_groups: Record<string, { H: number; M: number }>;
	}>;
}

export interface EPI13Data {
	year: number;
	week: number;
	start_date: string;
	end_date: string;
	total_cases: number;
	cases: Array<{
		date: string;
		patient_name: string;
		age: number;
		sex: string;
		address: string;
		disease: string;
		cie10: string;
	}>;
}

export interface EPI15Data {
	year: number;
	month: number;
	month_name: string;
	total_cases: number;
	categories: Array<{
		name: string;
		subcategories: Array<{
			name: string;
			diseases: Array<{
				order: number;
				name: string;
				cie10_range: string;
				count: number;
				accumulated: number;
			}>;
		}>;
	}>;
}

function getISOWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const load: PageServerLoad = async ({ url }) => {
	const now = new Date();
	const tab = url.searchParams.get('tab') ?? 'epi12';
	const year = Number(url.searchParams.get('year') ?? now.getFullYear());
	const week = Number(url.searchParams.get('week') ?? getISOWeek(now));
	const month = Number(url.searchParams.get('month') ?? (now.getMonth() + 1));

	let epi12: EPI12Data | null = null;
	let epi13: EPI13Data | null = null;
	let epi15: EPI15Data | null = null;

	try {
		if (tab === 'epi12') {
			epi12 = await apiFetch<EPI12Data>(`/reports/epi-12?year=${year}&week=${week}`);
		} else if (tab === 'epi13') {
			epi13 = await apiFetch<EPI13Data>(`/reports/epi-13?year=${year}&week=${week}`);
		} else if (tab === 'epi15') {
			epi15 = await apiFetch<EPI15Data>(`/reports/epi-15?year=${year}&month=${month}`);
		}
	} catch { /* endpoint no disponible */ }

	return { tab, year, week, month, epi12, epi13, epi15 };
};
