<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type InputSize = 'sm' | 'md' | 'lg';

	interface TextareaProps extends Omit<HTMLTextareaAttributes, 'size'> {
		label?: string;
		error?: string;
		hint?: string;
		textareaSize?: InputSize;
		/** Auto-resize based on content */
		autoResize?: boolean;
		textareaRef?: HTMLTextAreaElement;
	}

	let {
		label,
		error,
		hint,
		textareaSize = 'md',
		autoResize = false,
		class: className = '',
		id,
		rows = 3,
		textareaRef = $bindable(),
		...restProps
	}: TextareaProps = $props();

	const textareaSizeStyles: Record<InputSize, string> = {
		sm: 'px-2.5 py-2 text-sm',
		md: 'px-3 py-2.5 text-sm',
		lg: 'px-3.5 py-3 text-sm'
	};

	const getStateClasses = (err?: string) =>
		err
			? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
			: 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

	const disabledClasses =
		'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:border-slate-200';

	let textareaId = $derived(id || label?.toLowerCase().replace(/\s+/g, '-'));

	function handleInput(e: Event) {
		if (autoResize) {
			const target = e.target as HTMLTextAreaElement;
			target.style.height = 'auto';
			target.style.height = `${target.scrollHeight}px`;
		}
	}
</script>

<div class="w-full">
	{#if label}
		<label for={textareaId} class="block text-sm font-medium text-slate-700 mb-1.5">
			{label}
		</label>
	{/if}
	<textarea
		bind:this={textareaRef}
		id={textareaId}
		{rows}
		oninput={handleInput}
		class="w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none {autoResize
			? 'resize-none overflow-hidden'
			: 'resize-y'} {textareaSizeStyles[textareaSize]} {getStateClasses(
			error
		)} {disabledClasses} {className}"
		{...restProps}
	></textarea>
	{#if error || hint}
		<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-slate-500'}">
			{error || hint}
		</p>
	{/if}
</div>
