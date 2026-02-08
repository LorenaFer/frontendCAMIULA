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

<thead class="bg-canvas-subtle border-b border-border {className}">
  {@render children()}
</thead>
