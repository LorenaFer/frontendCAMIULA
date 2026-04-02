# Modulo: Autenticacion y Autorizacion

Sistema de autenticacion basado en cookies y control de acceso por roles (RBAC nivel 2 segun NIST).

---

## Endpoints

### 1. POST `/auth/staff/login`

Inicio de sesion para personal (analistas, doctores, farmaceuticos, administradores).

**Request:**

```typescript
// Content-Type: application/x-www-form-urlencoded (FormData)
{
  username: string;  // Nombre de usuario (case-insensitive)
  password: string;  // Contrasena en texto plano (mock), bcrypt en produccion
}
```

**Response exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "id": "staff-002",
    "name": "Dr. Carlos Mendoza",
    "role": "doctor",
    "initials": "CM",
    "doctor_id": "doc-001"
  }
}
```

**Side effect:** Establece cookie `mock_auth` con el `AuthUser` serializado en JSON.

**Errores:**

| Codigo | Condicion |
|--------|-----------|
| `400` | `username` o `password` vacios |
| `401` | Credenciales incorrectas |

**Redireccion post-login (la maneja el frontend):**
- Rol `doctor` -> `/doctor/citas`
- Otros roles -> `/` (dashboard)

---

### 2. POST `/auth/patient/login`

Inicio de sesion para pacientes. **No requiere contrasena** -- se autentica solo con cedula o numero de historia medica (NHM).

**Request:**

```typescript
// Content-Type: application/x-www-form-urlencoded (FormData)
{
  cedula: string;  // Cedula de identidad O numero de historia medica
}
```

**Logica de deteccion automatica:**
- Si el valor es numerico puro y menor a 100,000 -> se interpreta como NHM
- Cualquier otro caso -> se interpreta como cedula

**Response exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "id": "pac-uuid-123",
    "name": "Pedro Gonzalez",
    "role": "paciente",
    "initials": "PG"
  }
}
```

**Side effect:** Establece cookie `mock_auth`.

**Errores:**

| Codigo | Condicion |
|--------|-----------|
| `400` | Campo `cedula` vacio |
| `404` | No se encontro paciente con esa cedula/NHM |

**Redireccion post-login:** `/mis-citas`

---

### 3. POST `/auth/logout`

Cierra la sesion eliminando la cookie de autenticacion.

**Request:** Sin body.

**Response (200):**

```json
{
  "status": "success",
  "message": "Sesion cerrada"
}
```

**Side effect:** Elimina cookie `mock_auth` (path `/`).

---

### 4. GET `/auth/me`

Valida la sesion actual y retorna los datos del usuario autenticado.

**Request:** Sin body. La cookie `mock_auth` se envia automaticamente.

**Response exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "id": "staff-002",
    "name": "Dr. Carlos Mendoza",
    "role": "doctor",
    "initials": "CM",
    "doctor_id": "doc-001"
  }
}
```

**Errores:**

| Codigo | Condicion |
|--------|-----------|
| `401` | Cookie ausente, invalida o sesion expirada |

---

## Interfaces TypeScript

### AuthUser

```typescript
interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  /** Solo presente cuando role === 'doctor' o admin con contexto de doctor */
  doctor_id?: string;
  /** Solo presente cuando role === 'farmaceutico' */
  pharmacistId?: string;
}
```

### UserRole

```typescript
type UserRole = 'paciente' | 'analista' | 'doctor' | 'admin' | 'farmaceutico';
```

---

## Matriz RBAC (Rol -> Permisos)

Cada celda con **X** indica que el rol posee ese permiso.

| Permiso | paciente | analista | doctor | farmaceutico | admin |
|---------|:--------:|:--------:|:------:|:------------:|:-----:|
| `citas:read` | X | X | X | | X |
| `citas:create` | X | X | X | | X |
| `citas:cancel` | | X | | | X |
| `citas:mark_attended` | | | X | | X |
| `citas:mark_noshow` | | | X | | X |
| `citas:create_emergency` | | | X | | X |
| `citas:export` | | X | | | X |
| `pacientes:read` | X | X | X | X | X |
| `pacientes:create` | X | X | | | X |
| `disponibilidad:read` | | X | X | | X |
| `disponibilidad:create` | | | X | | X |
| `disponibilidad:update` | | | X | | X |
| `disponibilidad:delete` | | | X | | X |
| `evaluaciones:read` | | | X | | X |
| `evaluaciones:write` | | | X | | X |
| `dashboard:read` | | X | X | X | X |
| `inventory:read` | | X | X | X | X |
| `inventory:write` | | | | | X |
| `inventory:dispatch` | | | | X | X |
| `inventory:reports` | | X | | X | X |
| `inventory:admin` | | | | | X |
| `settings:read` | | | | | X |
| `settings:write` | | | | | X |
| `recipe:write` | | | X | | X |
| `recipe:read` | | X | X | X | X |

> **Nota:** El rol `admin` tiene **todos** los permisos automaticamente (`Object.values(P)`).

---

## Mapeo de Rutas -> Permisos (ROUTE_PERMISSIONS)

El middleware verifica que el usuario tenga el permiso requerido antes de servir la ruta. Las rutas mas especificas tienen prioridad sobre las genericas (match por `startsWith`).

| Ruta | Permiso Requerido |
|------|-------------------|
| `/` (dashboard) | `dashboard:read` |
| `/agendar` | `citas:create` |
| `/mis-citas` | `citas:read` |
| `/analista/citas` | `citas:cancel` |
| `/analista/horarios` | `disponibilidad:read` |
| `/doctor/citas` | `citas:mark_attended` |
| `/doctor/disponibilidad` | `disponibilidad:read` |
| `/appointments` | `citas:read` |
| `/patients` | `pacientes:read` |
| `/inventory` | `inventory:read` |
| `/inventory/suppliers` | `inventory:write` |
| `/inventory/purchase-orders` | `inventory:write` |
| `/inventory/dispatches` | `inventory:dispatch` |
| `/inventory/limits` | `inventory:admin` |
| `/inventory/reports` | `inventory:reports` |
| `/doctor/citas/[citaId]/prescription` | `recipe:write` |
| `/admin/configuracion` | `settings:read` |

**Rutas publicas** (no requieren autenticacion): `/login`, `/logout`, `/portal/*`

---

## Mapeo de Acciones -> Permisos (ACTION_PERMISSIONS)

Las server actions de SvelteKit verifican permisos granulares antes de ejecutar la logica de negocio.

| Accion | Permiso Requerido | Modulo |
|--------|-------------------|--------|
| `cancelarCita` | `citas:cancel` | Analista / Citas |
| `exportarExcel` | `citas:export` | Analista / Citas |
| `marcarAtendida` | `citas:mark_attended` | Doctor / Citas |
| `marcarNoAsistio` | `citas:mark_noshow` | Doctor / Citas |
| `citaEmergencia` | `citas:create_emergency` | Doctor / Citas |
| `guardarEvaluacion` | `evaluaciones:write` | Doctor / Evaluacion |
| `agregar` | `disponibilidad:create` | Doctor / Disponibilidad |
| `eliminar` | `disponibilidad:delete` | Doctor / Disponibilidad |
| `actualizar` | `disponibilidad:update` | Doctor / Disponibilidad |
| `buscarPaciente` | `pacientes:read` | Agendar |
| `registrarPaciente` | `pacientes:create` | Agendar |
| `confirmarCita` | `citas:create` | Agendar |
| `obtenerSlots` | `citas:create` | Agendar |
| `guardarEspecialidad` | `settings:write` | Admin / Configuracion |
| `toggleEspecialidad` | `settings:write` | Admin / Configuracion |
| `eliminarEspecialidad` | `settings:write` | Admin / Configuracion |
| `guardarSchema` | `settings:write` | Admin / Configuracion |
| `crearMedicamento` | `inventory:write` | Inventario / Medicamentos |
| `editarMedicamento` | `inventory:write` | Inventario / Medicamentos |
| `crearProveedor` | `inventory:write` | Inventario / Proveedores |
| `editarProveedor` | `inventory:write` | Inventario / Proveedores |
| `crearOrden` | `inventory:write` | Inventario / Ordenes de Compra |
| `recibirOrden` | `inventory:write` | Inventario / Ordenes de Compra |
| `validarDespacho` | `inventory:dispatch` | Inventario / Despachos |
| `ejecutarDespacho` | `inventory:dispatch` | Inventario / Despachos |
| `cancelarDespacho` | `inventory:dispatch` | Inventario / Despachos |
| `crearLimite` | `inventory:admin` | Inventario / Limites |
| `editarLimite` | `inventory:admin` | Inventario / Limites |
| `crearExcepcion` | `inventory:admin` | Inventario / Limites |
| `emitirRecipe` | `recipe:write` | Doctor / Receta |

---

## Cookie de Autenticacion

| Propiedad | Valor (Mock) |
|-----------|-------------|
| **Nombre** | `mock_auth` |
| **Valor** | JSON serializado de `AuthUser` |
| **Path** | `/` |
| **httpOnly** | `false` (mock -- el frontend lee la cookie) |
| **secure** | `false` (desarrollo local) |
| **sameSite** | `lax` |
| **maxAge** | `604800` (7 dias) |

---

## Notas para Produccion

Al migrar a autenticacion real, se debe implementar:

1. **Cookie httpOnly + secure:** Cambiar `httpOnly: true` y `secure: true` para prevenir XSS.
2. **JWT o sesiones server-side:** Reemplazar el JSON plano en la cookie por un JWT firmado (HS256/RS256) o un ID de sesion con almacenamiento en Redis/base de datos.
3. **Contrasenas con bcrypt:** El login de staff debe validar contra hash bcrypt (costo >= 12).
4. **Login de pacientes:** Evaluar agregar un segundo factor (codigo por SMS/email) ya que actualmente no requiere contrasena.
5. **CSRF:** Agregar token CSRF en formularios (SvelteKit lo maneja si se usa `enhance`).
6. **Rate limiting:** Proteger endpoints de login contra fuerza bruta (ej: 5 intentos por minuto por IP).

---

## Usuarios Mock de Staff (Desarrollo)

| Usuario | Contrasena | Rol | Nombre | ID | Campos especiales |
|---------|-----------|-----|--------|----|-------------------|
| `sofia.ramirez` | `analista123` | `analista` | Sofia Ramirez | `staff-001` | -- |
| `carlos.mendoza` | `doctor123` | `doctor` | Dr. Carlos Mendoza | `staff-002` | `doctor_id: "doc-001"` |
| `maria.rodriguez` | `doctor456` | `doctor` | Dra. Maria Rodriguez | `staff-003` | `doctor_id: "doc-002"` |
| `maria.fernandez` | `farmacia123` | `farmaceutico` | Maria Fernandez | `staff-004` | `pharmacistId: "far-uuid-1"` |
| `admin` | `admin123` | `admin` | Admin Principal | `staff-005` | `doctor_id: "doc-001"` |

> **Nota:** Estos usuarios solo existen en el mock del frontend. El backend debe implementar su propia tabla de usuarios con autenticacion segura.
