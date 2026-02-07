<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Portal from '$shared/components/util/Portal.svelte';
	import type { SelectOption } from './Select.svelte';

	type SelectSize = 'sm' | 'md' | 'lg';

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
		value = [],
		onchange,
		placeholder = 'Select options...',
		selectSize = 'md',
		maxSelections,
		showTags = true,
		searchable = true,
		disabled,
		name,
		class: className = '',
		...restProps
	}: {
		label?: string;
		error?: string;
		hint?: string;
		options: SelectOption[];
		value?: string[];
		onchange?: (value: string[]) => void;
		placeholder?: string;
		selectSize?: SelectSize;
		maxSelections?: number;
		showTags?: boolean;
		searchable?: boolean;
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

	let filteredOptions = $derived.by(() => {
		if (!query) return options;
		const lowerQuery = query.toLowerCase();
		return options.filter((opt) => opt.label.toLowerCase().includes(lowerQuery));
	});

	let selectedOptions = $derived(options.filter((opt) => value.includes(opt.value)));

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
			const target = e.target as Node;
			const isInsideContainer = containerEl?.contains(target);
			const isInsideDropdown = listEl?.contains(target);

			if (!isInsideContainer && !isInsideDropdown) {
				isOpen = false;
				query = '';
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	function handleToggle(optionValue: string) {
		const isSelected = value.includes(optionValue);
		if (isSelected) {
			onchange?.(value.filter((v) => v !== optionValue));
		} else if (!maxSelections || value.length < maxSelections) {
			onchange?.([...value, optionValue]);
		}
	}

	function handleRemove(optionValue: string, e: MouseEvent) {
		e.stopPropagation();
		onchange?.(value.filter((v) => v !== optionValue));
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
					handleToggle(filteredOptions[highlightedIndex].value);
				}
				break;
			case 'Escape':
				isOpen = false;
				query = '';
				break;
			case 'Backspace':
				if (!query && value.length > 0) {
					onchange?.(value.slice(0, -1));
				}
				break;
		}
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		query = target.value;
		if (!isOpen) isOpen = true;
	}
</script>

<div class="w-full" bind:this={containerEl}>
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-slate-700 mb-1.5">
			{label}
		</label>
	{/if}
	<div
		onclick={() => !disabled && inputEl?.focus()}
		role="group"
		class="
			min-h-9 rounded-lg border bg-white px-2 py-1.5
			flex flex-wrap items-center gap-1.5
			transition-all duration-150
			{getStateClasses(error, isOpen)}
			{disabled ? 'bg-slate-50 cursor-not-allowed' : 'cursor-text'}
			{className}
		"
	>
		{#if showTags}
			{#each selectedOptions as option (option.value)}
				<span
					class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-sm rounded"
				>
					{option.label}
					{#if !disabled}
						<button
							type="button"
							onclick={(e) => handleRemove(option.value, e)}
							class="p-0.5 hover:bg-slate-200 rounded transition-colors"
						>
							<svg
								class="w-3 h-3"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M6 18 18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</span>
			{/each}
		{/if}

		{#if searchable}
			<input
				bind:this={inputEl}
				id={inputId}
				type="text"
				value={query}
				oninput={handleInputChange}
				onfocus={() => (isOpen = true)}
				onkeydown={handleKeyDown}
				placeholder={selectedOptions.length === 0 ? placeholder : ''}
				{disabled}
				autocomplete="off"
				class="flex-1 min-w-20 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
				{...restProps}
			/>
		{:else}
			<span
				onclick={() => !disabled && (isOpen = !isOpen)}
				role="button"
				tabindex="0"
				class="flex-1 text-sm {selectedOptions.length === 0
					? 'text-slate-400'
					: 'text-slate-900'}"
			>
				{selectedOptions.length === 0 ? placeholder : `${selectedOptions.length} selected`}
			</span>
		{/if}

		<svg
			class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform {isOpen
				? 'rotate-180'
				: ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
		</svg>
	</div>
	{#if error || hint}
		<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-slate-500'}">
			{error || hint}
		</p>
	{/if}
	{#if maxSelections}
		<p class="mt-1 text-xs text-slate-400">
			{value.length}/{maxSelections} selected
		</p>
	{/if}

	{#if isOpen}
		<Portal>
			<ul
				bind:this={listEl}
				style={dropdownStyle}
				class="bg-white rounded-lg border border-slate-200 shadow-lg overflow-auto max-h-60"
				role="listbox"
			>
				{#if filteredOptions.length === 0}
					<li class="px-3 py-2 text-sm text-slate-500">No results found</li>
				{:else}
					{#each filteredOptions as option, index (option.value)}
						{@const isSelected = value.includes(option.value)}
						<li
							role="option"
							aria-selected={isSelected}
							onclick={() => !option.disabled && handleToggle(option.value)}
							onmouseenter={() => (highlightedIndex = index)}
							class="
								px-3 py-2 cursor-pointer transition-colors flex items-center gap-2
								{option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
								{index === highlightedIndex ? 'bg-slate-100' : ''}
							"
						>
							<div
								class="
									w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
									{isSelected ? 'bg-slate-900 border-slate-900' : 'border-slate-300'}
								"
							>
								{#if isSelected}
									<svg
										class="w-3 h-3 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="3"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="m4.5 12.75 6 6 9-13.5"
										/>
									</svg>
								{/if}
							</div>
							{#if option.icon}
								<span class="w-4 h-4 text-slate-400">{@render option.icon()}</span>
							{/if}
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium text-slate-900 truncate">
									{option.label}
								</div>
								{#if option.description}
									<div class="text-xs text-slate-500 truncate">
										{option.description}
									</div>
								{/if}
							</div>
						</li>
					{/each}
				{/if}
			</ul>
		</Portal>
	{/if}
</div>
