<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    icon,
    title = 'No data',
    description,
    action,
    colSpan = 1
  }: {
    icon?: Snippet;
    title?: string;
    description?: string;
    action?: Snippet;
    colSpan?: number;
  } = $props();
</script>

<tr>
  <td colspan={colSpan} class="px-4 py-12">
    <div class="flex flex-col items-center justify-center text-center">
      {#if icon}
        <div class="w-10 h-10 text-gray-300 mb-3">
          {@render icon()}
        </div>
      {:else}
        <svg
          class="w-10 h-10 text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      {/if}
      <p class="text-sm font-medium text-gray-900">{title}</p>
      {#if description}
        <p class="text-xs text-gray-500 mt-1 max-w-sm">{description}</p>
      {/if}
      {#if action}
        <div class="mt-4">
          {@render action()}
        </div>
      {/if}
    </div>
  </td>
</tr>
