# Sistema de Componentes

## Catalogo de Componentes (~95 archivos, 19 categorias)

| Categoria | Componentes | Descripcion |
|---|---|---|
| **layout** | TenantLayout, Sidebar, Header, ThemeToggle | Shell de la aplicacion |
| **button** | Button, IconButton | Botones con variantes y tamanos |
| **input** | Input, Select, Checkbox, Switch, DateInput, SearchInput, EmailInput, PasswordInput, PhoneInput, NumberInput, CurrencyInput, RadioGroup, Textarea, TimeInput | Controles de formulario |
| **card** | Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription, MetricCard, StatCard | Contenedores de informacion |
| **dialog** | Dialog, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription, DialogButton | Modales y overlays |
| **multi-step-dialog** | MultiStepDialog, MultiStepDialogHeader, MultiStepDialogBody, MultiStepDialogFooter, MultiStepDialogTitle, MultiStepDialogDescription, MultiStepDialogPanel | Wizard modal multi-paso |
| **table** | DataTable, EditableTable, Table, TableHead, TableHeader, TableBody, TableRow, TableCell, TableCheckbox, TableEmpty, TableRowAction, TablePagination | Tablas de datos |
| **badge** | Badge, StatusBadge, PriorityBadge, CountBadge, StockBadge | Indicadores de estado |
| **tag** | Tag, CategoryTag, FilterPill | Etiquetas y filtros |
| **avatar** | Avatar, AvatarGroup, UserAvatar | Avatares de usuario |
| **progress** | Progress, CircularProgress, MiniRing, StockProgress | Barras y anillos de progreso |
| **sparkline** | Sparkline, MiniBarChart, TrendIndicator, ProgressRing, StockIndicator | Mini-graficos y tendencias |
| **empty-state** | EmptyState, ErrorState, NoDataState, NoResultsState | Estados vacios y de error |
| **file-upload** | FileUpload, ImageUpload, AvatarUpload | Carga de archivos |
| **stepper** | Stepper, StepContent | Indicador de pasos |
| **select** | Select, Autocomplete, Combobox, MultiSelect | Selectores avanzados |
| **search-dialog** | SearchDialog | Busqueda global |
| **appointments** | AppointmentBookingWizard, AppointmentFilters, AppointmentStatusBadge, DoctorAvailabilityCalendar, MedicalEvaluationForm, TimeSlotPicker, VirtualList | Componentes de dominio (citas) |
| **util** | Portal | Utilidades de renderizado |

---

## Patron Estandar de Componente

Todo componente nuevo debe seguir esta estructura:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  // ─── 1. TIPOS ───────────────────────────────
  type Variant = 'primary' | 'secondary' | 'ghost';
  type Size = 'sm' | 'md' | 'lg';

  // ─── 2. MAPAS DE ESTILOS ───────────────────
  const variantStyles: Record<Variant, string> = {
    primary: 'bg-viking-600 text-white hover:bg-viking-700 btn-shine',
    secondary: 'bg-surface-elevated text-ink border border-border',
    ghost: 'text-ink-muted hover:bg-canvas-subtle',
  };

  const sizeStyles: Record<Size, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-5 text-base',
  };

  // ─── 3. PROPS ───────────────────────────────
  interface Props {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    icon?: Snippet;
    children?: Snippet;
    onclick?: () => void;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    icon,
    children,
    onclick,
    ...restProps
  } = $props<Props>();

  // ─── 4. ESTADO Y DERIVADOS ─────────────────
  let isDisabled = $derived(disabled);

  // ─── 5. HANDLERS ───────────────────────────
  function handleClick() {
    if (!isDisabled) onclick?.();
  }
</script>

<!-- ─── 6. MARKUP ──────────────────────────── -->
<button
  class="{variantStyles[variant]} {sizeStyles[size]}
         rounded-lg font-medium cursor-pointer
         transition-all duration-[var(--duration-normal)] ease-[var(--ease-gentle)]
         disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={isDisabled}
  {onclick}
  {...restProps}
>
  {#if icon}
    <span class="flex-shrink-0 w-4 h-4">{@render icon()}</span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
```

---

## Reglas de Composicion

### 1. Snippets, no Slots

**Siempre** usar `Snippet` de Svelte 5:

```svelte
<!-- CORRECTO -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { header, children }: { header?: Snippet; children?: Snippet } = $props();
</script>

{#if header}{@render header()}{/if}
{#if children}{@render children()}{/if}

<!-- INCORRECTO -->
<slot name="header" />
<slot />
```

### 2. Rest Props al Elemento Raiz

Siempre capturar y pasar `...restProps` para permitir atributos HTML nativos:

```svelte
<script lang="ts">
  let { variant, children, ...restProps } = $props();
</script>

<div {...restProps}>
  {@render children()}
</div>
```

Esto permite al padre pasar `class`, `id`, `aria-label`, `data-*`, etc.

### 3. Record Tipado para Variantes

Usar `Record<Variant, string>` para mapear variantes a clases. TypeScript verifica que todos los valores estan cubiertos:

```typescript
type Status = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada';

// Si agregas un nuevo status y olvidas agregarlo aqui, TypeScript da error
const statusColors: Record<Status, string> = {
  pendiente: 'bg-honey-100 text-honey-800',
  confirmada: 'bg-viking-100 text-viking-800',
  atendida: 'bg-sage-100 text-sage-800',
  cancelada: 'bg-red-100 text-red-800',
};
```

### 4. Clases Semanticas (No Hardcodear Colores)

```svelte
<!-- CORRECTO: tokens semanticos -->
<div class="bg-surface text-ink border border-border">
<p class="text-ink-muted">Secundario</p>

<!-- INCORRECTO: colores fijos -->
<div class="bg-white text-gray-800 border border-gray-200">
<p class="text-gray-500">Secundario</p>
```

Esto garantiza que dark mode funcione automaticamente.

### 5. Portal para Overlays

Modales, dialogs, popovers y tooltips **siempre** deben usar Portal:

```svelte
<script lang="ts">
  import Portal from '$shared/components/util/Portal.svelte';
</script>

{#if open}
  <Portal>
    <div class="fixed inset-0 z-50">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        style="-webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px)"
        onclick={close}
      ></div>
      <!-- Panel -->
      <div class="relative mx-auto mt-20 max-w-lg bg-surface rounded-xl shadow-[var(--shadow-4)]">
        ...
      </div>
    </div>
  </Portal>
{/if}
```

> **Por que Portal?** Mueve el contenido al `<body>`, evitando problemas de stacking context (`z-index`, `overflow: hidden` del padre, etc.).

### 6. Componentes No Hacen Fetch

Los componentes reciben datos por props. No deben hacer llamadas HTTP:

```svelte
<!-- CORRECTO -->
<script lang="ts">
  let { doctores, onSelect } = $props<{
    doctores: Doctor[];
    onSelect: (d: Doctor) => void;
  }>();
</script>

<!-- INCORRECTO -->
<script lang="ts">
  import { onMount } from 'svelte';
  let doctores = $state([]);
  onMount(async () => {
    doctores = await fetch('/api/doctores').then(r => r.json());  // NO
  });
</script>
```

---

## Componentes Clave

### TenantLayout

Shell principal de la aplicacion para roles staff:

```svelte
<TenantLayout
  tenantId="hospital-general"
  tenantName="Hospital General"
  user={{ id: '1', name: 'Admin', role: 'admin', initials: 'AD' }}
  hospitals={[{ id: '1', name: 'Hospital General' }]}
  navItems={[
    { id: 'dashboard', label: 'Dashboard', href: '/hospital-general', icon: dashboardIcon },
    { id: 'citas', label: 'Citas', href: '/hospital-general/appointments', icon: citasIcon },
  ]}
  onLogout={() => goto('/logout')}
>
  <!-- Contenido de la pagina -->
  <h1>Dashboard</h1>
</TenantLayout>
```

### Dialog

Modal con backdrop, animaciones responsivas y focus trap:

```svelte
<Dialog open={isOpen} onClose={() => isOpen = false} size="md">
  <DialogHeader>
    <DialogTitle>Confirmar Accion</DialogTitle>
    <DialogDescription>Esta accion no se puede deshacer.</DialogDescription>
  </DialogHeader>
  <DialogBody>
    <p>Contenido del dialog...</p>
  </DialogBody>
  <DialogFooter>
    <DialogButton variant="secondary" onclick={() => isOpen = false}>Cancelar</DialogButton>
    <DialogButton variant="primary" onclick={confirmar}>Confirmar</DialogButton>
  </DialogFooter>
</Dialog>
```

Comportamiento responsivo:
- **Mobile**: Drawer desde abajo (slide-up)
- **Desktop**: Modal centrado (zoom-in-95)

### Card

Contenedor con variantes de estilo:

```svelte
<!-- Card con elevacion (default) -->
<Card>
  <CardHeader>
    <CardTitle>Titulo</CardTitle>
  </CardHeader>
  <CardBody>Contenido</CardBody>
  <CardFooter>Acciones</CardFooter>
</Card>

<!-- Card como boton (clickeable) -->
<Card onclick={() => selectItem(item)} variant="ghost">
  <CardBody>Click me</CardBody>
</Card>

<!-- Variantes: default, elevated, ghost, flat -->
<!-- Padding: none, sm, md, lg, xl -->
```

### StatCard

Card para metricas con numero hero:

```svelte
<StatCard
  title="Citas Hoy"
  value="42"
  subtitle="+12% vs ayer"
  accent="viking"
  trend="up"
/>
```

### Componentes de Formulario

Todos los inputs siguen el mismo patron:

```svelte
<Input
  label="Nombre"
  placeholder="Ingrese nombre..."
  error={errors.nombre}
  hint="Campo obligatorio"
  bind:value={nombre}
/>

<Select
  label="Especialidad"
  options={especialidades}
  bind:value={selectedEspecialidad}
/>

<DateInput
  label="Fecha"
  min={minDate}
  bind:value={fecha}
/>

<Switch
  label="Activo"
  bind:checked={isActive}
/>
```

---

## Ubicacion de Componentes

Todos los componentes reutilizables van en:

```
src/lib/shared/components/{categoria}/
```

### Nombrar Componentes

- **PascalCase** para el archivo: `AppointmentBookingWizard.svelte`
- **Directorio en kebab-case**: `src/lib/shared/components/empty-state/`
- **Subcomponentes con prefijo**: `DialogHeader.svelte`, `DialogBody.svelte`, `DialogFooter.svelte`

### Crear un Nuevo Componente

1. Determinar la categoria (o crear nueva si no encaja)
2. Crear en `src/lib/shared/components/{categoria}/MiComponente.svelte`
3. Seguir el patron estandar (tipos → estilos → props → derivados → markup)
4. Usar tokens semanticos del design system
5. Probar en light y dark mode
