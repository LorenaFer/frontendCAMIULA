# Autenticacion y RBAC

## Roles del Sistema

| Rol | Descripcion | Acceso |
|---|---|---|
| `paciente` | Paciente que agenda citas | Solo `/agendar` y `/mis-citas` |
| `analista` | Gestiona citas y pacientes | Dashboard, citas, pacientes |
| `doctor` | Atiende pacientes, configura horarios | Dashboard, citas, disponibilidad, evaluaciones |
| `admin` | Acceso total a todas las funcionalidades | Todas las rutas y acciones |

---

## Flujo de Autenticacion

```
1. Usuario entra a /login
2. Selecciona rol → cookie "mock_auth" con datos del usuario
3. Redirigido a /hospitals
4. Selecciona hospital → navega a /[tenantId]
5. Middleware (hooks.server.ts) valida en cada request:
   - Cookie presente? → Si no, redirigir a /login
   - Ruta publica? → Dejar pasar
   - Tiene permiso? → Si no, redirigir o 403
```

> **Nota**: El sistema actual usa mock auth con cookies. En produccion, reemplazar con JWT u OAuth.

---

## Middleware de Auth (`hooks.server.ts`)

El archivo `src/hooks.server.ts` intercepta **toda** peticion HTTP:

```typescript
export const handle: Handle = async ({ event, resolve }) => {
  // 1. Parsear cookie de auth
  const authCookie = event.cookies.get('mock_auth');
  if (authCookie) {
    event.locals.user = JSON.parse(authCookie);
  }

  // 2. Rutas publicas (no requieren auth)
  const publicRoutes = ['/', '/login', '/logout'];
  if (publicRoutes.includes(event.url.pathname)) {
    return resolve(event);
  }

  // 3. Verificar login
  if (!event.locals.user) {
    throw redirect(303, '/login');
  }

  // 4. Rutas tenant: verificar permisos
  const match = event.url.pathname.match(/^\/([^/]+)\/(.*)/);
  if (match) {
    const routePath = match[2];
    const requiredPermission = getRequiredPermission(routePath);
    if (requiredPermission && !hasPermission(event.locals.user.role, requiredPermission)) {
      throw redirect(303, `/${match[1]}`);
    }
  }

  return resolve(event);
};
```

---

## Sistema de Permisos

### Formato: `recurso:accion`

Todos los permisos siguen el formato `recurso:accion`:

```typescript
// src/lib/shared/rbac-config.ts
export const P = {
  // Citas
  CITAS_READ:             'citas:read',
  CITAS_CREATE:           'citas:create',
  CITAS_CANCEL:           'citas:cancel',
  CITAS_MARK_ATTENDED:    'citas:mark_attended',
  CITAS_MARK_NOSHOW:      'citas:mark_noshow',
  CITAS_CREATE_EMERGENCY: 'citas:create_emergency',
  CITAS_EXPORT:           'citas:export',

  // Pacientes
  PACIENTES_READ:         'pacientes:read',
  PACIENTES_CREATE:       'pacientes:create',

  // Disponibilidad
  DISPONIBILIDAD_READ:    'disponibilidad:read',
  DISPONIBILIDAD_CREATE:  'disponibilidad:create',
  DISPONIBILIDAD_UPDATE:  'disponibilidad:update',
  DISPONIBILIDAD_DELETE:  'disponibilidad:delete',

  // Evaluaciones
  EVALUACIONES_READ:      'evaluaciones:read',
  EVALUACIONES_WRITE:     'evaluaciones:write',

  // Sistema
  DASHBOARD_READ:         'dashboard:read',
  INVENTORY_READ:         'inventory:read',
} as const;
```

### Matriz Rol → Permisos

| Permiso | paciente | analista | doctor | admin |
|---|:---:|:---:|:---:|:---:|
| citas:read | x | x | x | x |
| citas:create | x | x | x | x |
| citas:cancel | | x | | x |
| citas:mark_attended | | | x | x |
| citas:mark_noshow | | | x | x |
| citas:create_emergency | | | x | x |
| citas:export | | x | | x |
| pacientes:read | x | x | x | x |
| pacientes:create | x | x | x | x |
| disponibilidad:* | | | x | x |
| evaluaciones:* | | | x | x |
| dashboard:read | | x | x | x |
| inventory:read | | | | x |

---

## Usar Permisos

### En Server Actions / Load Functions

```typescript
import { assertPermission, requireDoctorId } from '$lib/server/rbac';
import { P } from '$shared/rbac-config';

// Lanza error 403 si no tiene el permiso
assertPermission(locals.user, P.CITAS_CANCEL);

// Lanza 403 si no es doctor (extrae doctorId)
const doctorId = requireDoctorId(locals.user);
```

### En Componentes (Filtrar UI)

```typescript
import { hasPermission } from '$shared/rbac-config';

// Filtrar elementos de navegacion
let navItems = $derived(
  allItems.filter(item =>
    !item.permission || hasPermission(user.role, item.permission)
  )
);
```

```svelte
<!-- Mostrar boton solo si tiene permiso -->
{#if hasPermission(user.role, P.CITAS_CANCEL)}
  <Button onclick={cancelar}>Cancelar Cita</Button>
{/if}
```

### En Mapeo de Rutas

```typescript
// src/lib/server/rbac.ts
const ROUTE_PERMISSIONS: Record<string, string> = {
  '':                     P.DASHBOARD_READ,
  'agendar':              P.CITAS_CREATE,
  'mis-citas':            P.CITAS_READ,
  'analista/citas':       P.CITAS_CANCEL,
  'doctor/citas':         P.CITAS_MARK_ATTENDED,
  'doctor/disponibilidad': P.DISPONIBILIDAD_READ,
  'appointments':         P.CITAS_READ,
  'patients':             P.PACIENTES_READ,
  'inventory':            P.INVENTORY_READ,
};
```

---

## Agregar un Nuevo Permiso

1. **Definir constante** en `src/lib/shared/rbac-config.ts`:
   ```typescript
   P.MI_RECURSO_READ = 'mi_recurso:read';
   ```

2. **Asignar a roles** en `ROLE_PERMISSIONS`:
   ```typescript
   analista: [...existentes, P.MI_RECURSO_READ],
   admin: [...existentes, P.MI_RECURSO_READ],
   ```

3. **Mapear ruta** en `src/lib/server/rbac.ts`:
   ```typescript
   'mi-ruta': P.MI_RECURSO_READ,
   ```

4. **Proteger actions** con `assertPermission()`:
   ```typescript
   assertPermission(locals.user, P.MI_RECURSO_READ);
   ```

---

## Mock Users (Desarrollo)

Para desarrollo, el sistema incluye usuarios mock:

```typescript
// src/lib/server/rbac.ts
const MOCK_USERS = {
  paciente: { id: 'pac-1', name: 'Pedro Gonzalez', role: 'paciente', initials: 'PG' },
  analista: { id: 'ana-1', name: 'Sofia Ramirez', role: 'analista', initials: 'SR' },
  doctor:   { id: 'doc-1', name: 'Dr. Carlos Mendoza', role: 'doctor', initials: 'CM', doctorId: 1 },
  admin:    { id: 'adm-1', name: 'Admin Principal', role: 'admin', initials: 'AP', doctorId: 1 },
};
```

En la pagina de login, se selecciona un rol y se almacena el mock user en cookie.

> **Cookie**: `mock_auth` con `httpOnly: false` (solo dev). En produccion, usar `httpOnly: true` + `secure: true`.
