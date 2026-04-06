# Modulo: Pacientes

> **Mock flag:** `MOCK_PACIENTES` — cuando esta activo, los endpoints no llegan al backend y se sirven datos locales en memoria.

---

## Interfaces TypeScript

### Tipos enumerados

```typescript
export type RelacionUniversidad = 'empleado' | 'estudiante' | 'profesor' | 'tercero';
export type Parentesco = 'hijo' | 'padre' | 'madre' | 'conyuge' | 'otro';
export type Sexo = 'M' | 'F';
export type EstadoCivil = 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre';
```

### DatosMedicos

```typescript
export interface DatosMedicos {
  tipo_sangre?: string;
  alergias?: string[];
  numero_contacto?: string;
  condiciones?: string[];
}
```

### ContactoEmergencia

```typescript
export interface ContactoEmergencia {
  nombre?: string;
  parentesco?: string;
  direccion?: string;
  telefono?: string;
}
```

### Paciente (entidad completa)

```typescript
export interface Paciente {
  id: string;                        // UUID
  nhm: number;                       // Numero de Historia Medica (auto-incremental)
  cedula: string;
  nombre: string;
  apellido: string;
  sexo?: Sexo;
  fecha_nacimiento?: string;         // ISO date "YYYY-MM-DD"
  lugar_nacimiento?: string;
  edad?: number;
  estado_civil?: EstadoCivil;
  religion?: string;
  procedencia?: string;
  direccion_habitacion?: string;
  telefono?: string;
  profesion?: string;
  ocupacion_actual?: string;
  direccion_trabajo?: string;
  clasificacion_economica?: string;
  relacion_univ: RelacionUniversidad;
  parentesco?: Parentesco;
  titular_nhm?: number;              // NHM del titular (si es familiar)
  datos_medicos: DatosMedicos;
  contacto_emergencia?: ContactoEmergencia;
  es_nuevo: boolean;
  created_at: string;                // ISO datetime
}
```

### PacientePublic (version reducida, sin datos sensibles)

```typescript
export type PacientePublic = Pick<
  Paciente,
  'id' | 'nhm' | 'nombre' | 'apellido' | 'relacion_univ' | 'es_nuevo'
>;
```

### CreatePacienteInput

```typescript
export interface CreatePacienteInput {
  cedula: string;                    // Requerido
  nombre: string;                    // Requerido
  apellido: string;                  // Requerido
  sexo?: Sexo;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  edad?: number;
  estado_civil?: EstadoCivil;
  religion?: string;
  procedencia?: string;
  direccion_habitacion?: string;
  telefono?: string;
  profesion?: string;
  ocupacion_actual?: string;
  direccion_trabajo?: string;
  clasificacion_economica?: string;
  relacion_univ: RelacionUniversidad; // Requerido
  parentesco?: Parentesco;
  titular_nhm?: number;
  datos_medicos?: DatosMedicos;
  contacto_emergencia?: ContactoEmergencia;
}
```

> **Nota:** El campo `nhm` NO se incluye en la creacion. Es auto-incremental y lo asigna el backend.

---

## Endpoints

### 1. Listar todos los pacientes

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/patients` |
| **Query params** | Ninguno |
| **Request body** | Ninguno |
| **Response** | `Paciente[]` |

Retorna la lista completa de pacientes. En modo mock se ordena por `apellido` (A-Z).

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Lista retornada exitosamente |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 2. Buscar paciente por NHM (version publica)

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/patients` |
| **Query params** | `nhm` (number) |
| **Request body** | Ninguno |
| **Response** | `PacientePublic \| null` |

Busca un paciente por su Numero de Historia Medica. Retorna solo los campos publicos.

**Ejemplo:** `GET /patients?nhm=1234`

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Paciente encontrado (o `null` si no existe) |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 3. Buscar paciente por cedula (version publica)

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/patients` |
| **Query params** | `cedula` (string, URL-encoded) |
| **Request body** | Ninguno |
| **Response** | `PacientePublic \| null` |

Busca un paciente por su cedula de identidad. Retorna solo los campos publicos.

**Ejemplo:** `GET /patients?cedula=V-12345678`

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Paciente encontrado (o `null` si no existe) |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 4. Buscar paciente completo por cedula

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/patients/full` |
| **Query params** | `cedula` (string, URL-encoded) |
| **Request body** | Ninguno |
| **Response** | `Paciente \| null` |

Retorna la entidad completa del paciente incluyendo datos medicos y contacto de emergencia.

**Ejemplo:** `GET /patients/full?cedula=V-12345678`

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Paciente encontrado (o `null` si no existe) |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 5. Buscar paciente completo por NHM

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/patients/full` |
| **Query params** | `nhm` (number) |
| **Request body** | Ninguno |
| **Response** | `Paciente \| null` |

Retorna la entidad completa del paciente incluyendo datos medicos y contacto de emergencia.

**Ejemplo:** `GET /patients/full?nhm=1234`

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Paciente encontrado (o `null` si no existe) |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 6. Obtener maximo NHM

| Campo | Valor |
|-------|-------|
| **Metodo** | `GET` |
| **Path** | `/patients/max-nhm` |
| **Query params** | Ninguno |
| **Request body** | Ninguno |
| **Response** | `{ max_nhm: number }` |

Retorna el NHM mas alto actualmente registrado. Se utiliza para mostrar informacion sobre el proximo NHM que se asignara.

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `200` | Valor retornado exitosamente |
| `401` | No autenticado |
| `500` | Error interno del servidor |

---

### 7. Crear paciente

| Campo | Valor |
|-------|-------|
| **Metodo** | `POST` |
| **Path** | `/patients` |
| **Query params** | Ninguno |
| **Request body** | `CreatePacienteInput` (JSON) |
| **Response** | `Paciente` |

Crea un nuevo paciente. El `nhm` es asignado automaticamente por el backend (auto-incremental). El campo `es_nuevo` se establece en `true` por defecto.

**Campos requeridos en el body:**
- `cedula`
- `nombre`
- `apellido`
- `relacion_univ`

**Campos auto-generados por el backend:**
- `id` (UUID)
- `nhm` (auto-incremental)
- `es_nuevo` (siempre `true`)
- `created_at` (timestamp ISO)

**Codigos de error:**

| Codigo | Descripcion |
|--------|-------------|
| `201` | Paciente creado exitosamente |
| `400` | Datos de entrada invalidos |
| `401` | No autenticado |
| `409` | Paciente con esa cedula ya existe |
| `422` | Error de validacion |
| `500` | Error interno del servidor |
