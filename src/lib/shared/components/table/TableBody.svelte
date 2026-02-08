<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className = ''
  }: {
    children: Snippet;
    class?: string;
  } = $props();
</script>

<tbody class="divide-y divide-border-subtle bg-surface-elevated {className}">
  {@render children()}
</tbody>
