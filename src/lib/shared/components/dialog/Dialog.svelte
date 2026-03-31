<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';

	type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

	const sizeClasses: Record<DialogSize, string> = {
		sm: 'sm:max-w-sm',
		md: 'sm:max-w-md',
		lg: 'sm:max-w-lg',
		xl: 'sm:max-w-xl',
		full: 'sm:max-w-4xl'
	};

	let {
		open,
		onClose,
		children,
		size = 'md',
		persistent = false,
		class: className = ''
	}: {
		open: boolean;
		onClose: () => void;
		children: Snippet;
		size?: DialogSize;
		persistent?: boolean;
		class?: string;
	} = $props();

	let dialogEl: HTMLDialogElement | undefined;

	setContext('dialog', {
		get onClose() {
			return onClose;
		}
	});

	// Sync native <dialog> open state with the `open` prop
	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	// Handle native close event (Escape key, etc.)
	function handleCancel(e: Event) {
		if (persistent) {
			e.preventDefault();
		} else {
			e.preventDefault();
			onClose();
		}
	}

	// Handle backdrop click: <dialog> fires click on itself when backdrop is clicked
	function handleClick(e: MouseEvent) {
		if (persistent) return;
		if (e.target === dialogEl) {
			onClose();
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	oncancel={handleCancel}
	onclick={handleClick}
	class="
		backdrop:bg-gray-900/50 backdrop:[-webkit-backdrop-filter:blur(12px)_saturate(180%)] backdrop:[backdrop-filter:blur(12px)_saturate(180%)]
		bg-transparent p-0 max-w-none max-h-none w-screen h-screen
		open:flex items-end sm:items-center justify-center sm:p-4
		{className}
	"
>
	<div
		class="
			w-full bg-surface-elevated shadow-[var(--shadow-4)] flex flex-col
			max-h-[85vh] sm:max-h-[90vh]
			rounded-t-2xl sm:rounded-xl
			{sizeClasses[size]}
		"
	>
		<!-- Drag handle - visible only on mobile -->
		<div class="flex justify-center pt-3 pb-1 sm:hidden">
			<div class="w-10 h-1 bg-border-strong rounded-full"></div>
		</div>
		{@render children()}
	</div>
</dialog>
