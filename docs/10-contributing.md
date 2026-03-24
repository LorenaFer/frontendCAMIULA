# Guia de Contribucion

## Convenciones del Proyecto

### Svelte 5 — Lo que SI hacer

| Patron | Ejemplo |
|---|---|
| Runes para estado | `let x = $state(0)` |
| Derivados para computos | `let y = $derived(x * 2)` |
| Effects con cleanup | `$effect(() => { ...; return cleanup; })` |
| Props destructuradas | `let { a, b } = $props()` |
| Snippets para contenido | `children?: Snippet` |
| Stores como clases | `class Store { x = $state(0) }` |
| Contexto con getters | `get value() { return this.x }` |
| Eventos como callbacks | `onclick?: () => void` |
| Eventos DOM directos | `<button onclick={fn}>` |

### Svelte 5 — Lo que NO hacer

| Anti-patron | Alternativa |
|---|---|
| `export let prop` | `$props()` |
| `$: derived = ...` | `$derived(...)` |
| `<slot />` | `{@render children()}` |
| `$: { sideEffect() }` | `$effect(() => { ... })` |
| Export de `$state` desde modulo | Clase con singleton |
| `on:click={handler}` | `onclick={handler}` |
| `createEventDispatcher()` | Callback props |
| Writable/Readable stores | Clase con `$state` |

---

## CSS y Tailwind

| Regla | Detalle |
|---|---|
| Tokens semanticos | Siempre `bg-surface`, `text-ink`, nunca `bg-white`, `text-gray-*` |
| Sombras con variable | `shadow-[var(--shadow-N)]`, no `shadow-md` |
| Transiciones con token | `duration-[var(--duration-normal)]`, no `duration-200` |
| Easing con token | `ease-[var(--ease-gentle)]`, no `ease-in-out` |
| Prefijos Safari | `-webkit-backdrop-filter`, `-webkit-transform` |
| Tokens en app.css | Unico archivo de tokens. No crear otros |
| Colores de marca | `viking-*` no `teal-*`, `sage-*` no `green-*` |

---

## Estructura de Archivos

| Tipo de archivo | Ubicacion |
|---|---|
| Componentes reutilizables | `src/lib/shared/components/{categoria}/` |
| Componentes de pagina | `src/routes/[tenantId]/{ruta}/+page.svelte` |
| Load functions | `src/routes/[tenantId]/{ruta}/+page.server.ts` |
| REST endpoints | `src/routes/[tenantId]/{ruta}/+server.ts` |
| Servicios | `src/lib/server/{entidad}.service.ts` |
| Tipos | `src/lib/shared/types/{modulo}.ts` |
| Stores | `src/lib/shared/stores/{nombre}.svelte.ts` |
| Design tokens | `src/app.css` (bloque @theme) |

### Nombrar Archivos

| Tipo | Convencion | Ejemplo |
|---|---|---|
| Componente | PascalCase | `AppointmentBookingWizard.svelte` |
| Directorio de componentes | kebab-case | `empty-state/` |
| Servicio | kebab-case + `.service.ts` | `pacientes.service.ts` |
| Tipo | kebab-case | `appointments.ts` |
| Store | kebab-case + `.svelte.ts` | `theme.svelte.ts` |

---

## Flujo para Agregar una Nueva Feature

### 1. Definir Tipos

```typescript
// src/lib/shared/types/mi-feature.ts
export interface MiEntidad {
  id: number;
  nombre: string;
  estado: 'activo' | 'inactivo';
}
```

Re-exportar desde `index.ts`:
```typescript
export type { MiEntidad } from './mi-feature';
```

### 2. Crear Servicio

```typescript
// src/lib/server/mi-feature.service.ts
import { mockFlags } from './mock-flags';
import { mockMiEntidad } from './mock/data';
import { apiFetch } from './api';
import type { MiEntidad } from '$shared/types';

export async function getAll(): Promise<MiEntidad[]> {
  if (mockFlags.miFeature) return mockMiEntidad;
  return apiFetch<MiEntidad[]>('/mi-feature');
}
```

### 3. Agregar Mock Data

```typescript
// src/lib/server/mock/data.ts (agregar)
export const mockMiEntidad: MiEntidad[] = [
  { id: 1, nombre: 'Item 1', estado: 'activo' },
  { id: 2, nombre: 'Item 2', estado: 'inactivo' },
];
```

### 4. Agregar Feature Flag

```typescript
// src/lib/server/mock-flags.ts
export const mockFlags = {
  // ... existentes
  miFeature: env.MOCK_MI_FEATURE === 'true',
};
```

```env
# .env
MOCK_MI_FEATURE=true
```

### 5. Crear Ruta

```
src/routes/[tenantId]/mi-feature/
├── +page.svelte
└── +page.server.ts
```

```typescript
// +page.server.ts
import type { PageServerLoad } from './$types';
import * as miFeatureService from '$lib/server/mi-feature.service';

export const load: PageServerLoad = async () => {
  const items = await miFeatureService.getAll();
  return { items };
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import type { MiEntidad } from '$shared/types';
  let { data } = $props();
</script>

<h1 class="text-display text-2xl text-ink">Mi Feature</h1>

{#each data.items as item}
  <div class="bg-surface border border-border rounded-xl p-4 shadow-[var(--shadow-1)]">
    <span class="text-ink">{item.nombre}</span>
  </div>
{/each}
```

### 6. Agregar Permisos (si aplica)

```typescript
// src/lib/shared/rbac-config.ts
export const P = {
  // ... existentes
  MI_FEATURE_READ: 'mi_feature:read',
  MI_FEATURE_WRITE: 'mi_feature:write',
} as const;

// Agregar a ROLE_PERMISSIONS
const ROLE_PERMISSIONS = {
  analista: [...existentes, P.MI_FEATURE_READ],
  admin: [...existentes, P.MI_FEATURE_READ, P.MI_FEATURE_WRITE],
};
```

```typescript
// src/lib/server/rbac.ts — agregar mapping de ruta
const ROUTE_PERMISSIONS: Record<string, string> = {
  // ... existentes
  'mi-feature': P.MI_FEATURE_READ,
};
```

### 7. Agregar a Navegacion

En `src/routes/[tenantId]/+layout.svelte`, agregar el NavItem:

```svelte
{#snippet miFeatureIcon()}
  <svg viewBox="0 0 24 24">...</svg>
{/snippet}

{@const navItems = [
  // ... existentes
  {
    id: 'mi-feature',
    label: 'Mi Feature',
    href: `/${tenantId}/mi-feature`,
    icon: miFeatureIcon,
    permission: P.MI_FEATURE_READ,
    group: 'Administracion',  // opcional: seccion en sidebar
  },
]}
```

### 8. Crear Componentes (si necesario)

```
src/lib/shared/components/mi-feature/
├── MiComponente.svelte
└── MiOtroComponente.svelte
```

---

## Gotchas y Problemas Conocidos

### Tailwind v4

| Problema | Solucion |
|---|---|
| No existe `tailwind.config.js` | Todo esta en `@theme` de `app.css` |
| Sombras con variables no funcionan | Usar `shadow-[var(--shadow-N)]` |
| `@custom-variant` warning en VS Code | Ignorar. El build compila bien |
| Clases custom no reconocidas | Definirlas en `app.css`, no en archivos separados |

### Svelte 5

| Problema | Solucion |
|---|---|
| No puedo exportar `$state` | Usar patron de clase (como `ThemeStore`) |
| Warning de `bind:this` sin `$state` | Es normal para refs DOM. Ignorar |
| Contexto no es reactivo | Usar getters: `get prop() { return value }` |
| `on:click` no funciona | Svelte 5 usa `onclick` (sin dos puntos) |
| `<slot>` no funciona | Usar `{@render children()}` |
| `createEventDispatcher` | Usar callback props en su lugar |

### Safari

| Problema | Solucion |
|---|---|
| `backdrop-filter` no funciona | Agregar `-webkit-backdrop-filter` |
| Animaciones con glitches | Agregar `-webkit-transform`, `-webkit-animation` |
| Position fixed con bugs | Usar clase `.safe-fixed` |
| Stacking context roto | Usar clase `.portal-container` con `isolation: isolate` |

### General

| Problema | Solucion |
|---|---|
| Cookie auth `httpOnly: false` | Solo dev. Produccion debe usar `true` + `secure` |
| Mock data mutable | Los arrays mock se mutan en memoria (se pierden al reiniciar) |
| No hay validacion client-side | Toda la validacion ocurre server-side via actions |
| Import desde `$lib/server` en componente | Error en build. Solo usar en `+page.server.ts` o `+server.ts` |

---

## Checklist Antes de Hacer Merge

- [ ] Verificar light mode
- [ ] Verificar dark mode
- [ ] Usar tokens semanticos (no colores hardcodeados)
- [ ] Tipos TypeScript correctos (`npm run check` sin errores)
- [ ] Componentes reciben datos via props (no hacen fetch)
- [ ] Permisos RBAC configurados si aplica
- [ ] Mock data agregada si es un nuevo modulo
- [ ] Patrones Svelte 5 (no API legacy)
- [ ] Prefijos `-webkit-` para Safari donde aplique
