import type { Snippet } from 'svelte';

export interface NavItem {
	id: string;
	label: string;
	href: string;
	icon: Snippet;
	/** Permission required to see this item */
	permission?: string;
	/** Badge count for notifications */
	badge?: number;
	/** Group label for sidebar section headers */
	group?: string;
}

export interface UserProfile {
	id: string;
	name: string;
	role: string;
	avatar?: string;
	initials: string;
}

export interface NavigationConfig {
	items: NavItem[];
	user: UserProfile;
	tenantName?: string;
}
