export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	variant: ToastVariant;
	title: string;
	message?: string;
	duration?: number;
}

let toasts = $state<Toast[]>([]);

let counter = 0;

export function getToasts(): Toast[] {
	return toasts;
}

export function showToast(opts: Omit<Toast, 'id'>) {
	const id = `toast-${++counter}`;
	const toast: Toast = { id, ...opts };
	toasts = [...toasts, toast];

	const duration = opts.duration ?? (opts.variant === 'error' ? 6000 : 4000);
	if (duration > 0) {
		setTimeout(() => dismissToast(id), duration);
	}
}

export function dismissToast(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}

// Convenience helpers
export function toastSuccess(title: string, message?: string) {
	showToast({ variant: 'success', title, message });
}

export function toastError(title: string, message?: string) {
	showToast({ variant: 'error', title, message, duration: 6000 });
}

export function toastWarning(title: string, message?: string) {
	showToast({ variant: 'warning', title, message });
}

export function toastInfo(title: string, message?: string) {
	showToast({ variant: 'info', title, message });
}
