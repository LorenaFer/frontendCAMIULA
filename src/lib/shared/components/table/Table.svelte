<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className = '',
    dense = false
  }: {
    children: Snippet;
    class?: string;
    /** Dense mode for maximum information density */
    dense?: boolean;
  } = $props();
</script>

<div class="overflow-x-auto {dense ? 'dense-mode' : ''} {className}">
  <table class="w-full border-collapse">
    {@render children()}
  </table>
</div>
