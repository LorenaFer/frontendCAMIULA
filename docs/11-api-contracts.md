# Contratos API — Guia de Integracion Frontend

> Documento de referencia para el equipo de frontend. Mapea los endpoints del backend a lo que el frontend necesita.

**Base URL**: `http://localhost:8000/api`

**Autenticacion**: JWT Bearer token en header `Authorization: Bearer {token}`

**Formato de respuestas**: Todas las respuestas siguen el envelope estandar:
```json
{
  "status": "success" | "error",
  "message": "Descripcion",
  "data": T | null
}
```

---

## Diferencias Clave vs Contrato Original

| Aspecto | Contrato original | Backend real |
|---------|------------------|-------------|
| Base URL | `http://localhost:8000` | `http://localhost:8000/api` |
| IDs | `number` | `string` (UUID) |
| Rutas | Espanol (`/pacientes`) | Ingles (`/patients`) |
| Respuestas | JSON plano | Envelope `{ status, message, data }` |
| Paginacion | `{ data, total, pageSize, hasNext }` | `{ items, pagination: { total, page, page_size, pages, has_next } }` |
| Campos | camelCase | snake_case |

---

## Tabla de Endpoints (25 totales)

| # | Metodo | Ruta Backend | Modulo |
|---|--------|-------------|--------|
| 1 | POST | `/api/auth/login` | Auth |
| 2 | GET | `/api/users/me` | Auth |
| 3 | POST | `/api/auth/logout` | Auth |
| 4 | GET | `/api/patients?nhm={nhm}` | Pacientes |
| 5 | GET | `/api/patients?cedula={cedula}` | Pacientes |
| 6 | GET | `/api/patients/full?cedula={cedula}` | Pacientes |
| 7 | GET | `/api/patients/max-nhm` | Pacientes |
| 8 | POST | `/api/patients` | Pacientes |
| 9 | GET | `/api/doctors?active=true` | Doctores |
| 10 | GET | `/api/doctors/options` | Doctores |
| 11 | GET | `/api/specialties` | Especialidades |
| 12 | GET | `/api/doctors/{id}/availability` | Disponibilidad |
| 13 | POST | `/api/doctors/{id}/availability` | Disponibilidad |
| 14 | PATCH | `/api/doctors/{id}/availability/{blockId}` | Disponibilidad |
| 15 | DELETE | `/api/doctors/{id}/availability/{blockId}` | Disponibilidad |
| 16 | GET | `/api/doctors/{id}/exceptions?date={fecha}` | Disponibilidad |
| 17 | POST | `/api/appointments` | Citas |
| 18 | GET | `/api/appointments?{filtros}` | Citas |
| 19 | GET | `/api/appointments/{id}` | Citas |
| 20 | PATCH | `/api/appointments/{id}/status` | Citas |
| 21 | GET | `/api/appointments/check-slot?{params}` | Citas |
| 22 | GET | `/api/medical-records?appointment_id={id}` | Historias |
| 23 | PUT | `/api/medical-records` | Historias |
| 24 | PATCH | `/api/medical-records/{id}/prepared` | Historias |

---

## 1. Autenticacion

### POST `/api/auth/login`

**Request:**
```json
{
  "identifier": "V-12345678",
  "password": "mipassword"
}
```
> `identifier` puede ser: email, cedula (V-12345678) o username.

**Response 200:**
```json
{
  "status": "success",
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid-string",
      "name": "Carlos Mendoza",
      "role": "doctor",
      "initials": "CM",
      "doctor_id": "uuid-string-o-null"
    },
    "token": "eyJhbGciOiJI..."
  }
}
```

**Roles posibles**: `paciente`, `analista`, `doctor`, `admin`

### GET `/api/users/me`

**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "status": "success",
  "message": "Perfil obtenido",
  "data": {
    "id": "uuid-string",
    "name": "Carlos Mendoza",
    "role": "doctor",
    "initials": "CM",
    "doctor_id": "uuid-string-o-null"
  }
}
```

### POST `/api/auth/logout`

**Response 200:**
```json
{
  "status": "success",
  "message": "Sesion cerrada",
  "data": { "ok": true }
}
```

---

## 2. Pacientes

### GET `/api/patients?nhm={nhm}` o `?cedula={cedula}`

**Response 200 (encontrado):**
```json
{
  "status": "success",
  "message": "Paciente encontrado",
  "data": {
    "id": "uuid",
    "nhm": 1001,
    "nombre": "Maria",
    "apellido": "Garcia",
    "relacion_univ": "empleado",
    "es_nuevo": false
  }
}
```

**Response 200 (no encontrado):**
```json
{
  "status": "success",
  "message": "Paciente no encontrado",
  "data": null
}
```

### GET `/api/patients/full?cedula={cedula}`

**Response 200:**
```json
{
  "status": "success",
  "message": "Ficha completa del paciente",
  "data": {
    "id": "uuid",
    "nhm": 1001,
    "cedula": "V-12345678",
    "nombre": "Maria",
    "apellido": "Garcia",
    "sexo": "F",
    "fecha_nacimiento": "1990-05-15",
    "lugar_nacimiento": "Merida",
    "edad": 35,
    "estado_civil": "casado",
    "religion": "catolico",
    "procedencia": "Merida",
    "direccion_habitacion": "Av. Los Proceres",
    "telefono": "0414-1234567",
    "profesion": "Ingeniera",
    "ocupacion_actual": "Docente",
    "direccion_trabajo": "ULA",
    "clasificacion_economica": "III",
    "relacion_univ": "empleado",
    "parentesco": null,
    "titular_nhm": null,
    "datos_medicos": {
      "tipo_sangre": "O+",
      "alergias": ["Penicilina"],
      "numero_contacto": "0414-1234567",
      "condiciones": []
    },
    "contacto_emergencia": {
      "nombre": "Juan Garcia",
      "parentesco": "esposo",
      "direccion": "Av. Los Proceres",
      "telefono": "0414-7654321"
    },
    "es_nuevo": false,
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

### GET `/api/patients/max-nhm`

**Response 200:**
```json
{
  "status": "success",
  "message": "Ultimo NHM asignado",
  "data": { "max_nhm": 1042 }
}
```

### POST `/api/patients`

**Request:**
```json
{
  "cedula": "V-98765432",
  "nombre": "Pedro",
  "apellido": "Lopez",
  "relacion_univ": "profesor",
  "sexo": "M",
  "fecha_nacimiento": "1985-03-20",
  "telefono": "0412-9876543",
  "datos_medicos": {
    "tipo_sangre": "A+",
    "alergias": [],
    "numero_contacto": "0412-9876543"
  }
}
```

**Response 201:**
```json
{
  "status": "success",
  "message": "Paciente registrado exitosamente",
  "data": {
    "id": "uuid",
    "nhm": 1043,
    "cedula": "V-98765432",
    "nombre": "Pedro",
    "apellido": "Lopez",
    "relacion_univ": "profesor",
    "es_nuevo": true,
    "created_at": "2026-03-24T15:30:00Z"
  }
}
```

---

## 3. Doctores y Especialidades

### GET `/api/doctors?active=true`

**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "nombre": "Carlos",
      "apellido": "Mendoza",
      "especialidad_id": "uuid",
      "activo": true,
      "especialidad": {
        "id": "uuid",
        "nombre": "Medicina General",
        "activo": true
      }
    }
  ]
}
```

### GET `/api/doctors/options`

**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "nombre_completo": "Dr. Carlos Mendoza",
      "especialidad": "Medicina General",
      "especialidad_id": "uuid",
      "dias_trabajo": [1, 2, 3, 4, 5]
    }
  ]
}
```

### GET `/api/specialties`

**Response 200:**
```json
{
  "status": "success",
  "data": [
    { "id": "uuid", "nombre": "Medicina General", "activo": true },
    { "id": "uuid", "nombre": "Pediatria", "activo": true }
  ]
}
```

---

## 4. Disponibilidad

### GET `/api/doctors/{id}/availability?dow={1-5}`

**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "doctor_id": "uuid",
      "day_of_week": 1,
      "hora_inicio": "08:00",
      "hora_fin": "12:00",
      "duracion_slot": 30
    }
  ]
}
```

### POST `/api/doctors/{id}/availability`

**Request:**
```json
{
  "doctor_id": "uuid",
  "day_of_week": 2,
  "hora_inicio": "08:00",
  "hora_fin": "12:00",
  "duracion_slot": 30
}
```

### GET `/api/doctors/{id}/exceptions?date=2026-04-15`

**Response 200:**
```json
{
  "status": "success",
  "data": { "excepcion": true }
}
```

---

## 5. Citas

### POST `/api/appointments`

**Request:**
```json
{
  "paciente_id": "uuid",
  "doctor_id": "uuid",
  "especialidad_id": "uuid",
  "fecha": "2026-04-15",
  "hora_inicio": "09:00",
  "hora_fin": "09:30",
  "duracion_min": 30,
  "es_primera_vez": false,
  "motivo_consulta": "Control",
  "observaciones": "Renovacion de recipe"
}
```

**Response 201:**
```json
{
  "status": "success",
  "message": "Cita creada exitosamente",
  "data": {
    "id": "uuid",
    "paciente_id": "uuid",
    "doctor_id": "uuid",
    "especialidad_id": "uuid",
    "fecha": "2026-04-15",
    "hora_inicio": "09:00",
    "hora_fin": "09:30",
    "duracion_min": 30,
    "es_primera_vez": false,
    "estado": "pendiente",
    "motivo_consulta": "Control",
    "created_at": "2026-03-24T15:30:00Z"
  }
}
```

### GET `/api/appointments?{filtros}`

**Query params:** `fecha`, `doctor_id`, `especialidad_id`, `estado`, `q`, `mes` (YYYY-MM), `excluir_canceladas`, `page`, `page_size`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "fecha": "2026-04-15",
        "hora_inicio": "09:00",
        "hora_fin": "09:30",
        "estado": "pendiente",
        "paciente": {
          "id": "uuid",
          "nhm": 1001,
          "nombre": "Maria",
          "apellido": "Garcia",
          "cedula": "V-12345678",
          "relacion_univ": "empleado"
        },
        "doctor": {
          "id": "uuid",
          "nombre": "Carlos",
          "apellido": "Mendoza",
          "especialidad": "Medicina General"
        }
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "page_size": 25,
      "pages": 6,
      "has_next": true
    }
  }
}
```

### GET `/api/appointments/check-slot?doctor_id={}&fecha={}&hora_inicio={}`

**Response 200:**
```json
{
  "status": "success",
  "data": { "ocupado": false }
}
```

### PATCH `/api/appointments/{id}/status`

**Request:**
```json
{ "estado": "confirmada" }
```

**Valores validos:** `pendiente`, `confirmada`, `atendida`, `cancelada`, `no_asistio`

---

## 6. Historias Medicas

### GET `/api/medical-records?appointment_id={id}`

**Response 200 (encontrada):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "cita_id": "uuid",
    "paciente_id": "uuid",
    "doctor_id": "uuid",
    "evaluacion": {
      "motivo_consulta": "Dolor de cabeza",
      "anamnesis": "...",
      "examen_fisico": { "ta": "120/80", "fc": "72" },
      "diagnostico": { "cie10": "R51", "descripcion": "Cefalea tensional" },
      "tratamiento": "Ibuprofeno 400mg",
      "indicaciones": "Reposo"
    },
    "preparado": false,
    "preparado_at": null,
    "created_at": "2026-03-24T15:30:00Z"
  }
}
```

### PUT `/api/medical-records`

**Request:**
```json
{
  "cita_id": "uuid",
  "paciente_id": "uuid",
  "doctor_id": "uuid",
  "evaluacion": { "motivo_consulta": "...", "diagnostico": { "cie10": "R51", "descripcion": "..." } }
}
```

### PATCH `/api/medical-records/{id}/prepared`

**Request:**
```json
{ "preparado_por": "doctor:doc-uuid" }
```

---

## Codigos de Error

| Codigo | Significado | Ejemplo |
|--------|------------|---------|
| 401 | No autenticado / token invalido | `{ "status": "error", "message": "Token invalido o expirado" }` |
| 403 | Sin permisos | `{ "status": "error", "message": "Permiso requerido: patients:create" }` |
| 404 | No encontrado | `{ "status": "error", "message": "Paciente no encontrado" }` |
| 409 | Conflicto | `{ "status": "error", "message": "Ya existe un paciente con esta cedula" }` |
| 422 | Validacion | `{ "status": "error", "message": "Error de validacion", "data": [...] }` |

---

## Reglas de Negocio Validadas por el Backend

| Regla | Detalle |
|-------|---------|
| Minimo 2 dias para agendar | `fecha >= hoy + 2 dias` |
| Sin doble reserva | Un doctor no puede tener 2 citas en el mismo slot |
| Cedula unica | No se puede registrar 2 pacientes con la misma cedula |
| NHM auto-incremental | Generado por el backend (secuencia PostgreSQL) |
| Familiar requiere titular | Si `relacion_univ = "tercero"` → `parentesco` y `titular_nhm` obligatorios |
| Primera vez = 60 min | Si `es_primera_vez = true` → `duracion_min = 60` |
| Transiciones de estado | `pendiente → confirmada/cancelada`, `confirmada → atendida/cancelada/no_asistio` |
