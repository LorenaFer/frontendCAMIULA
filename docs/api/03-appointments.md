# Modulo: Citas Medicas

> **Mock flag:** `MOCK_CITAS` — cuando esta activo, los endpoints no llegan al backend y se sirven datos locales en memoria.

---

## Interfaces TypeScript

### CitaEstado

```typescript
export type CitaEstado = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';
```

### TimeSlot

```typescript
export interface TimeSlot {
  hora_inicio: string;   // "09:00"
  hora_fin: string;      // "09:30"
  disponible: boolean;
}
```

### Cita

```typescript
export interface Cita {
  id: string;                    // UUID
  paciente_id: string;           // UUID
  doctor_id: string;             // UUID
  especialidad_id: string;       // UUID
  fecha: string;                 // ISO date "2025-04-15"
  hora_inicio: string;           // "09:00"
  hora_fin: string;              // "09:30"
  duracion_min: 30 | 60;
  es_primera_vez: boolean;
  estado: CitaEstado;
  motivo_consulta?: string;
  observaciones?: string;
  notas_admin?: string;
  created_at: string;            // ISO datetime
  created_by: string;            // UUID del usuario que creo la cita
}
```

### CitaConPaciente

```typescript
export interface CitaConPaciente extends Cita {
  paciente: Paciente;
  doctor: DoctorConEspecialidad;
}
```

> Incluye la entidad completa del paciente y del doctor con su especialidad embebida.

### CreateCitaInput

```typescript
export interface CreateCitaInput {
  paciente_id: string;           // UUID - Requerido
  doctor_id: string;             // UUID - Requerido
  especialidad_id: string;       // UUID - Requerido
  fecha: string;                 // ISO date - Requerido
  hora_inicio: string;           // "HH:MM" - Requerido
  hora_fin: string;              // "HH:MM" - Requerido
  duracion_min: 30 | 60;        // Requerido
  es_primera_vez: boolean;       // Requerido
  motivo_consulta?: string;
  observaciones?: string;
  created_by: string;            // UUID - Requerido
}
```

### AppointmentFilters

```typescript
export interface AppointmentFilters {
  fecha?: string;                // ISO date "YYYY-MM-DD"
  doctor_id?: string;            // UUID
  especialidad_id?: string;      // UUID
  estado?: CitaEstado;
  search?: string;               // Busqueda por nombre, apellido o cedula
  page?: number;                 // Default: 1
  page_size?: number;            // Default: 25
}
```

### CitasStats

```typescript
export interface CitasStats {
  total: number;
  byStatus: Record<string, number>;
  bySpecialty: { name: string; count: number }[];
  byDoctor: { name: string; specialty: string; count: number; atendidas: number }[];
  firstTimeCount: number;
  returningCount: number;
  byPatientType: Record<string, number>;
  /** Citas agrupadas por dia (ultimos dias con data) para sparkline */
  dailyTrend: number[];
  /** Hora pico: distribucion por franja horaria */
  peakHours: { hour: string; count: number }[];
}
```

### Paginacion

```typescript
export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  has_next: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
```

### Tipos auxiliares de respuesta

```typescript
export interface ObtenerSlotsResult {
  slots: TimeSlot[];
  duracion: 30 | 60;
  es_primera_vez: boolean;
  mensaje?: string;
}

export interface ConfirmarCitaResult {
  citaId: string;
  confirmationCode: string;
}
```

---

## Endpoints

### 1. Crear cita

| Campo | Valor |
|-------|-------|
| **Metodo** | `POST` |
| **Path** | `/appointments` |
| **Query params** | Ninguno |
| **Request body** | `CreateCitaInput` (JSON) |
| **Response** | `Cita` |

Crea una nueva cita medica. El backend valida que no exista doble-booking (mismo doctor, misma fecha, misma hora de inicio con estado distinto de `cancelada`).

**Campos auto-generados por el backend:**
- `id` (UUID)
- `estado` (siempre `'pendiente'` al crear)
- `created_at` (timestamp ISO)

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `201` | Cita creada exitosamente |
| `400` | Datos de entrada invalidos |
| `401` | No autenticado |
| `409` | **Slot ocupado** — ya existe una cita activa para ese doctor/fecha/hora |
| `422` | Error de validacion |
| `500` | Error interno del servidor |

---

### 2. Listar citas con filtros (paginado)

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/appointments` |
| **Query params** | Ver tabla abajo |
| **Request body** | Ninguno |
| **Response** | `PaginatedResponse<CitaConPaciente>` |

Retorna una lista paginada de citas con datos completos del paciente y doctor.

**Query parameters:**

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `fecha` | string | — | Filtrar por fecha ISO `YYYY-MM-DD` |
| `doctor_id` | string | — | Filtrar por UUID del doctor |
| `especialidad_id` | string | — | Filtrar por UUID de especialidad |
| `estado` | CitaEstado | — | Filtrar por estado de la cita |
| `q` | string | — | Buscar por nombre, apellido o cedula del paciente |
| `page` | number | `1` | Numero de pagina |
| `page_size` | number | `25` | Cantidad de resultados por pagina |

> **Nota:** El frontend envia el campo `search` en `AppointmentFilters`, pero al construir los query params se mapea a `q`.

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Lista retornada exitosamente |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 3. Listar citas del dia

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/appointments` |
| **Query params** | `fecha` (fecha actual ISO), `doctor_id` (opcional) |
| **Request body** | Ninguno |
| **Response** | `CitaConPaciente[]` |

Retorna todas las citas de hoy, opcionalmente filtradas por doctor. Es un atajo que el frontend usa internamente — en el backend se resuelve con los mismos query params del endpoint de listado.

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Lista retornada exitosamente |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 4. Listar citas de un doctor por mes

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/appointments` |
| **Query params** | `doctor_id`, `mes`, `excluir_canceladas` |
| **Request body** | Ninguno |
| **Response** | `Cita[]` |

Retorna las citas de un doctor para un mes completo, excluyendo canceladas. Se usa para pintar el calendario de disponibilidad.

**Query parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `doctor_id` | string | UUID del doctor (requerido) |
| `mes` | string | Prefijo de mes en formato `YYYY-MM` (ej: `2025-04`) |
| `excluir_canceladas` | boolean | Siempre `true` — excluye citas con estado `cancelada` |

**Ejemplo:** `GET /appointments?doctor_id=abc-123&mes=2025-04&excluir_canceladas=true`

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Lista retornada exitosamente |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 5. Listar citas de un doctor por fecha

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/appointments` |
| **Query params** | `doctor_id`, `fecha`, `excluir_canceladas` |
| **Request body** | Ninguno |
| **Response** | `Cita[]` |

Retorna las citas de un doctor para una fecha especifica, excluyendo canceladas. Se usa para el calculo de slots disponibles.

**Query parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `doctor_id` | string | UUID del doctor (requerido) |
| `fecha` | string | Fecha ISO `YYYY-MM-DD` (requerido) |
| `excluir_canceladas` | boolean | Siempre `true` |

**Ejemplo:** `GET /appointments?doctor_id=abc-123&fecha=2025-04-15&excluir_canceladas=true`

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Lista retornada exitosamente |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 6. Obtener cita por ID

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/appointments/{id}` |
| **Path params** | `id` — UUID de la cita |
| **Request body** | Ninguno |
| **Response** | `CitaConPaciente` |

Retorna los datos completos de una cita incluyendo paciente y doctor con especialidad.

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Cita encontrada |
| `401` | No autenticado |
| `404` | Cita no encontrada |
| `500` | Error interno del servidor |

---

### 7. Actualizar estado de cita

| Campo | Valor |
|-------|-------|
| **Metodo** | `PATCH` |
| **Path** | `/appointments/{id}/status` |
| **Path params** | `id` — UUID de la cita |
| **Request body** | `{ estado: CitaEstado }` |
| **Response** | `void` (204 No Content) |

Cambia el estado de una cita. Transiciones de estado validas:

```
pendiente  ->  confirmada | cancelada
confirmada ->  atendida | cancelada | no_asistio
```

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `204` | Estado actualizado exitosamente |
| `400` | Transicion de estado no valida |
| `401` | No autenticado |
| `404` | Cita no encontrada |
| `500` | Error interno del servidor |

---

### 8. Obtener estadisticas de citas

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/appointments/stats` |
| **Query params** | Ver tabla abajo |
| **Request body** | Ninguno |
| **Response** | `CitasStats` |

Retorna estadisticas agregadas de las citas para el dashboard del analista. Soporta los mismos filtros que el listado (sin paginacion).

**Query parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `fecha` | string | Filtrar por fecha ISO |
| `doctor_id` | string | Filtrar por UUID del doctor |
| `especialidad_id` | string | Filtrar por UUID de especialidad |
| `estado` | CitaEstado | Filtrar por estado |

**Detalle de los campos de respuesta:**

| Campo | Descripcion |
|-------|-------------|
| `total` | Cantidad total de citas que cumplen los filtros |
| `byStatus` | Mapa `estado -> conteo` |
| `bySpecialty` | Array de `{ name, count }` ordenado por count descendente |
| `byDoctor` | Array de `{ name, specialty, count, atendidas }` ordenado por count descendente |
| `firstTimeCount` | Cantidad de citas donde `es_primera_vez = true` |
| `returningCount` | Cantidad de citas de pacientes recurrentes |
| `byPatientType` | Mapa `relacion_univ -> conteo` |
| `dailyTrend` | Array de conteos por dia (ordenado cronologicamente) para graficos sparkline |
| `peakHours` | Array de `{ hour, count }` ordenado por hora (ej: `"08:00"`, `"09:00"`) |

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Estadisticas retornadas exitosamente |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 9. Verificar disponibilidad de slot

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/appointments/check-slot` |
| **Query params** | `doctor_id`, `fecha`, `hora_inicio` |
| **Request body** | Ninguno |
| **Response** | `{ ocupado: boolean }` |

Verifica si un slot especifico ya esta ocupado por otra cita activa (no cancelada). Se utiliza como verificacion final antes de confirmar la creacion de una cita.

**Query parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `doctor_id` | string | UUID del doctor (requerido) |
| `fecha` | string | Fecha ISO `YYYY-MM-DD` (requerido) |
| `hora_inicio` | string | Hora de inicio `HH:MM` (requerido) |

**Ejemplo:** `GET /appointments/check-slot?doctor_id=abc-123&fecha=2025-04-15&hora_inicio=09:00`

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Verificacion exitosa. `ocupado: true` si el slot ya tiene cita activa |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

## Logica de Negocio

### Calculo de slots disponibles (`computeAvailableSlots`)

El calculo de slots es una **funcion pura** que se ejecuta en el servidor (SvelteKit) sin dependencia de base de datos. Recibe tres parametros:

```typescript
function computeAvailableSlots(
  disponibilidad: DisponibilidadDoctor[],
  existingCitas: Pick<Cita, 'hora_inicio' | 'hora_fin'>[],
  duracionMin: 30 | 60
): TimeSlot[]
```

**Parametros de entrada:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `disponibilidad` | `DisponibilidadDoctor[]` | Bloques de horario del doctor para el dia de la semana seleccionado |
| `existingCitas` | `Pick<Cita, 'hora_inicio' \| 'hora_fin'>[]` | Citas ya agendadas (no canceladas) para ese doctor y fecha |
| `duracionMin` | `30 \| 60` | Duracion del slot a generar |

**Tipo DisponibilidadDoctor:**

```typescript
export interface DisponibilidadDoctor {
  id: string;
  doctor_id: string;
  day_of_week: 1 | 2 | 3 | 4 | 5;  // 1=Lunes ... 5=Viernes
  hora_inicio: string;                // "08:00"
  hora_fin: string;                   // "17:00"
  duracion_slot: number;              // minutos, default 30
}
```

**Algoritmo paso a paso:**

1. **Convertir citas existentes a rangos de minutos.** Cada cita se transforma en un par `{ start, end }` en minutos desde medianoche para facilitar la comparacion.

2. **Iterar sobre cada bloque de disponibilidad.** Un doctor puede tener multiples bloques (ej: 08:00-12:00 y 14:00-17:00).

3. **Generar slots dentro de cada bloque.** Se usa un cursor que avanza desde `hora_inicio` del bloque. Para cada posicion del cursor:
   - Se calcula `slotStart = cursor` y `slotEnd = cursor + duracionMin`.
   - Solo se genera el slot si `slotEnd <= hora_fin` del bloque (el slot cabe completo).

4. **Verificar solapamiento.** Un slot se marca como `disponible: false` si se solapa con alguna cita existente. La condicion de solapamiento es: `slotStart < citaEnd AND slotEnd > citaStart`.

5. **Avance del cursor.** El cursor avanza por `duracion_slot` del bloque (normalmente 30 min), **no** por `duracionMin`. Esto es intencional: si un slot de 60 min comienza en 08:00, el siguiente slot de 60 min se evalua desde 08:30, no desde 09:00. Esto maximiza la cantidad de opciones disponibles.

**Ejemplo:**

```
Bloque: 08:00 - 12:00, duracion_slot = 30
Cita existente: 09:00 - 09:30
Duracion solicitada: 60 min

Slots generados:
  08:00-09:00  -> disponible: true
  08:30-09:30  -> disponible: false  (solapa con 09:00-09:30)
  09:00-10:00  -> disponible: false  (solapa con 09:00-09:30)
  09:30-10:30  -> disponible: true
  10:00-11:00  -> disponible: true
  10:30-11:30  -> disponible: true
  11:00-12:00  -> disponible: true
```

---

### Fecha minima de agendamiento (`getMinBookingDate`)

No se permite agendar citas para hoy ni para manana. La fecha minima valida es **hoy + 2 dias**.

```typescript
function getMinBookingDate(): string    // Retorna ISO date "YYYY-MM-DD"
function isDateAllowed(fechaISO: string): boolean  // fecha >= minBookingDate
```

**Ejemplo:** Si hoy es 2025-04-15, la fecha minima para agendar es 2025-04-17.

---

### Duracion de la cita

| Tipo de paciente | Duracion |
|------------------|----------|
| **Primera vez** (`es_primera_vez = true`) | **60 minutos** |
| **Recurrente** (`es_primera_vez = false`) | **30 minutos** |

La duracion se determina automaticamente en el frontend segun si el paciente tiene citas previas o si el campo `es_nuevo` del paciente es `true`.

---

### Prevencion de doble-booking

El sistema implementa una verificacion en dos niveles:

1. **Nivel visual (slots).** `computeAvailableSlots` marca como `disponible: false` cualquier slot que se solape con una cita existente (excluyendo canceladas). El usuario no puede seleccionar un slot no disponible.

2. **Nivel de verificacion (`isSlotOccupied`).** Antes de crear la cita, se hace una verificacion puntual via `GET /appointments/check-slot`. Retorna `{ ocupado: true }` si ya existe una cita activa para ese doctor/fecha/hora_inicio.

3. **Nivel de backend (creacion).** Al llamar `POST /appointments`, si el slot ya esta ocupado, el backend retorna **HTTP 409 Conflict** con el mensaje "Slot ocupado".

La verificacion excluye citas con estado `cancelada` — un slot cuya unica cita esta cancelada se considera disponible.
