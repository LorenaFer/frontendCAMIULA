<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type SelectSize = 'sm' | 'md' | 'lg';

	export interface SelectOption {
		value: string;
		label: string;
		description?: string;
		icon?: Snippet;
		disabled?: boolean;
	}

	const sizeStyles: Record<SelectSize, string> = {
		sm: 'h-8 px-2.5 text-sm',
		md: 'h-9 px-3 text-sm',
		lg: 'h-10 px-3.5 text-sm'
	};

	const baseSelectClasses = `
		w-full rounded-lg border bg-white text-slate-900
		transition-all duration-150
		focus:outline-none
		cursor-pointer
	`;

	const disabledClasses =
		'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:border-slate-200';

	function getStateClasses(error?: string, isOpen?: boolean): string {
		if (error) return 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100';
		if (isOpen) return 'border-slate-400 ring-2 ring-slate-100';
		return 'border-slate-200 hover:border-slate-300';
	}

	let {
		label,
		error,
		hint,
		options,
		selectSize = 'md',
		placeholder,
		value,
		onchange,
		disabled,
		name,
		class: className = '',
		...restProps
	}: {
		label?: string;
		error?: string;
		hint?: string;
		options: SelectOption[];
		selectSize?: SelectSize;
		placeholder?: string;
		value?: string;
		onchange?: (value: string) => void;
		disabled?: boolean;
		name?: string;
		class?: string;
	} & Omit<HTMLSelectAttributes, 'class' | 'value' | 'disabled' | 'name'> = $props();

	let selectEl: HTMLSelectElement;

	let selectId = $derived(name || label?.toLowerCase().replace(/\s+/g, '-'));

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onchange?.(target.value);
	}
</script>

<div class="w-full">
	{#if label}
		<label for={selectId} class="block text-sm font-medium text-slate-700 mb-1.5">
			{label}
		</label>
	{/if}
	<div class="relative">
		<select
			bind:this={selectEl}
			id={selectId}
			{value}
			onchange={handleChange}
			{disabled}
			{name}
			class="
				{baseSelectClasses}
				{sizeStyles[selectSize]}
				{getStateClasses(error)}
				{disabledClasses}
				appearance-none pr-9
				{className}
			"
			{...restProps}
		>
			{#if placeholder}
				<option value="" disabled>{placeholder}</option>
			{/if}
			{#each options as option (option.value)}
				<option value={option.value} disabled={option.disabled}>
					{option.label}
				</option>
			{/each}
		</select>
		<div
			class="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none text-slate-400"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
			</svg>
		</div>
	</div>
	{#if error || hint}
		<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-slate-500'}">
			{error || hint}
		</p>
	{/if}
</div>
