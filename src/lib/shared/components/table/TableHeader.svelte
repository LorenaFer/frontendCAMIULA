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

<thead class="bg-slate-50 border-b border-slate-200 {className}">
  {@render children()}
</thead>
