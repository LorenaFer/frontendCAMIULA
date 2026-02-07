<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className = '',
    onclick,
    selected = false
  }: {
    children: Snippet;
    class?: string;
    onclick?: () => void;
    selected?: boolean;
  } = $props();
</script>

<tr
  onclick={onclick}
  class="
    transition-colors duration-100
    {onclick ? 'cursor-pointer hover:bg-slate-50/70 group' : ''}
    {selected ? 'bg-viking-50/40' : ''}
    {className}
  "
>
  {@render children()}
</tr>
