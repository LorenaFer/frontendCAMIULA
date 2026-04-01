<script lang="ts">
	import { getToasts, dismissToast, type ToastVariant } from './toast.svelte.js';

	// Colors aligned with Badge component soft styles
	const iconMap: Record<ToastVariant, { bg: string; color: string; path: string }> = {
		success: {
			bg: 'bg-emerald-100/60 dark:bg-emerald-500/20',
			color: 'text-emerald-700 dark:text-emerald-300',
			path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
		},
		error: {
			bg: 'bg-red-100/60 dark:bg-red-500/20',
			color: 'text-red-700 dark:text-red-300',
			path: 'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
		},
		warning: {
			bg: 'bg-amber-100/60 dark:bg-amber-500/20',
			color: 'text-amber-700 dark:text-amber-300',
			path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
		},
		info: {
			bg: 'bg-blue-100/60 dark:bg-blue-500/20',
			color: 'text-blue-700 dark:text-blue-300',
			path: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'
		}
	};
</script>

{#if getToasts().length > 0}
	<!-- Mobile: centered top, full-width with padding -->
	<!-- Desktop: top-right corner, max-w-sm -->
	<div
		class="fixed z-[10000] flex flex-col gap-2.5 pointer-events-none
			inset-x-0 top-3 px-3
			sm:inset-x-auto sm:top-4 sm:right-4 sm:px-0 sm:max-w-sm sm:w-full"
		role="status"
		aria-live="polite"
	>
		{#each getToasts() as toast (toast.id)}
			{@const icon = iconMap[toast.variant]}
			<div
				class="pointer-events-auto bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-3)] p-3 sm:p-4 flex gap-3 items-start toast-enter"
				role="alert"
			>
				<!-- Icon circle -->
				<div class="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full {icon.bg} flex items-center justify-center">
					<svg class="w-4.5 h-4.5 sm:w-5 sm:h-5 {icon.color}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d={icon.path} />
					</svg>
				</div>

				<!-- Content -->
				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold text-ink leading-snug">{toast.title}</p>
					{#if toast.message}
						<p class="text-xs sm:text-sm text-ink-muted mt-0.5 leading-snug">{toast.message}</p>
					{/if}
				</div>

				<!-- Close -->
				<button
					type="button"
					class="shrink-0 p-1.5 -m-1 text-ink-subtle hover:text-ink rounded-lg transition-colors"
					onclick={() => dismissToast(toast.id)}
					aria-label="Cerrar"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes toast-slide-down {
		from { opacity: 0; transform: translateY(-0.75rem); }
		to { opacity: 1; transform: translateY(0); }
	}
	.toast-enter {
		animation: toast-slide-down 0.2s ease-out;
	}
</style>
