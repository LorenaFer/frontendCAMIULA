import type { NavItem } from '$shared/types/navigation';

export interface SearchResult {
	id: string;
	title: string;
	subtitle?: string;
	tag?: string;
	href?: string;
	icon?: any;
}

export interface SearchCategory {
	label: string;
	results: SearchResult[];
}

export function filterNavItemsByPermissions(items: NavItem[], permissions?: string[]): NavItem[] {
	if (!permissions) return items;
	return items.filter((item) => !item.permission || permissions.includes(item.permission));
}
