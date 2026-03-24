# Arquitectura del Proyecto

## Estructura de Directorios

```
src/
├── app.html                          # HTML base (incluye script anti-FOUC)
├── app.css                           # UNICO archivo de design tokens (@theme)
├── app.d.ts                          # Tipos globales (App.Locals)
├── hooks.server.ts                   # Middleware de auth + RBAC
│
├── routes/                           # Rutas de SvelteKit
│   ├── +layout.svelte                # Layout raiz (importa app.css)
│   ├── +layout.server.ts             # Carga usuario desde locals
│   ├── +page.svelte                  # Landing page
│   ├── login/                        # Login por rol
│   ├── logout/                       # Cierre de sesion
│   ├── hospitals/                    # Seleccion de tenant/hospital
│   └── [tenantId]/                   # RUTAS MULTI-TENANT
│       ├── +layout.svelte            # Shell de la app (sidebar + header)
│       ├── +layout.server.ts         # Guarda de permisos por rol
│       ├── +page.svelte              # Dashboard
│       ├── agendar/                  # Wizard de citas (paciente)
│       │   ├── +page.svelte
│       │   ├── +page.server.ts
│       │   ├── +server.ts            # Endpoint REST alternativo
│       │   └── confirmacion/
│       ├── mis-citas/                # Mis citas (paciente)
│       ├── analista/citas/           # Gestion de citas (analista)
│       ├── doctor/
│       │   ├── citas/                # Citas del doctor
│       │   │   └── [citaId]/         # Evaluacion de una cita
│       │   └── disponibilidad/       # Horarios del doctor
│       ├── patients/                 # Listado de pacientes
│       ├── appointments/             # Vista general de citas
│       └── inventory/                # Inventario
│
└── lib/
    ├── shared/                       # Codigo compartido (client + server)
    │   ├── components/               # ~95 componentes en 19 categorias
    │   │   ├── appointments/         # Componentes de citas (7)
    │   │   ├── avatar/               # Avatares (3)
    │   │   ├── badge/                # Badges (5)
    │   │   ├── button/               # Botones (2)
    │   │   ├── card/                 # Cards (8)
    │   │   ├── dialog/               # Dialogs (7)
    │   │   ├── empty-state/          # Estados vacios (4)
    │   │   ├── file-upload/          # Upload (3)
    │   │   ├── input/                # Inputs (13)
    │   │   ├── layout/               # Layout (4)
    │   │   ├── multi-step-dialog/    # Wizard modal (7)
    │   │   ├── progress/             # Progreso (4)
    │   │   ├── search-dialog/        # Busqueda (1)
    │   │   ├── select/               # Selectores (4)
    │   │   ├── sparkline/            # Mini-graficos (5)
    │   │   ├── stepper/              # Stepper (2)
    │   │   ├── table/                # Tablas (12)
    │   │   ├── tag/                  # Tags (3)
    │   │   └── util/                 # Portal (1)
    │   ├── stores/                   # Stores reactivos
    │   │   ├── theme.svelte.ts       # Store de tema (dark mode)
    │   │   └── index.ts
    │   ├── types/                    # Tipos TypeScript
    │   │   ├── auth.ts               # UserRole, AuthUser
    │   │   ├── appointments.ts       # Modelo de dominio completo
    │   │   ├── navigation.ts         # NavItem, Hospital
    │   │   └── index.ts
    │   ├── hooks/                    # Hooks compartidos
    │   ├── utils/                    # Utilidades
    │   └── rbac-config.ts            # Permisos compartidos
    │
    └── server/                       # Codigo SOLO servidor
        ├── api.ts                    # Cliente HTTP centralizado (apiFetch)
        ├── rbac.ts                   # Guards de permisos server-only
        ├── pacientes.service.ts      # CRUD pacientes
        ├── doctores.service.ts       # CRUD doctores + especialidades
        ├── citas.service.ts          # CRUD citas + filtrado
        ├── slots.service.ts          # Algoritmo de slots disponibles
        ├── historias.service.ts      # Historias medicas
        ├── export.service.ts         # Exportacion de datos
        ├── mock-flags.ts             # Feature flags mock/live
        └── mock/
            └── data.ts              # Datasets mock en memoria
```

---

## Principios Arquitectonicos

### 1. Separacion Server / Shared

```
src/lib/server/    → Solo corre en el servidor (servicios, API, guards)
src/lib/shared/    → Compartido entre server y client (tipos, componentes, stores)
```

**Regla critica**: Nunca importar desde `$lib/server/` dentro de un componente `.svelte` o un store. SvelteKit lanzara error en build.

```typescript
// CORRECTO — en +page.server.ts
import { findByCedula } from '$lib/server/pacientes.service';

// INCORRECTO — en un componente .svelte
import { findByCedula } from '$lib/server/pacientes.service'; // ERROR
```

### 2. Datos Fluyen desde el Servidor

Los componentes **nunca** hacen fetch directamente. Los datos llegan via:

```
+page.server.ts (load)  →  +page.svelte (data prop)  →  Componente (props)
```

```typescript
// +page.server.ts
export const load = async () => {
  const doctores = await getDoctorOptions();
  return { doctores };  // Disponible como data.doctores en +page.svelte
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  let { data } = $props();
</script>

<MiComponente doctores={data.doctores} />
```

### 3. Un Servicio por Entidad

Cada entidad del dominio tiene su archivo de servicio en `src/lib/server/`:

| Servicio | Entidad | Funciones principales |
|---|---|---|
| `pacientes.service.ts` | Pacientes | findByNHM, findByCedula, createPaciente |
| `doctores.service.ts` | Doctores | getDoctorOptions, getEspecialidades, getDisponibilidad |
| `citas.service.ts` | Citas | createCita, getCitasByFilters, updateEstadoCita |
| `slots.service.ts` | Slots | calculateAvailableSlots (funcion pura) |
| `historias.service.ts` | Historias | getHistoriaMedica, createEvaluacion |

### 4. Componentes sin Logica de Negocio

Los componentes solo se encargan de:
- Renderizar UI basada en props
- Manejar interacciones del usuario (clicks, inputs)
- Emitir eventos/callbacks hacia arriba

Los componentes **no deben**:
- Hacer llamadas a API
- Acceder a servicios del servidor
- Contener reglas de negocio complejas

### 5. Tipos como Contrato

Los tipos en `src/lib/shared/types/` son el contrato entre servidor y cliente. Si el backend cambia su respuesta, se actualiza el tipo y TypeScript te dice que componentes necesitan adaptarse.

---

## Alias de Paths

Definidos en `svelte.config.js`:

| Alias | Resuelve a | Uso |
|---|---|---|
| `$lib` | `./src/lib` | Acceso a lib/ en general |
| `$shared` | `./src/lib/shared` | Componentes, tipos, stores |

```typescript
// Preferido
import Button from '$shared/components/button/Button.svelte';
import type { AuthUser } from '$shared/types';
import { themeStore } from '$shared/stores/theme.svelte';
import { hasPermission } from '$shared/rbac-config';

// Evitar rutas relativas largas
import Button from '../../../lib/shared/components/button/Button.svelte'; // NO
```

---

## Diagrama de Flujo de una Peticion

```
Browser
  │
  ▼
hooks.server.ts ──── Parsea cookie auth
  │                   Verifica permisos
  │                   Asigna locals.user
  ▼
+layout.server.ts ── Carga datos del layout (user)
  │
  ▼
+page.server.ts ──── Carga datos de la pagina
  │                   ├── *.service.ts → mockFlags? → mock data
  │                   └── *.service.ts → apiFetch() → FastAPI
  ▼
+layout.svelte ───── Renderiza shell (sidebar + header)
  │
  ▼
+page.svelte ──────── Renderiza contenido de pagina
  │
  ▼
Componentes ─────── Renderizan UI via props
```
