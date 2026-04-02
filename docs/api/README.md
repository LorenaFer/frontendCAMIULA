# API Backend -- Centro Ambulatorio ULA (CAMIULA)

Backend desarrollado en **FastAPI** (Python) que el frontend SvelteKit consume a traves de `apiFetch()` y `apiFetchRaw()`.

---

## URL Base

```
http://localhost:8000/api
```

Todas las rutas documentadas son relativas a este prefijo. El cliente HTTP del frontend (`src/lib/server/api.ts`) agrega `/api` automaticamente.

---

## Envelope Estandar

Todos los endpoints deben retornar el envelope estandar:

```typescript
interface ApiEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}
```

El frontend desenvuelve automaticamente el campo `data` con `apiFetch<T>()`. Para acceder al envelope completo, usar `apiFetchRaw<T>()`.

---

## Codigos de Estado HTTP

| Codigo | Significado | Uso |
|--------|-------------|-----|
| `200`  | OK | Operacion exitosa (GET, PUT, PATCH) |
| `201`  | Created | Recurso creado exitosamente (POST) |
| `400`  | Bad Request | Datos de entrada invalidos o faltantes |
| `401`  | Unauthorized | Sin sesion o sesion expirada |
| `403`  | Forbidden | Sesion valida pero sin permiso para la accion |
| `404`  | Not Found | Recurso no encontrado |
| `409`  | Conflict | Conflicto de estado (ej: cita ya cancelada, duplicado) |
| `500`  | Internal Server Error | Error inesperado del servidor |

En caso de error, el body debe seguir el formato:

```json
{
  "detail": "Descripcion del error legible para el desarrollador"
}
```

---

## Formato de Paginacion

### Citas y modulos generales

```typescript
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;      // Total de registros
    page: number;       // Pagina actual (1-indexed)
    page_size: number;  // Tamano de pagina
    pages: number;      // Total de paginas
    has_next: boolean;  // Indica si hay pagina siguiente
  };
}
```

### Inventario

```typescript
interface PaginatedInventory<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}
```

---

## Formato de Fechas

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Fecha | ISO 8601 `YYYY-MM-DD` | `2026-04-02` |
| Timestamp | ISO 8601 completo | `2026-04-02T14:30:00Z` |
| Hora | `HH:MM` (24h) | `08:30` |

---

## Convencion de Nombres de Campos

- **snake_case** para todos los campos del JSON (`nombre_completo`, `fecha_nacimiento`)
- Prefijo **`fk_`** para llaves foraneas (`fk_paciente`, `fk_doctor`, `fk_especialidad`)
- IDs como **string UUID** (`"550e8400-e29b-41d4-a716-446655440000"`)

---

## Flags de Mock (Migracion Progresiva)

El frontend opera en modo mock por defecto para cada modulo. Cuando un endpoint del backend este listo, se desactiva el mock del modulo correspondiente sin afectar los demas.

### Tabla de Flags

| # | Flag (codigo) | Variable de Entorno | Modulo que controla |
|---|---------------|--------------------|--------------------|
| 1 | `pacientes` | `MOCK_PACIENTES` | Gestion de pacientes (CRUD, busqueda por cedula/NHM) |
| 2 | `doctores` | `MOCK_DOCTORES` | Gestion de doctores y especialidades |
| 3 | `citas` | `MOCK_CITAS` | Citas medicas (agendar, cancelar, listar) |
| 4 | `historias` | `MOCK_HISTORIAS` | Historias clinicas y evaluaciones medicas |
| 5 | `schemas` | `MOCK_SCHEMAS` | Schemas dinamicos de formularios de evaluacion |
| 6 | `inventoryMedications` | `MOCK_INVENTORY_MEDICATIONS` | Catalogo de medicamentos |
| 7 | `inventorySuppliers` | `MOCK_INVENTORY_SUPPLIERS` | Proveedores de farmacia |
| 8 | `inventoryPurchaseOrders` | `MOCK_INVENTORY_PURCHASE_ORDERS` | Ordenes de compra |
| 9 | `inventoryBatches` | `MOCK_INVENTORY_BATCHES` | Lotes de medicamentos (stock fisico) |
| 10 | `inventoryPrescriptions` | `MOCK_INVENTORY_PRESCRIPTIONS` | Recetas medicas (cola de despacho) |
| 11 | `inventoryDispatches` | `MOCK_INVENTORY_DISPATCHES` | Despachos de farmacia |
| 12 | `inventoryLimits` | `MOCK_INVENTORY_LIMITS` | Limites y excepciones de despacho |
| 13 | `inventoryReports` | `MOCK_INVENTORY_REPORTS` | Reportes e indicadores de inventario |

### Estrategia de Migracion

1. El flag por defecto es `true` (mock activo) si la variable de entorno no existe o tiene cualquier valor distinto de `'false'`.
2. Cuando el endpoint de un modulo este listo y probado en FastAPI, establecer la variable a `false` en `.env`:
   ```env
   MOCK_DOCTORES=false
   ```
3. El frontend comenzara a usar `apiFetch()` contra el backend real para ese modulo.
4. Los demas modulos seguiran en mock sin cambios.

---

## Indice de Documentacion por Modulo

| # | Documento | Modulo |
|---|-----------|--------|
| 1 | [01-auth.md](./01-auth.md) | Autenticacion y Autorizacion (RBAC) |
| 2 | [02-pacientes.md](./02-pacientes.md) | Gestion de Pacientes |
| 3 | [03-doctores.md](./03-doctores.md) | Doctores y Especialidades |
| 4 | [04-citas.md](./04-citas.md) | Citas Medicas |
| 5 | [05-historias.md](./05-historias.md) | Historias Clinicas y Evaluaciones |
| 6 | [06-inventario.md](./06-inventario.md) | Inventario de Farmacia |
| 7 | [07-configuracion.md](./07-configuracion.md) | Configuracion del Sistema |
