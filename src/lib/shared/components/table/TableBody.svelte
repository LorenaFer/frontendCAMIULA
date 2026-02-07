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

<tbody class="divide-y divide-slate-100 bg-white {className}">
  {@render children()}
</tbody>
