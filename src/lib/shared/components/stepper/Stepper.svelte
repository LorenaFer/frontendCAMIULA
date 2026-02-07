<script lang="ts">
	import type { Step } from './types.js';

	let {
		steps,
		currentStep,
		variant = 'default',
		onStepClick,
		class: className = ''
	}: {
		steps: Step[];
		currentStep: number;
		variant?: 'default' | 'compact' | 'dots';
		onStepClick?: (stepIndex: number) => void;
		class?: string;
	} = $props();
</script>

{#if variant === 'dots'}
	<!-- Dots variant -->
	<div class="flex items-center justify-center gap-2 {className}">
		{#each steps as step, index (step.id)}
			{@const isCompleted = index < currentStep}
			{@const isCurrent = index === currentStep}
			{@const isClickable = onStepClick && index < currentStep}
			<button
				type="button"
				onclick={() => isClickable && onStepClick?.(index)}
				disabled={!isClickable}
				class="
					rounded-full transition-all
					{isCurrent ? 'w-6 h-2 bg-viking-500' : 'w-2 h-2'}
					{isCompleted ? 'bg-viking-500' : !isCurrent ? 'bg-gray-300' : ''}
					{isClickable ? 'cursor-pointer hover:bg-viking-400' : 'cursor-default'}
				"
				aria-label="Step {index + 1}: {step.title}"
			></button>
		{/each}
	</div>
{:else if variant === 'compact'}
	<!-- Compact variant -->
	{@const currentStepData = steps[currentStep]}
	<div class="flex items-center justify-between {className}">
		<div>
			<span class="text-xs text-gray-500">
				Step {currentStep + 1} of {steps.length}
			</span>
			<h4 class="text-sm font-medium text-gray-900">{currentStepData?.title}</h4>
		</div>
		<div class="flex gap-1">
			{#each steps as _, index}
				<div
					class="
						h-1 w-6 rounded-full transition-colors
						{index <= currentStep ? 'bg-viking-500' : 'bg-gray-200'}
					"
				></div>
			{/each}
		</div>
	</div>
{:else}
	<!-- Default variant -->
	<nav class={className}>
		<ol class="flex items-center">
			{#each steps as step, index (step.id)}
				{@const isCompleted = index < currentStep}
				{@const isCurrent = index === currentStep}
				{@const isClickable = onStepClick && index < currentStep}
				<li class="flex items-center {index < steps.length - 1 ? 'flex-1' : ''}">
					<button
						type="button"
						onclick={() => isClickable && onStepClick?.(index)}
						disabled={!isClickable}
						class="
							flex items-center gap-3 group
							{isClickable ? 'cursor-pointer' : 'cursor-default'}
						"
					>
						<!-- Step indicator -->
						<span
							class="
								flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
								transition-colors flex-shrink-0
								{isCompleted
								? 'bg-viking-500 text-white'
								: isCurrent
									? 'bg-viking-500 text-white ring-4 ring-viking-100'
									: 'bg-gray-100 text-gray-500'}
								{isClickable ? 'group-hover:bg-viking-600' : ''}
							"
						>
							{#if isCompleted}
								<svg
									class="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m4.5 12.75 6 6 9-13.5"
									/>
								</svg>
							{:else if step.icon}
								<span class="w-4 h-4">{@render step.icon()}</span>
							{:else}
								{index + 1}
							{/if}
						</span>

						<!-- Step content -->
						<span class="hidden sm:block">
							<span
								class="
									block text-sm font-medium
									{isCurrent ? 'text-viking-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'}
								"
							>
								{step.title}
							</span>
							{#if step.description}
								<span class="block text-xs text-gray-500 mt-0.5">
									{step.description}
								</span>
							{/if}
						</span>
					</button>

					<!-- Connector line -->
					{#if index < steps.length - 1}
						<div
							class="
								flex-1 h-0.5 mx-4
								{isCompleted ? 'bg-viking-500' : 'bg-gray-200'}
							"
						></div>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}
