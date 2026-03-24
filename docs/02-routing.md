# Rutas y Multi-Tenancy

## Flujo de Navegacion

```
Login → Seleccion de Hospital → /[tenantId]/... (rutas del hospital)
```

El segmento dinamico `[tenantId]` en la URL captura el ID del hospital seleccionado (ej: `/general-hospital/agendar`). Todas las rutas dentro estan protegidas por autenticacion y permisos RBAC.

---

## Mapa de Rutas

| Ruta | Rol | Descripcion |
|---|---|---|
| `/` | publico | Landing page |
| `/login` | publico | Seleccion de rol (mock auth) |
| `/logout` | autenticado | Cierre de sesion |
| `/hospitals` | autenticado | Seleccion de hospital/tenant |
| `/[tenantId]` | staff | Dashboard |
| `/[tenantId]/agendar` | paciente | Wizard para agendar cita |
| `/[tenantId]/agendar/confirmacion` | paciente | Confirmacion de cita |
| `/[tenantId]/mis-citas` | paciente | Listado de mis citas |
| `/[tenantId]/analista/citas` | analista | Gestion de citas |
| `/[tenantId]/doctor/citas` | doctor | Citas del doctor |
| `/[tenantId]/doctor/citas/[citaId]` | doctor | Evaluacion de una cita |
| `/[tenantId]/doctor/disponibilidad` | doctor | Configurar horarios |
| `/[tenantId]/appointments` | staff | Vista general de citas |
| `/[tenantId]/patients` | staff | Listado de pacientes |
| `/[tenantId]/inventory` | staff | Inventario |

---

## Layouts Anidados

SvelteKit usa layouts anidados. Cada nivel hereda del anterior:

```
+layout.svelte                          ← Raiz: importa CSS global
  └── [tenantId]/+layout.svelte         ← App shell
        ├── Pacientes: Header + tabs
        └── Staff: TenantLayout (sidebar + header + search)
```

### Layout Raiz (`src/routes/+layout.svelte`)

Minimo: solo importa `app.css` y renderiza hijos.

```svelte
<script>
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

### Layout Tenant (`src/routes/[tenantId]/+layout.svelte`)

El layout principal de la app. Renderiza UI diferente segun el rol:

- **Paciente**: Header minimo con tabs "Agendar" y "Mis Citas"
- **Staff** (analista, doctor, admin): `TenantLayout` completo con sidebar, header, buscador

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import TenantLayout from '$shared/components/layout/TenantLayout.svelte';

  let { data, children } = $props();
  let tenantId = $derived($page.params.tenantId);

  // Nav items filtrados por permiso del usuario
  let navItems = $derived.by(() => {
    return allNavItems.filter(item =>
      !item.permission || hasPermission(data.user.role, item.permission)
    );
  });
</script>

{#if data.user.role === 'paciente'}
  <!-- Layout simple para pacientes -->
  <header>...</header>
  {@render children()}
{:else}
  <!-- Layout completo para staff -->
  <TenantLayout {tenantId} {navItems} user={data.user}>
    {@render children()}
  </TenantLayout>
{/if}
```

---

## Load Functions (Carga de Datos)

Cada pagina carga sus datos en `+page.server.ts`. El resultado esta disponible como `data` prop en `+page.svelte`.

### Patron Basico

```typescript
// src/routes/[tenantId]/agendar/+page.server.ts
import type { PageServerLoad } from './$types';
import * as doctoresService from '$lib/server/doctores.service';

export const load: PageServerLoad = async () => {
  const [doctores, especialidades] = await Promise.all([
    doctoresService.getDoctorOptions(),
    doctoresService.getEspecialidades()
  ]);

  return { doctores, especialidades };
};
```

> **Regla**: Siempre usar `Promise.all()` cuando hay multiples cargas independientes.

### Acceso a Params y Locals

```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const tenantId = params.tenantId;           // Parametro de la URL
  const user = locals.user;                    // Usuario del middleware
  const doctorId = requireDoctorId(user);      // Extraer doctorId o lanzar 403

  const citas = await citasService.getCitasByDoctor(doctorId);
  return { citas };
};
```

---

## Server Actions (Formularios)

Para operaciones que modifican datos (crear, actualizar, eliminar), usar server actions en `+page.server.ts`:

```typescript
// src/routes/[tenantId]/doctor/citas/+page.server.ts
import { fail } from '@sveltejs/kit';
import { assertActionPermission } from '$lib/server/rbac';
import * as citasService from '$lib/server/citas.service';

export const actions = {
  marcarAtendida: async ({ request, locals }) => {
    // 1. Verificar permisos
    assertActionPermission(locals.user, 'marcarAtendida');

    // 2. Extraer datos del formulario
    const fd = await request.formData();
    const citaId = parseInt(String(fd.get('citaId') ?? ''), 10);

    // 3. Validar
    if (isNaN(citaId)) return fail(400, { error: 'ID de cita invalido' });

    // 4. Ejecutar
    await citasService.updateEstadoCita(citaId, 'atendida');
    return { success: true };
  },

  cancelarCita: async ({ request, locals }) => {
    assertActionPermission(locals.user, 'cancelarCita');
    // ...
  }
};
```

### Consumir Actions desde el Componente

```svelte
<form method="POST" action="?/marcarAtendida">
  <input type="hidden" name="citaId" value={cita.id} />
  <Button type="submit">Marcar como atendida</Button>
</form>
```

---

## REST Endpoints (Alternativo)

Para flujos SPA-style que necesitan respuestas JSON (ej: el wizard de citas que busca pacientes sin recargar):

```typescript
// src/routes/[tenantId]/agendar/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  switch (body.action) {
    case 'buscarPaciente': {
      const paciente = await pacientesService.findByCedula(body.cedula);
      if (!paciente) {
        return json({ status: 'error', message: 'No encontrado' }, { status: 404 });
      }
      return json({ status: 'success', data: paciente });
    }

    case 'confirmarCita': {
      // Validar...
      const cita = await citasService.createCita(body);
      return json({ status: 'success', data: cita });
    }

    default:
      return json({ status: 'error', message: 'Accion desconocida' }, { status: 400 });
  }
};
```

### Consumir desde el Componente

```typescript
const res = await fetch(`/${tenantId}/agendar`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'buscarPaciente', cedula: '12345678' })
});
const result = await res.json();
```

### Cuando usar cada patron

| Patron | Cuando usar |
|---|---|
| **Load function** | Cargar datos al abrir la pagina |
| **Server action** | Envio de formularios con recarga (progressive enhancement) |
| **REST endpoint** | Operaciones asincronas sin recarga (wizard, busquedas, etc.) |

---

## Transiciones de Pagina

El layout tenant usa `{#key}` para animar cambios de ruta:

```svelte
{#key $page.url.pathname}
  <main class="animate-page-enter">
    {@render children()}
  </main>
{/key}
```

Cada vez que cambia la URL, el contenido se re-renderiza con la animacion `page-enter` (fade + slide-up de 6px).

---

## Agregar una Nueva Ruta

1. Crear directorio en `src/routes/[tenantId]/mi-ruta/`
2. Crear `+page.svelte` (UI) y `+page.server.ts` (datos)
3. Agregar permiso en `rbac-config.ts` si es necesario
4. Mapear ruta a permiso en `src/lib/server/rbac.ts` (`ROUTE_PERMISSIONS`)
5. Agregar `NavItem` en `[tenantId]/+layout.svelte`

```typescript
// src/lib/server/rbac.ts — agregar mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
  '': P.DASHBOARD_READ,
  'mi-ruta': P.MI_PERMISO,  // nuevo
  // ...
};
```
