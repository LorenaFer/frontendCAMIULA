# Contrato de API — Frontend ↔ Backend

> **Fecha:** 2026-03-26
> **Propósito:** Documentar todos los endpoints que el frontend SvelteKit espera del backend FastAPI.
> **Acción requerida:** El equipo de backend debe implementar estos endpoints y retornar un documento de confirmación con cualquier ajuste.

---

## Convenciones Generales

### Base URL
```
API_URL = http://localhost:8000
```
Todas las rutas llevan prefijo `/api`. Ejemplo: `GET /api/appointments`

### Envelope de Respuesta
Todas las respuestas deben seguir este formato:
```json
{
  "status": "success",
  "message": "Operación exitosa",
  "data": { ... }
}
```
El frontend extrae automáticamente el campo `data`. En caso de error:
```json
{
  "status": "error",
  "message": "Descripción del error",
  "data": null
}
```

### Paginación
Respuestas paginadas:
```json
{
  "status": "success",
  "data": {
    "items": [...],
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

### IDs
Todos los IDs son **UUID v4** (`string`).

### Fechas
- Fechas: ISO 8601 `"2026-03-26"`
- Horas: formato 24h `"09:00"`, `"14:30"`
- Timestamps: ISO 8601 con timezone `"2026-03-26T14:30:00Z"`

### Timeout
El frontend aborta requests después de **15 segundos**.

### Autenticación
(A definir por backend — actualmente mock con cookie `mock_auth` que contiene JSON del usuario)

---

## 1. Pacientes (`/api/patients`)

### GET /api/patients?nhm={number}
Buscar paciente por Número de Historia Médica.
- **Response:** `PacientePublic | null`

### GET /api/patients?cedula={string}
Buscar paciente por cédula.
- **Response:** `PacientePublic | null`

### GET /api/patients/full?cedula={string}
Datos completos del paciente (incluye datos médicos, contacto de emergencia).
- **Response:** `Paciente | null`

### GET /api/patients/max-nhm
Obtener el NHM más alto registrado (para asignar el siguiente).
- **Response:** `{ "max_nhm": 1045 }`

### POST /api/patients
Registrar nuevo paciente.
- **Body:**
```json
{
  "cedula": "V-12345678",
  "nombre": "Pedro",
  "apellido": "González",
  "sexo": "M",
  "fecha_nacimiento": "1985-06-15",
  "lugar_nacimiento": "Mérida",
  "estado_civil": "casado",
  "procedencia": "Mérida",
  "direccion_habitacion": "Av. Las Américas",
  "telefono": "0412-1234567",
  "profesion": "Ingeniero",
  "ocupacion_actual": "Docente",
  "relacion_univ": "empleado",
  "parentesco": null,
  "titular_nhm": null,
  "datos_medicos": {
    "tipo_sangre": "O+",
    "alergias": ["Penicilina"],
    "condiciones": ["Hipertensión"]
  },
  "contacto_emergencia": {
    "nombre": "María González",
    "parentesco": "Esposa",
    "telefono": "0414-1112233"
  }
}
```
- **Response:** `Paciente` (con `id`, `nhm` asignado, `es_nuevo: true`, `created_at`)

### Tipos de Referencia

```typescript
// Valores posibles para campos enum:
type RelacionUniversidad = 'empleado' | 'estudiante' | 'profesor' | 'tercero';
type Parentesco = 'hijo' | 'padre' | 'madre' | 'conyuge' | 'otro';
type Sexo = 'M' | 'F';
type EstadoCivil = 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre';
```

---

## 2. Especialidades (`/api/specialties`)

### GET /api/specialties
Listar todas las especialidades.
- **Response:** `Especialidad[]`
```json
[
  { "id": "uuid", "nombre": "Medicina General", "activo": true },
  { "id": "uuid", "nombre": "Odontología", "activo": true }
]
```

### POST /api/specialties
Crear nueva especialidad.
- **Body:** `{ "nombre": "Cardiología" }`
- **Response:** `Especialidad` (con `id` generado, `activo: true`)

### PUT /api/specialties/{id}
Actualizar especialidad.
- **Body:** `{ "nombre": "Cardiología Intervencionista" }`
- **Response:** `Especialidad`

### PATCH /api/specialties/{id}/toggle
Alternar estado activo/inactivo.
- **Body:** ninguno
- **Response:** `Especialidad` (con `activo` invertido)

---

## 3. Doctores (`/api/doctors`)

### GET /api/doctors?active=true
Listar doctores activos con su especialidad.
- **Response:** `DoctorConEspecialidad[]`
```json
[
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
```

### GET /api/doctors/options
Lista reducida para dropdowns de selección.
- **Response:** `DoctorOption[]`
```json
[
  {
    "id": "uuid",
    "nombre_completo": "Carlos Mendoza",
    "especialidad": "Medicina General",
    "especialidad_id": "uuid",
    "dias_trabajo": [1, 2, 3, 4, 5]
  }
]
```

### GET /api/doctors/{doctorId}/availability
Todos los bloques de disponibilidad del doctor.
- **Response:** `DisponibilidadDoctor[]`

### GET /api/doctors/{doctorId}/availability?dow={1-5}
Bloques de disponibilidad para un día de la semana específico.
- **Response:** `DisponibilidadDoctor[]`
```json
[
  {
    "id": "uuid",
    "doctor_id": "uuid",
    "day_of_week": 1,
    "hora_inicio": "08:00",
    "hora_fin": "12:00",
    "duracion_slot": 30
  }
]
```

### GET /api/doctors/{doctorId}/exceptions?date={YYYY-MM-DD}
Verificar si el doctor tiene una excepción (ausencia) en una fecha.
- **Response:** `{ "excepcion": true/false }`

### POST /api/doctors/{doctorId}/availability
Crear bloque de disponibilidad.
- **Body:**
```json
{
  "day_of_week": 1,
  "hora_inicio": "08:00",
  "hora_fin": "12:00",
  "duracion_slot": 30
}
```
- **Response:** `DisponibilidadDoctor`

### DELETE /api/doctors/{doctorId}/availability/{bloqueId}
Eliminar bloque de disponibilidad.

### PATCH /api/doctors/{doctorId}/availability/{bloqueId}
Modificar horario de un bloque.
- **Body:** `{ "hora_inicio": "09:00", "hora_fin": "13:00" }`

---

## 4. Citas (`/api/appointments`)

### POST /api/appointments
Crear nueva cita.
- **Body:**
```json
{
  "paciente_id": "uuid",
  "doctor_id": "uuid",
  "especialidad_id": "uuid",
  "fecha": "2026-04-01",
  "hora_inicio": "09:00",
  "hora_fin": "09:30",
  "duracion_min": 30,
  "es_primera_vez": false,
  "motivo_consulta": "Control rutinario",
  "observaciones": null,
  "created_by": "portal_publico"
}
```
- **Validación:** Verificar que el slot no esté ocupado antes de crear.
- **Response:** `Cita` (con `id`, `estado: 'pendiente'`, `created_at`)

### GET /api/appointments?{filtros}
Listar citas con filtros y paginación.
- **Query params:**
  - `fecha` (YYYY-MM-DD)
  - `doctor_id` (UUID)
  - `especialidad_id` (UUID)
  - `estado` ('pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio')
  - `search` (busca en nombre/apellido/cédula del paciente)
  - `page` (default: 1)
  - `page_size` (default: 25)
- **Response:** `PaginatedResponse<CitaConPaciente>`

### GET /api/appointments/{id}
Detalle de cita con paciente y doctor incluidos.
- **Response:** `CitaConPaciente` (incluye objeto `paciente: Paciente` y `doctor: DoctorConEspecialidad`)

### PATCH /api/appointments/{id}/status
Cambiar estado de la cita.
- **Body:** `{ "estado": "atendida" }`
- **Transiciones válidas:**
  - `pendiente` → `confirmada`, `cancelada`
  - `confirmada` → `atendida`, `no_asistio`, `cancelada`
  - `atendida` → (terminal)
  - `cancelada` → (terminal)
  - `no_asistio` → (terminal)

### GET /api/appointments/check-slot?doctor_id={id}&fecha={date}&hora_inicio={time}
Verificar si un slot ya está ocupado (race condition guard).
- **Response:** `{ "ocupado": true/false }`

### GET /api/appointments/stats?{filtros}
Estadísticas de citas para el dashboard.
- **Query params:** mismos que el listado (fecha, doctor_id, especialidad_id)
- **Response:**
```json
{
  "total": 45,
  "byStatus": { "pendiente": 10, "confirmada": 15, "atendida": 18, "cancelada": 2 },
  "bySpecialty": [{ "name": "Medicina General", "count": 30 }],
  "byDoctor": [{ "name": "Dr. Mendoza", "specialty": "Medicina General", "count": 25, "atendidas": 18 }],
  "firstTimeCount": 8,
  "returningCount": 37,
  "byPatientType": { "empleado": 20, "estudiante": 15, "profesor": 5, "tercero": 5 },
  "dailyTrend": [5, 8, 6, 7, 9, 4, 6],
  "peakHours": [{ "hour": "09:00", "count": 12 }, { "hour": "10:00", "count": 10 }]
}
```

---

## 5. Historias Médicas (`/api/medical-records`)

### GET /api/medical-records?appointment_id={citaId}
Obtener historia médica de una cita específica.
- **Response:** `HistoriaMedica | null` (null si aún no se ha creado)

### PUT /api/medical-records
Crear o actualizar historia médica (upsert por `cita_id`).
- **Body (formato dinámico — preferido):**
```json
{
  "cita_id": "uuid",
  "paciente_id": "uuid",
  "doctor_id": "uuid",
  "schema_id": "medicina-general-v1",
  "schema_version": "1.0",
  "evaluacion": {
    "motivo_consulta": "Dolor de cabeza",
    "anamnesis": "Paciente refiere cefalea de 3 días...",
    "examen_fisico": {
      "ta": "120/80",
      "fc": "72",
      "fr": "16",
      "temp": "36.5",
      "peso": "75",
      "talla": "1.75"
    },
    "diagnostico": {
      "cie10": "R51",
      "descripcion": "Cefalea"
    },
    "tratamiento": "Acetaminofén 500mg c/8h",
    "indicaciones": "Reposo, hidratación",
    "observaciones": "Paciente estable, se indica control en 1 semana",
    "receta": {
      "medicamentos": [
        {
          "id": "rx-1",
          "medicamento": "Acetaminofén",
          "presentacion": "tabletas",
          "dosis": "500mg",
          "via": "oral",
          "frecuencia": "c/8h",
          "duracion": "5 días",
          "cantidad": 15,
          "indicaciones": "Tomar con alimentos"
        }
      ]
    },
    "examen_dental": {
      "12": { "estado": "cariado", "descripcion": "Caries oclusal profunda", "soporte": "Periapical RX-01" },
      "24": { "estado": "obturado", "descripcion": "Obturación amalgama" }
    },
    "diagrama_corporal": [
      { "id": "bm-1", "x": 45, "y": 30, "view": "front", "descripcion": "Lesión eritematosa 2cm" }
    ]
  }
}
```
- **Nota:** El campo `evaluacion` es un JSON libre cuya estructura depende del schema de la especialidad. Los campos `observaciones`, `receta`, `examen_dental` y `diagrama_corporal` son secciones universales que pueden estar presentes independientemente del schema.
- **Response:** `HistoriaMedica`

### GET /api/medical-records/patient/{pacienteId}?limit={n}&exclude={citaId}
Historial previo del paciente (para el panel de insights).
- **Query params:**
  - `limit`: máximo de registros (default: 5)
  - `exclude`: excluir la cita actual del historial
- **Response:** `HistorialPrevioEntry[]`

### PATCH /api/medical-records/{historiaId}/prepared
Marcar historia como preparada/finalizada.
- **Body:** `{ "preparado_por": "userId" }`

---

## 6. Schemas de Formularios (`/api/schemas`)

### GET /api/schemas
Listar todos los schemas de formularios disponibles.
- **Response:** `MedicalFormSchema[]`

### GET /api/schemas/{specialtyIdOrName}
Obtener schema por ID de especialidad o nombre normalizado.
- El nombre se normaliza: `"Medicina General"` → `"medicina-general"`
- **Response:** `MedicalFormSchema`
- **Fallback:** Si no existe schema, retornar el de Medicina General como default.

### PUT /api/schemas
Crear o actualizar un schema (upsert por `specialtyId`).
- **Body:** `MedicalFormSchema` completo (ver estructura en siguiente documento)
- **Response:** `MedicalFormSchema` (con timestamps)

### DELETE /api/schemas/{specialtyKey}
Eliminar schema de una especialidad.

---

## Siguiente Paso

El equipo de backend debe:
1. Revisar estos contratos
2. Adaptarlos a sus estándares (FastAPI Pydantic models)
3. Documentar cualquier cambio en las rutas, campos o formatos
4. Retornar un **documento final** con los endpoints confirmados

Documentos complementarios:
- `02-DATA-MODELS.md` — Modelos de datos detallados
- `03-FLOW-CITAS-HMD.md` — Flujo completo de citas → evaluación médica
- `04-FORM-SCHEMA-SPEC.md` — Especificación del sistema de schemas dinámicos
