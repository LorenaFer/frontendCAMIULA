# Integracion con Backend (FastAPI)

## Arquitectura de Integracion

```
Componentes (UI)
      ↕ props
+page.svelte
      ↕ data
+page.server.ts / +server.ts
      ↕ funciones
*.service.ts
      ↕ mockFlags check
   ┌──┴──┐
mock/     apiFetch()
data.ts   → FastAPI (http://localhost:8000)
```

---

## Cliente HTTP Centralizado

### `src/lib/server/api.ts`

```typescript
import { env } from '$env/dynamic/private';

const API_URL = env.API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API Error ${status}`);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json().catch(() => null));
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}
```

### Caracteristicas

- **Timeout**: 15 segundos con `AbortController`
- **Tipado generico**: `apiFetch<T>()` retorna `Promise<T>`
- **Error tipado**: `ApiError` con status y body
- **Content-Type**: JSON por defecto
- **Base URL**: Configurable via env var `API_URL`

### Uso

```typescript
// GET
const doctores = await apiFetch<Doctor[]>('/doctores');

// POST con body
const cita = await apiFetch<Cita>('/citas', {
  method: 'POST',
  body: JSON.stringify({ paciente_id: 1, doctor_id: 2, fecha: '2026-03-25' }),
});

// Con query params
const paciente = await apiFetch<Paciente>(`/pacientes/cedula/${cedula}`);
```

---

## Sistema Mock / Live

### Feature Flags

```typescript
// src/lib/server/mock-flags.ts
import { env } from '$env/dynamic/private';

export const mockFlags = {
  pacientes: env.MOCK_PACIENTES === 'true',
  doctores:  env.MOCK_DOCTORES === 'true',
  citas:     env.MOCK_CITAS === 'true',
  historias: env.MOCK_HISTORIAS === 'true',
};
```

### Variables de Entorno (`.env`)

```env
API_URL=http://localhost:8000
MOCK_PACIENTES=true     # true = datos mock, false = FastAPI real
MOCK_DOCTORES=true
MOCK_CITAS=true
MOCK_HISTORIAS=true
```

### Patron en Servicios

Cada servicio verifica el flag antes de decidir la fuente de datos:

```typescript
// src/lib/server/pacientes.service.ts
import { mockFlags } from './mock-flags';
import { mockPacientes } from './mock/data';
import { apiFetch } from './api';
import type { PacientePublic, Paciente } from '$shared/types';

export async function findByCedula(cedula: string): Promise<PacientePublic | null> {
  if (mockFlags.pacientes) {
    // Mock: buscar en array en memoria
    const found = mockPacientes.find(p => p.cedula === cedula);
    if (!found) return null;
    return {
      id: found.id,
      nhm: found.nhm,
      nombre: found.nombre,
      apellido: found.apellido,
      relacion_univ: found.relacion_univ,
      es_nuevo: false,
    };
  }

  // Live: llamar al backend
  try {
    return await apiFetch<PacientePublic>(`/pacientes/cedula/${cedula}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createPaciente(input: CreatePacienteInput): Promise<Paciente> {
  if (mockFlags.pacientes) {
    // Mock: crear en memoria
    const nuevo = { id: mockPacientes.length + 1, ...input };
    mockPacientes.push(nuevo);
    return nuevo;
  }

  return apiFetch<Paciente>('/pacientes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
```

### Datos Mock

```typescript
// src/lib/server/mock/data.ts
export const mockPacientes: Paciente[] = [
  {
    id: 1,
    nhm: 1001,
    cedula: 'V-12345678',
    nombre: 'Maria',
    apellido: 'Garcia',
    relacion_univ: 'empleado',
    // ...
  },
  // ... mas datos
];

export const mockDoctores: DoctorOption[] = [...];
export const mockEspecialidades: Especialidad[] = [...];
export const mockCitas: Cita[] = [...];
```

---

## Consumir Datos desde Paginas

### Load Functions (Recomendado)

Para cargar datos al abrir una pagina:

```typescript
// src/routes/[tenantId]/agendar/+page.server.ts
import type { PageServerLoad } from './$types';
import * as doctoresService from '$lib/server/doctores.service';

export const load: PageServerLoad = async () => {
  // Cargas paralelas
  const [doctores, especialidades] = await Promise.all([
    doctoresService.getDoctorOptions(),
    doctoresService.getEspecialidades(),
  ]);

  return {
    doctores,
    especialidades,
    minDate: getMinBookingDate(),
  };
};
```

```svelte
<!-- src/routes/[tenantId]/agendar/+page.svelte -->
<script lang="ts">
  let { data } = $props();
  // data.doctores, data.especialidades, data.minDate disponibles
</script>
```

### Server Actions (Formularios)

Para operaciones que modifican datos:

```typescript
// +page.server.ts
export const actions = {
  crearCita: async ({ request, locals }) => {
    assertPermission(locals.user, P.CITAS_CREATE);
    const fd = await request.formData();

    const result = await citasService.createCita({
      paciente_id: Number(fd.get('pacienteId')),
      doctor_id: Number(fd.get('doctorId')),
      fecha: String(fd.get('fecha')),
    });

    return { success: true, citaId: result.id };
  }
};
```

### REST Endpoints (JSON API)

Para operaciones asincronas sin recarga:

```typescript
// +server.ts
export const POST: RequestHandler = async ({ request }) => {
  const { action, ...data } = await request.json();

  if (action === 'buscarPaciente') {
    const paciente = await pacientesService.findByCedula(data.cedula);
    return json({ status: 'success', data: paciente });
  }

  return json({ status: 'error', message: 'Unknown action' }, { status: 400 });
};
```

---

## Agregar un Nuevo Modulo

### Paso 1: Feature Flag

```typescript
// src/lib/server/mock-flags.ts
export const mockFlags = {
  // ... existentes
  inventario: env.MOCK_INVENTARIO === 'true',  // nuevo
};
```

```env
# .env
MOCK_INVENTARIO=true
```

### Paso 2: Mock Data

```typescript
// src/lib/server/mock/data.ts
export const mockInventario: InventarioItem[] = [
  { id: 1, nombre: 'Paracetamol 500mg', stock: 150, minStock: 50 },
  { id: 2, nombre: 'Ibuprofeno 400mg', stock: 30, minStock: 40 },
  // ...
];
```

### Paso 3: Servicio

```typescript
// src/lib/server/inventario.service.ts
import { mockFlags } from './mock-flags';
import { mockInventario } from './mock/data';
import { apiFetch } from './api';
import type { InventarioItem } from '$shared/types';

export async function getItems(): Promise<InventarioItem[]> {
  if (mockFlags.inventario) return mockInventario;
  return apiFetch<InventarioItem[]>('/inventario');
}

export async function updateStock(id: number, cantidad: number): Promise<void> {
  if (mockFlags.inventario) {
    const item = mockInventario.find(i => i.id === id);
    if (item) item.stock = cantidad;
    return;
  }
  await apiFetch(`/inventario/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock: cantidad }),
  });
}
```

### Paso 4: Usar en Ruta

```typescript
// src/routes/[tenantId]/inventory/+page.server.ts
import * as inventarioService from '$lib/server/inventario.service';

export const load = async () => {
  const items = await inventarioService.getItems();
  return { items };
};
```

---

## Manejo de Errores

### En Servicios

```typescript
try {
  return await apiFetch<Paciente>(`/pacientes/${id}`);
} catch (e) {
  if (e instanceof ApiError) {
    if (e.status === 404) return null;       // No encontrado
    if (e.status === 409) throw e;           // Conflicto (propagar)
  }
  throw e;  // Error inesperado (propagar)
}
```

### En Server Actions

```typescript
import { fail } from '@sveltejs/kit';

export const actions = {
  crear: async ({ request }) => {
    // Validacion
    if (!campo) return fail(400, { error: 'Campo requerido' });

    try {
      await servicio.crear(datos);
      return { success: true };
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        return fail(409, { error: 'Ya existe un registro con esos datos' });
      }
      return fail(500, { error: 'Error interno del servidor' });
    }
  }
};
```

### Codigos de Estado

| Codigo | Significado | Uso |
|---|---|---|
| 200 | OK | Operacion exitosa |
| 400 | Bad Request | Datos invalidos o faltantes |
| 403 | Forbidden | Sin permiso (RBAC) |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Duplicado o conflicto de estado |
| 500 | Server Error | Error inesperado |
