# Módulo: Doctores, Especialidades y Disponibilidad

> **Flag de mock:** `MOCK_DOCTORES`
> Cuando `mockFlags.doctores === true`, todos los endpoints de este módulo devuelven datos simulados en memoria sin contactar al backend.

---

## Tabla de contenido

1. [Interfaces](#interfaces)
2. [Endpoints de Doctores](#endpoints-de-doctores)
3. [Endpoints de Especialidades](#endpoints-de-especialidades)
4. [Endpoints de Disponibilidad](#endpoints-de-disponibilidad)
5. [Endpoints de Excepciones](#endpoints-de-excepciones)

---

## Interfaces

### `Especialidad`

```typescript
interface Especialidad {
  id: string;         // UUID
  nombre: string;     // Ej: "Medicina General", "Odontología"
  activo: boolean;
}
```

### `Doctor`

```typescript
interface Doctor {
  id: string;              // UUID
  nombre: string;
  apellido: string;
  especialidad_id: string; // FK → Especialidad.id
  activo: boolean;
}
```

### `DoctorConEspecialidad`

Extiende `Doctor` con el objeto completo de la especialidad.

```typescript
interface DoctorConEspecialidad extends Doctor {
  especialidad: Especialidad;
}
```

### `DoctorOption`

Versión reducida para selects/dropdowns en la UI.

```typescript
interface DoctorOption {
  id: string;
  nombre_completo: string;   // "nombre apellido"
  especialidad: string;      // Nombre de la especialidad
  especialidad_id: string;
  dias_trabajo: number[];    // 1=Lunes, 2=Martes, ..., 5=Viernes
}
```

### `DisponibilidadDoctor`

Representa un bloque de horario semanal recurrente del doctor.

```typescript
interface DisponibilidadDoctor {
  id: string;                          // UUID del bloque
  doctor_id: string;                   // FK → Doctor.id
  day_of_week: 1 | 2 | 3 | 4 | 5;    // 1=Lunes … 5=Viernes
  hora_inicio: string;                 // Formato "HH:mm" (ej: "08:00")
  hora_fin: string;                    // Formato "HH:mm" (ej: "17:00")
  duracion_slot: number;               // Minutos, default 30
}
```

### `CreateDisponibilidadInput`

Payload para crear un nuevo bloque de disponibilidad.

```typescript
interface CreateDisponibilidadInput {
  doctor_id: string;
  day_of_week: 1 | 2 | 3 | 4 | 5;
  hora_inicio: string;                 // "HH:mm"
  hora_fin: string;                    // "HH:mm"
  duracion_slot?: number;              // Opcional, default 30
}
```

---

## Endpoints de Doctores

### `GET /doctors?active=true`

Obtiene la lista de doctores activos con su especialidad embebida.

| Parámetro | Tipo    | Requerido | Descripción                    |
|-----------|---------|-----------|--------------------------------|
| `active`  | boolean | No        | Filtrar solo doctores activos  |

**Respuesta:** `DoctorConEspecialidad[]`

```json
[
  {
    "id": "d1a2b3c4-...",
    "nombre": "María",
    "apellido": "González",
    "especialidad_id": "esp-001",
    "activo": true,
    "especialidad": {
      "id": "esp-001",
      "nombre": "Medicina General",
      "activo": true
    }
  }
]
```

**Servicio frontend:** `doctores.service.ts → getActiveDoctores()`

---

### `GET /doctors/options`

Devuelve una lista simplificada de doctores activos para componentes de selección.
Incluye los días de la semana en que el doctor tiene disponibilidad.

**Respuesta:** `DoctorOption[]`

```json
[
  {
    "id": "d1a2b3c4-...",
    "nombre_completo": "María González",
    "especialidad": "Medicina General",
    "especialidad_id": "esp-001",
    "dias_trabajo": [1, 2, 3, 4, 5]
  }
]
```

**Servicio frontend:** `doctores.service.ts → getDoctorOptions()`

---

## Endpoints de Especialidades

### `GET /specialties`

Obtiene todas las especialidades registradas.

**Respuesta:** `Especialidad[]`

```json
[
  { "id": "esp-001", "nombre": "Medicina General", "activo": true },
  { "id": "esp-002", "nombre": "Odontología", "activo": true }
]
```

**Servicio frontend:** `especialidades.service.ts → getAll()` y `doctores.service.ts → getEspecialidades()`

> **Nota:** `getEspecialidades()` en `doctores.service.ts` filtra solo las activas en mock. El endpoint `/specialties` del backend debe devolver todas (activas e inactivas) para el CRUD de administración.

---

### `POST /specialties`

Crea una nueva especialidad.

**Request body:**

```json
{
  "nombre": "Dermatología"
}
```

**Respuesta:** `Especialidad`

```json
{
  "id": "esp-nuevo-uuid",
  "nombre": "Dermatología",
  "activo": true
}
```

**Servicio frontend:** `especialidades.service.ts → create(input)`

---

### `PUT /specialties/{id}`

Actualiza una especialidad existente.

| Parámetro | Ubicación | Tipo   | Requerido | Descripción            |
|-----------|-----------|--------|-----------|------------------------|
| `id`      | path      | string | Sí        | UUID de la especialidad|

**Request body:** `Partial<Especialidad>`

```json
{
  "nombre": "Dermatología Clínica"
}
```

**Respuesta:** `Especialidad`

**Servicio frontend:** `especialidades.service.ts → update(id, input)`

---

### `PATCH /specialties/{id}/toggle`

Alterna el estado activo/inactivo de una especialidad. No requiere body.

| Parámetro | Ubicación | Tipo   | Requerido | Descripción            |
|-----------|-----------|--------|-----------|------------------------|
| `id`      | path      | string | Sí        | UUID de la especialidad|

**Respuesta:** `Especialidad` (con el campo `activo` invertido)

**Servicio frontend:** `especialidades.service.ts → toggleActive(id)`

---

## Endpoints de Disponibilidad

### `GET /doctors/{doctorId}/availability`

Obtiene todos los bloques de disponibilidad semanal del doctor.

| Parámetro  | Ubicación | Tipo   | Requerido | Descripción               |
|------------|-----------|--------|-----------|---------------------------|
| `doctorId` | path      | string | Sí        | UUID del doctor            |

**Respuesta:** `DisponibilidadDoctor[]`

**Servicio frontend:** `doctores.service.ts → getAllDisponibilidad(doctorId)`

---

### `GET /doctors/{doctorId}/availability?dow={dayOfWeek}`

Obtiene los bloques de disponibilidad del doctor filtrados por día de la semana.

| Parámetro    | Ubicación | Tipo   | Requerido | Descripción                           |
|--------------|-----------|--------|-----------|---------------------------------------|
| `doctorId`   | path      | string | Sí        | UUID del doctor                       |
| `dow`        | query     | number | No        | Día de la semana: 1=Lunes … 5=Viernes|

**Respuesta:** `DisponibilidadDoctor[]`

```json
[
  {
    "id": "blk-001",
    "doctor_id": "d1a2b3c4-...",
    "day_of_week": 1,
    "hora_inicio": "08:00",
    "hora_fin": "12:00",
    "duracion_slot": 30
  },
  {
    "id": "blk-002",
    "doctor_id": "d1a2b3c4-...",
    "day_of_week": 1,
    "hora_inicio": "14:00",
    "hora_fin": "17:00",
    "duracion_slot": 30
  }
]
```

**Servicio frontend:** `doctores.service.ts → getDisponibilidad(doctorId, dayOfWeek)`

---

### `POST /doctors/{doctorId}/availability`

Crea un nuevo bloque de disponibilidad para el doctor.

| Parámetro  | Ubicación | Tipo   | Requerido | Descripción    |
|------------|-----------|--------|-----------|----------------|
| `doctorId` | path      | string | Sí        | UUID del doctor|

**Request body:** `CreateDisponibilidadInput`

```json
{
  "doctor_id": "d1a2b3c4-...",
  "day_of_week": 3,
  "hora_inicio": "08:00",
  "hora_fin": "12:00",
  "duracion_slot": 30
}
```

**Respuesta:** `DisponibilidadDoctor`

**Servicio frontend:** `doctores.service.ts → createDisponibilidad(input)`

---

### `PATCH /doctors/{doctorId}/availability/{bloqueId}`

Actualiza parcialmente un bloque de disponibilidad existente.

| Parámetro  | Ubicación | Tipo   | Requerido | Descripción           |
|------------|-----------|--------|-----------|------------------------|
| `doctorId` | path      | string | Sí        | UUID del doctor        |
| `bloqueId` | path      | string | Sí        | UUID del bloque        |

**Request body:**

```json
{
  "hora_inicio": "09:00",
  "hora_fin": "13:00"
}
```

Ambos campos son opcionales. Se actualiza solo lo enviado.

**Respuesta:** `void` (204 No Content)

**Servicio frontend:** `doctores.service.ts → updateDisponibilidad(doctorId, bloqueId, updates)`

---

### `DELETE /doctors/{doctorId}/availability/{bloqueId}`

Elimina un bloque de disponibilidad.

| Parámetro  | Ubicación | Tipo   | Requerido | Descripción           |
|------------|-----------|--------|-----------|------------------------|
| `doctorId` | path      | string | Sí        | UUID del doctor        |
| `bloqueId` | path      | string | Sí        | UUID del bloque        |

**Respuesta:** `void` (204 No Content)

**Servicio frontend:** `doctores.service.ts → deleteDisponibilidad(doctorId, bloqueId)`

---

## Endpoints de Excepciones

### `GET /doctors/{doctorId}/exceptions?date={fecha}`

Verifica si existe una excepción (día libre, feriado, permiso) para el doctor en una fecha específica.

| Parámetro  | Ubicación | Tipo   | Requerido | Descripción                          |
|------------|-----------|--------|-----------|--------------------------------------|
| `doctorId` | path      | string | Sí        | UUID del doctor                      |
| `date`     | query     | string | Sí        | Fecha en formato ISO: "2025-04-15"   |

**Respuesta:**

```json
{
  "excepcion": true
}
```

| Campo       | Tipo    | Descripción                                          |
|-------------|---------|------------------------------------------------------|
| `excepcion` | boolean | `true` si el doctor no atiende en esa fecha          |

**Servicio frontend:** `doctores.service.ts → hasExcepcion(doctorId, fecha)`

---

## Archivos fuente relevantes

| Archivo | Descripción |
|---------|-------------|
| `src/lib/server/doctores.service.ts` | Servicio de doctores y disponibilidad |
| `src/lib/server/especialidades.service.ts` | CRUD de especialidades |
| `src/lib/shared/types/appointments.ts` | Interfaces: Doctor, Especialidad, DisponibilidadDoctor, DoctorOption |
