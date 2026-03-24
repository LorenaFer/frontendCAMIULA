# Patrones de Svelte 5 (Runes)

> **Este proyecto usa exclusivamente Svelte 5 con runes.** No usar la API legacy de Svelte 4 (`$:`, `export let`, `<slot>`, `createEventDispatcher`).

---

## Tabla de Migracion Rapida

| Svelte 4 (NO usar) | Svelte 5 (usar esto) |
|---|---|
| `export let prop` | `let { prop } = $props()` |
| `$: derived = x + y` | `let derived = $derived(x + y)` |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` |
| `<slot />` | `{@render children()}` |
| `<slot name="header" />` | `{@render header()}` |
| `on:click={handler}` | `onclick={handler}` |
| `createEventDispatcher()` | Callback props: `onclick?: () => void` |
| Writable stores | Clases con `$state` |

---

## `$state` — Estado Reactivo

Reemplaza a `let variable` cuando necesitas reactividad.

```svelte
<script lang="ts">
  // Primitivos
  let count = $state(0);
  let name = $state('');
  let isOpen = $state(false);

  // Con tipo explicito (cuando TypeScript no puede inferir)
  let paciente = $state<PacientePublic | null>(null);
  let queryType = $state<'nhm' | 'cedula'>('cedula');

  // Objetos
  let filters = $state({ search: '', status: 'all', page: 1 });

  // Arrays
  let items = $state<Item[]>([]);
</script>

<input bind:value={name} />
<button onclick={() => count++}>Count: {count}</button>
```

### Estado en Stores (Patron de Clase)

Para estado global que necesita ser exportado:

```typescript
// src/lib/shared/stores/mi-store.svelte.ts

class MiStore {
  // Estado interno (reactivo)
  items = $state<Item[]>([]);
  loading = $state(false);

  // Computados
  count = $derived(this.items.length);
  isEmpty = $derived(this.items.length === 0);

  // Metodos que mutan estado
  add(item: Item) {
    this.items.push(item);
  }

  async load() {
    this.loading = true;
    // ... fetch
    this.loading = false;
  }
}

// Singleton exportado
export const miStore = new MiStore();
```

> **Por que clases?** Svelte 5 no permite exportar `$state` reasignable desde un modulo. El patron de clase encapsula el estado y lo hace accesible via singleton.

---

## `$derived` — Valores Computados

Reemplaza a `$: derived = ...`. Se recalcula automaticamente cuando sus dependencias cambian.

```svelte
<script lang="ts">
  let search = $state('');
  let items = $state<Item[]>([]);
  let selectedId = $state<number | null>(null);

  // Derivado simple
  let hasItems = $derived(items.length > 0);
  let isDisabled = $derived(disabled || isLoading);

  // Derivado con logica compleja: usar $derived.by()
  let filtered = $derived.by(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q)
    );
  });

  // Derivado que agrupa datos
  let grouped = $derived.by(() => {
    const groups: Record<string, Item[]> = {};
    for (const item of items) {
      const key = item.category ?? 'Sin categoria';
      (groups[key] ??= []).push(item);
    }
    return groups;
  });

  // Derivado de otro derivado
  let resultCount = $derived(filtered.length);
</script>
```

### `$derived` vs `$derived.by()`

| Usar | Cuando |
|---|---|
| `$derived(expr)` | Expresion simple de una linea |
| `$derived.by(() => { ... })` | Logica compleja, multiples lineas, loops |

---

## `$effect` — Efectos Secundarios

Reemplaza a `$: { sideEffect() }`. Se ejecuta despues del render cuando cambian sus dependencias.

```svelte
<script lang="ts">
  let open = $state(false);

  // Efecto basico
  $effect(() => {
    console.log('open cambio a:', open);
  });

  // Efecto con cleanup (se ejecuta al desmontar o re-ejecutar)
  $effect(() => {
    if (!open) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') open = false;
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  });

  // Bloquear scroll del body
  $effect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  });

  // Calcular posicion de un popover
  $effect(() => {
    if (isVisible && buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      position = { top: rect.bottom + 4, left: rect.left };
    }
  });
</script>
```

### Reglas de `$effect`

1. **Siempre retornar cleanup** si agregas event listeners o modificas el DOM
2. **No usar para derivar datos** — usar `$derived` en su lugar
3. **No hacer fetch en effects** — usar load functions o event handlers
4. **Las dependencias son automaticas** — Svelte detecta que variables lees

---

## `$props` — Props del Componente

Reemplaza a `export let`. Destructura todas las props en una sola llamada.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  // Definir interface de props
  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: Snippet;
    children?: Snippet;
  }

  // Destructurar con defaults + rest props
  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    ...restProps  // Captura atributos HTML nativos (class, id, aria-*, etc.)
  } = $props<Props>();
</script>

<!-- Spread de restProps al elemento DOM -->
<button disabled={loading} {...restProps}>
  {#if loading}
    <span class="animate-spin">...</span>
  {:else}
    {#if icon}{@render icon()}{/if}
    {#if children}{@render children()}{/if}
  {/if}
</button>
```

### Patron de Props con Record Tipado

Mapear variantes a clases CSS usando `Record`:

```svelte
<script lang="ts">
  type Variant = 'primary' | 'secondary' | 'ghost';
  type Size = 'sm' | 'md' | 'lg';

  const variantStyles: Record<Variant, string> = {
    primary: 'bg-viking-600 text-white hover:bg-viking-700 btn-shine',
    secondary: 'bg-surface-elevated text-ink border border-border hover:bg-canvas-subtle',
    ghost: 'text-ink-muted hover:bg-canvas-subtle hover:text-ink',
  };

  const sizeStyles: Record<Size, string> = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-10 px-5 text-base gap-2',
  };

  let { variant = 'primary', size = 'md' } = $props<{ variant?: Variant; size?: Size }>();
</script>

<button class="{variantStyles[variant]} {sizeStyles[size]} rounded-lg font-medium">
  ...
</button>
```

> TypeScript garantiza que todos los valores del union estan cubiertos en el Record.

---

## `$bindable` — Props con Binding Bidireccional

Permite que el componente padre use `bind:` para sincronizar valores.

```svelte
<!-- Input.svelte -->
<script lang="ts">
  let {
    value = $bindable(''),        // El padre puede bind:value
    inputRef = $bindable(),        // El padre puede bind:inputRef
    ...restProps
  } = $props<{
    value?: string;
    inputRef?: HTMLInputElement;
  }>();
</script>

<input bind:this={inputRef} bind:value {...restProps} />
```

```svelte
<!-- Uso desde el padre -->
<script lang="ts">
  let userName = $state('');
  let myInput: HTMLInputElement;
</script>

<Input bind:value={userName} bind:inputRef={myInput} />

<!-- userName y myInput se actualizan automaticamente -->
<button onclick={() => myInput.focus()}>Focus</button>
<p>Valor: {userName}</p>
```

---

## Snippets (Reemplazan `<slot>`)

Los snippets son funciones que renderizan un bloque de markup. Reemplazan completamente a `<slot>`.

### Definir y Pasar un Snippet

```svelte
<!-- Padre -->
{#snippet miIcono()}
  <svg viewBox="0 0 24 24"><path d="M12..." /></svg>
{/snippet}

<Button icon={miIcono}>
  Guardar
</Button>
```

### Recibir y Renderizar un Snippet

```svelte
<!-- Button.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { icon, children }: { icon?: Snippet; children?: Snippet } = $props();
</script>

<button>
  {#if icon}
    <span class="w-4 h-4">{@render icon()}</span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
```

### Snippets con Parametros

```svelte
<!-- Componente que pasa datos al snippet -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { items, row }: {
    items: Item[];
    row: Snippet<[Item, number]>;  // Snippet con parametros
  } = $props();
</script>

{#each items as item, i}
  {@render row(item, i)}
{/each}

<!-- Uso -->
<MiLista {items}>
  {#snippet row(item, index)}
    <div>{index}: {item.name}</div>
  {/snippet}
</MiLista>
```

### `children` — El Snippet por Defecto

El contenido entre las tags del componente se pasa automaticamente como `children`:

```svelte
<!-- Esto... -->
<Card>
  <h2>Titulo</h2>
  <p>Contenido</p>
</Card>

<!-- ...es equivalente a pasar un snippet "children" -->
```

```svelte
<!-- Card.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>

<div class="card">
  {#if children}{@render children()}{/if}
</div>
```

---

## Context API

Para componentes compuestos que necesitan compartir estado sin pasar props por toda la cadena:

### Proveer Contexto (Componente Padre)

```typescript
// MultiStepDialog.svelte
import { setContext } from 'svelte';

let currentStep = $state(0);
let totalSteps = 3;

// Usar GETTERS para que el contexto sea reactivo
setContext('multi-step-dialog', {
  get currentStep() { return currentStep; },
  get totalSteps() { return totalSteps; },
  get isFirstStep() { return currentStep === 0; },
  get isLastStep() { return currentStep === totalSteps - 1; },
  nextStep: () => { if (currentStep < totalSteps - 1) currentStep++; },
  prevStep: () => { if (currentStep > 0) currentStep--; },
  goToStep: (step: number) => { currentStep = step; },
});
```

> **Critico**: Usar **getters** (`get prop()`) en lugar de valores directos. Sin getters, el contexto no es reactivo.

### Consumir Contexto (Componente Hijo)

```typescript
// StepContent.svelte
import { getContext } from 'svelte';

const ctx = getContext('multi-step-dialog');

// ctx.currentStep es reactivo gracias al getter
let isActive = $derived(ctx.currentStep === stepIndex);
```

### Helpers de Tipado

```typescript
// Archivo de helpers para el contexto
const KEY = Symbol('multi-step-dialog');

export interface DialogContext {
  readonly currentStep: number;
  readonly isLastStep: boolean;
  nextStep: () => void;
  prevStep: () => void;
}

export function setDialogContext(value: DialogContext) {
  setContext(KEY, value);
}

export function getDialogContext(): DialogContext {
  return getContext<DialogContext>(KEY);
}
```

---

## Eventos (Callbacks como Props)

Svelte 5 no usa `createEventDispatcher`. Los eventos son simplemente funciones pasadas como props:

```svelte
<!-- Componente -->
<script lang="ts">
  let { onSelect, onClose }: {
    onSelect?: (item: Item) => void;
    onClose?: () => void;
  } = $props();
</script>

<button onclick={() => onSelect?.(selectedItem)}>Seleccionar</button>
<button onclick={onClose}>Cerrar</button>

<!-- Padre -->
<MiComponente
  onSelect={(item) => console.log('Seleccionado:', item)}
  onClose={() => dialogOpen = false}
/>
```

### Eventos DOM Nativos

En Svelte 5, los eventos DOM se pasan directamente (sin `on:`):

```svelte
<!-- Svelte 5 -->
<button onclick={handleClick}>Click</button>
<input oninput={handleInput} onfocus={handleFocus} />
<form onsubmit={handleSubmit}>

<!-- NO hacer (Svelte 4) -->
<button on:click={handleClick}>Click</button>
```

---

## Resumen de Patrones

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  // Props
  let { variant = 'default', children, onAction } = $props<{
    variant?: 'default' | 'accent';
    children?: Snippet;
    onAction?: (id: number) => void;
  }>();

  // Estado local
  let count = $state(0);

  // Computado
  let label = $derived(count === 0 ? 'Vacio' : `${count} items`);

  // Efecto con cleanup
  $effect(() => {
    const timer = setInterval(() => count++, 1000);
    return () => clearInterval(timer);
  });
</script>

<div class={variant === 'accent' ? 'bg-viking-50' : 'bg-surface'}>
  <span>{label}</span>
  {#if children}{@render children()}{/if}
  <button onclick={() => onAction?.(count)}>Action</button>
</div>
```
