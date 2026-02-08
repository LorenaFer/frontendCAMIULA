<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Portal from '$shared/components/util/Portal.svelte';
	import type { SelectOption } from './Select.svelte';

	type SelectSize = 'sm' | 'md' | 'lg';

	const sizeStyles: Record<SelectSize, string> = {
		sm: 'h-8 px-2.5 text-sm',
		md: 'h-9 px-3 text-sm',
		lg: 'h-10 px-3.5 text-sm'
	};

	const baseSelectClasses = `
		w-full rounded-lg border bg-surface-elevated text-ink
		transition-all duration-150
		focus:outline-none
		cursor-pointer
	`;

	const disabledClasses =
		'disabled:bg-canvas-subtle disabled:text-ink-subtle disabled:cursor-not-allowed disabled:hover:border-border';

	function getStateClasses(error?: string, isOpen?: boolean): string {
		if (error) return 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100';
		if (isOpen) return 'border-border-strong ring-2 ring-border-subtle';
		return 'border-border hover:border-border-strong';
	}

	let {
		label,
		error,
		hint,
		options,
		value = '',
		onchange,
		onSearch,
		placeholder = 'Type to search...',
		selectSize = 'md',
		loading = false,
		disabled,
		name,
		class: className = '',
		...restProps
	}: {
		label?: string;
		error?: string;
		hint?: string;
		options: SelectOption[];
		value?: string;
		onchange?: (value: string) => void;
		onSearch?: (query: string) => void;
		placeholder?: string;
		selectSize?: SelectSize;
		loading?: boolean;
		disabled?: boolean;
		name?: string;
		class?: string;
	} & Omit<HTMLInputAttributes, 'class' | 'value' | 'disabled' | 'name'> = $props();

	let isOpen = $state(false);
	let highlightedIndex = $state(0);
	let containerEl: HTMLDivElement;
	let inputEl: HTMLInputElement;
	let dropdownStyle = $state('');

	let filteredOptions = $derived.by(() => {
		if (!value) return [];
		const lowerValue = value.toLowerCase();
		return options.filter((opt) => opt.label.toLowerCase().includes(lowerValue));
	});

	let inputId = $derived(name || label?.toLowerCase().replace(/\s+/g, '-'));

	// Update dropdown position
	$effect(() => {
		if (isOpen && containerEl && filteredOptions.length > 0) {
			const rect = containerEl.getBoundingClientRect();
			dropdownStyle = [
				'position: fixed',
				`left: ${rect.left}px`,
				`top: ${rect.bottom + 4}px`,
				`width: ${rect.width}px`,
				'z-index: 9999'
			].join('; ');
		}
	});

	// Handle click outside
	$effect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerEl && !containerEl.contains(e.target as Node)) {
				isOpen = false;
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	function handleSelect(option: SelectOption) {
		onchange?.(option.label);
		isOpen = false;
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = target.value;
		onchange?.(newValue);
		onSearch?.(newValue);
		isOpen = true;
	}

	function handleKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex =
					highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0;
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex =
					highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1;
				break;
			case 'Enter':
				e.preventDefault();
				if (filteredOptions[highlightedIndex]) {
					handleSelect(filteredOptions[highlightedIndex]);
				}
				break;
			case 'Escape':
				isOpen = false;
				break;
		}
	}
</script>

<div class="w-full" bind:this={containerEl}>
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-ink mb-1.5">
			{label}
		</label>
	{/if}
	<input
		bind:this={inputEl}
		id={inputId}
		type="text"
		{value}
		oninput={handleInputChange}
		onfocus={() => value && (isOpen = true)}
		onkeydown={handleKeyDown}
		{placeholder}
		{disabled}
		autocomplete="off"
		class="
			{baseSelectClasses}
			{sizeStyles[selectSize]}
			{getStateClasses(error, isOpen)}
			{disabledClasses}
			{className}
		"
		{...restProps}
	/>
	{#if error || hint}
		<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-ink-muted'}">
			{error || hint}
		</p>
	{/if}

	{#if isOpen && filteredOptions.length > 0}
		<Portal>
			<ul
				style={dropdownStyle}
				class="bg-surface-elevated rounded-lg border border-border shadow-lg overflow-auto max-h-60"
			>
				{#if loading}
					<li class="px-3 py-2 text-sm text-ink-muted flex items-center gap-2">
						<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
							/>
						</svg>
						Loading...
					</li>
				{:else}
					{#each filteredOptions as option, index (option.value)}
						<li
							onclick={() => handleSelect(option)}
							onmouseenter={() => (highlightedIndex = index)}
							role="option"
							aria-selected={false}
							class="
								px-3 py-2 cursor-pointer transition-colors text-sm
								{index === highlightedIndex ? 'bg-canvas-subtle' : ''}
							"
						>
							{option.label}
						</li>
					{/each}
				{/if}
			</ul>
		</Portal>
	{/if}
</div>
