<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className = '',
    align = 'left'
  }: {
    children: Snippet;
    class?: string;
    align?: 'left' | 'center' | 'right';
  } = $props();

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
</script>

<td class="px-3 py-2 text-sm text-slate-700 {alignClasses[align]} {className}">
  {@render children()}
</td>
