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
		value,
		onchange,
		onSearch,
		placeholder = 'Search...',
		selectSize = 'md',
		allowCustom = false,
		clearable = true,
		loading = false,
		emptyMessage = 'No results found',
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
		onchange?: (value: string | undefined) => void;
		onSearch?: (query: string) => void;
		placeholder?: string;
		selectSize?: SelectSize;
		allowCustom?: boolean;
		clearable?: boolean;
		loading?: boolean;
		emptyMessage?: string;
		disabled?: boolean;
		name?: string;
		class?: string;
	} & Omit<HTMLInputAttributes, 'class' | 'value' | 'disabled' | 'name'> = $props();

	let isOpen = $state(false);
	let query = $state('');
	let highlightedIndex = $state(0);
	let containerEl: HTMLDivElement;
	let inputEl: HTMLInputElement;
	let listEl: HTMLUListElement;
	let dropdownStyle = $state('');

	let selectedOption = $derived(options.find((opt) => opt.value === value));

	let filteredOptions = $derived.by(() => {
		if (!query) return options;
		const lowerQuery = query.toLowerCase();
		return options.filter(
			(opt) =>
				opt.label.toLowerCase().includes(lowerQuery) ||
				opt.description?.toLowerCase().includes(lowerQuery)
		);
	});

	let inputId = $derived(name || label?.toLowerCase().replace(/\s+/g, '-'));

	// Update dropdown position
	$effect(() => {
		if (isOpen && containerEl) {
			const rect = containerEl.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			const dropdownHeight = Math.min(filteredOptions.length * 40 + 8, 240);
			const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

			const styles: string[] = [
				'position: fixed',
				`left: ${rect.left}px`,
				`width: ${rect.width}px`,
				'z-index: 9999'
			];

			if (showAbove) {
				styles.push(`bottom: ${window.innerHeight - rect.top + 4}px`);
			} else {
				styles.push(`top: ${rect.bottom + 4}px`);
			}

			dropdownStyle = styles.join('; ');
		}
	});

	// Handle click outside
	$effect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerEl && !containerEl.contains(e.target as Node)) {
				isOpen = false;
				query = '';
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	// Reset highlighted index when filtered options change
	$effect(() => {
		filteredOptions;
		highlightedIndex = 0;
	});

	function handleSelect(option: SelectOption) {
		onchange?.(option.value);
		isOpen = false;
		query = '';
		inputEl?.blur();
	}

	function handleClear(e: MouseEvent) {
		e.stopPropagation();
		onchange?.(undefined);
		query = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (!isOpen) {
					isOpen = true;
				} else {
					highlightedIndex =
						highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0;
				}
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex =
					highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1;
				break;
			case 'Enter':
				e.preventDefault();
				if (isOpen && filteredOptions[highlightedIndex]) {
					handleSelect(filteredOptions[highlightedIndex]);
				} else if (allowCustom && query) {
					onchange?.(query);
					isOpen = false;
					query = '';
				}
				break;
			case 'Escape':
				isOpen = false;
				query = '';
				break;
			case 'Tab':
				isOpen = false;
				query = '';
				break;
		}
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newQuery = target.value;
		query = newQuery;
		onSearch?.(newQuery);
		if (!isOpen) isOpen = true;
	}
</script>

<div class="w-full" bind:this={containerEl}>
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-ink mb-1.5">
			{label}
		</label>
	{/if}
	<div class="relative">
		<input
			bind:this={inputEl}
			id={inputId}
			type="text"
			value={isOpen ? query : selectedOption?.label || ''}
			oninput={handleInputChange}
			onfocus={() => (isOpen = true)}
			onkeydown={handleKeyDown}
			{placeholder}
			{disabled}
			autocomplete="off"
			role="combobox"
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			class="
				{baseSelectClasses}
				{sizeStyles[selectSize]}
				{getStateClasses(error, isOpen)}
				{disabledClasses}
				pr-16
				{className}
			"
			{...restProps}
		/>
		<div class="absolute top-1/2 -translate-y-1/2 right-2.5 flex items-center gap-1">
			{#if clearable && value && !disabled}
				<button
					type="button"
					onclick={handleClear}
					class="p-0.5 text-ink-subtle hover:text-ink-muted transition-colors"
				>
					<svg
						class="w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
			<svg
				class="w-4 h-4 text-ink-subtle transition-transform {isOpen ? 'rotate-180' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
			</svg>
		</div>
	</div>
	{#if error || hint}
		<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-ink-muted'}">
			{error || hint}
		</p>
	{/if}

	{#if isOpen}
		<Portal>
			<ul
				bind:this={listEl}
				style={dropdownStyle}
				class="bg-surface-elevated rounded-lg border border-border shadow-lg overflow-auto max-h-60"
				role="listbox"
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
				{:else if filteredOptions.length === 0}
					<li class="px-3 py-2 text-sm text-ink-muted">{emptyMessage}</li>
				{:else}
					{#each filteredOptions as option, index (option.value)}
						<li
							role="option"
							aria-selected={option.value === value}
							onclick={() => !option.disabled && handleSelect(option)}
							onmouseenter={() => (highlightedIndex = index)}
							class="
								px-3 py-2 cursor-pointer transition-colors
								{option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
								{index === highlightedIndex ? 'bg-canvas-subtle' : ''}
								{option.value === value ? 'bg-canvas-subtle' : ''}
							"
						>
							<div class="flex items-center gap-2">
								{#if option.icon}
									<span class="w-4 h-4 text-ink-subtle">{@render option.icon()}</span>
								{/if}
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-ink truncate">
										{option.label}
									</div>
									{#if option.description}
										<div class="text-xs text-ink-muted truncate">
											{option.description}
										</div>
									{/if}
								</div>
								{#if option.value === value}
									<svg
										class="w-4 h-4 text-ink-muted"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="m4.5 12.75 6 6 9-13.5"
										/>
									</svg>
								{/if}
							</div>
						</li>
					{/each}
				{/if}
			</ul>
		</Portal>
	{/if}
</div>
