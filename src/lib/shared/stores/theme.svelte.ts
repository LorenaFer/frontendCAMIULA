export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
	if (typeof localStorage === 'undefined') return 'system';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return 'system';
}

function getSystemPrefersDark(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function shouldBeDark(t: Theme): boolean {
	if (t === 'dark') return true;
	if (t === 'light') return false;
	return getSystemPrefersDark();
}

function applyToDOM(dark: boolean) {
	if (typeof document === 'undefined') return;
	const el = document.documentElement;
	el.classList.add('transitioning');
	if (dark) {
		el.classList.add('dark');
	} else {
		el.classList.remove('dark');
	}
	setTimeout(() => el.classList.remove('transitioning'), 350);
}

class ThemeStore {
	current = $state<Theme>(getInitialTheme());
	isDark = $derived(shouldBeDark(this.current));

	setTheme(t: Theme) {
		this.current = t;
		if (typeof localStorage !== 'undefined') {
			if (t === 'system') {
				localStorage.removeItem(STORAGE_KEY);
			} else {
				localStorage.setItem(STORAGE_KEY, t);
			}
		}
		applyToDOM(shouldBeDark(t));
	}

	toggle() {
		const next: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
		this.setTheme(next[this.current]);
	}
}

export const themeStore = new ThemeStore();

// Listen for system preference changes
if (typeof window !== 'undefined') {
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	mq.addEventListener('change', () => {
		if (themeStore.current === 'system') {
			applyToDOM(getSystemPrefersDark());
		}
	});
}
