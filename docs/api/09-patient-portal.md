# Módulo: Portal del Paciente

> **Rutas frontend**: `/portal/*`, `/agendar`, `/mis-citas`
> **Acceso**: Público (login/registro) + Autenticado como paciente
> **Sin mock flag dedicado** — usa los flags de `MOCK_PACIENTES` y `MOCK_CITAS`

---

## Contexto

El portal del paciente es la interfaz pública del sistema. Permite a pacientes:
1. Registrarse con la planilla ULA completa (5 pasos)
2. Ingresar con su cédula (sin contraseña)
3. Agendar citas médicas (wizard de 5 pasos)
4. Ver su hub personal: citas próximas, historial médico, recetas

---

## 1. Login del Paciente

### `POST /auth/patient/login`

> Documentado en [01-auth.md](01-auth.md). Resumen aquí por contexto del portal.

Busca paciente por cédula o NHM. No requiere contraseña.

**Request:**
```json
{
  "query": "V-12345678",
  "query_type": "cedula"
}
```

**Response (200):**
```typescript
{
  found: true,
  patient: {
    id: string;
    nhm: number;
    nombre: string;
    apellido: string;
    relacion_univ: RelacionUniversidad;
    es_nuevo: boolean;
  },
  auth: AuthUser   // Para setear cookie de sesión
}
```

**Response (200, no encontrado):**
```json
{ "found": false, "patient": null }
```

**Fuente frontend**: `src/routes/portal/login/+page.server.ts`

---

## 2. Registro del Paciente (Planilla ULA)

### `POST /patients/register`

Crea un paciente nuevo con todos los campos de la planilla ULA. Después del registro, el backend debe generar el NHM automáticamente y crear la sesión.

**Request:**
```typescript
{
  // I. Identificación
  nombre: string;                   // Requerido
  apellido: string;                 // Requerido
  cedula: string;                   // Requerido, único
  telefono: string;                 // Requerido
  correo?: string;

  // II. Datos Personales
  sexo?: 'M' | 'F';
  fecha_nacimiento?: string;        // YYYY-MM-DD
  pais?: string;                    // Default: "Venezuela"
  estado_geo?: string;              // Estado geográfico (Mérida, Táchira...)
  ciudad?: string;

  // III. Información Socio-económica
  estado_civil?: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre';
  tipo_sangre?: string;             // "O+", "A-", etc.
  religion?: string;
  clasificacion_economica?: string;
  profesion?: string;
  ocupacion_actual?: string;

  // IV. Relación Universitaria
  relacion_univ: string;            // Código: P, E, O, B, X, R, S, T, C, F
  parentesco?: 'hijo' | 'padre' | 'madre' | 'conyuge' | 'otro';
  titular_cedula?: string;          // Cédula del titular (si es familiar)

  // V. Direcciones
  direccion_habitacion?: string;
  direccion_trabajo?: string;

  // VI. Contacto de Emergencia
  emergencia_nombre?: string;
  emergencia_parentesco?: string;
  emergencia_telefono?: string;
  emergencia_direccion?: string;

  // VII. Alergias y Alertas
  alergias?: string;                // Texto libre separado por comas
  alertas_medicas?: string;         // Condiciones crónicas
}
```

**Validaciones del backend:**
1. `nombre`, `apellido`, `cedula` son obligatorios
2. `cedula` debe ser única → 409 si ya existe
3. Si `relacion_univ` indica familiar (R, S, T, C, F): `titular_cedula` es obligatorio
4. Si `titular_cedula` se provee: verificar que exista un paciente con esa cédula → 404 si no existe
5. `nhm` se auto-incrementa (obtener máximo actual + 1)
6. Calcular `edad` a partir de `fecha_nacimiento`
7. Componer `lugar_nacimiento` como "ciudad, estado, país"

**Response (200):**
```typescript
{
  paciente: {
    id: string;
    nhm: number;
    nombre: string;
    apellido: string;
    relacion_univ: string;
    es_nuevo: boolean;              // true (recién creado)
  }
}
```

**Códigos de error:**

| Código | Descripción |
|--------|-------------|
| 400 | Campos obligatorios faltantes |
| 404 | Titular no encontrado (si es familiar) |
| 409 | Cédula ya registrada |

**Fuentes frontend**:
- `src/routes/portal/registro/+page.server.ts` (formulario del portal)
- `src/routes/(app)/agendar/+server.ts` (acción `registrarPaciente` del wizard)

---

## 3. Wizard de Agendamiento

### REST API: `POST /agendar`

El wizard usa un endpoint REST propio (no form actions). El frontend envía JSON con un campo `action` que determina la operación.

**Fuente frontend**: `src/routes/(app)/agendar/+server.ts`

---

### 3.1 Buscar Paciente

**Action**: `buscarPaciente`

```json
{
  "action": "buscarPaciente",
  "query": "V-12345678",
  "queryType": "cedula"
}
```

**Lógica**: Si `queryType = 'nhm'`, parsear como entero y buscar por NHM. Si `queryType = 'cedula'`, buscar por cédula.

**Response:**
```typescript
{ found: boolean; paciente: PacientePublic | null }
```

**Endpoint backend equivalente**: `GET /patients?cedula=X` o `GET /patients?nhm=Y`

---

### 3.2 Registrar Paciente (desde wizard)

**Action**: `registrarPaciente`

Mismos campos que la sección 2 (Registro del Paciente). El wizard envía todos los campos del formulario ULA.

**Endpoint backend equivalente**: `POST /patients/register`

---

### 3.3 Obtener Slots Disponibles

**Action**: `obtenerSlots`

```json
{
  "action": "obtenerSlots",
  "doctorId": "doc-001",
  "fecha": "2026-04-10",
  "esNuevo": true
}
```

**Lógica del backend:**
1. Validar que `fecha` sea ≥ 2 días después de hoy
2. Calcular `dayOfWeek` (1=Lun...5=Vie, 7=Dom)
3. Obtener bloques de disponibilidad del doctor para ese día
4. Verificar si hay excepción (día libre) para esa fecha
5. Si hay excepción o no hay disponibilidad → `{ slots: [], duracion: 30 }`
6. Determinar `duracion`: 60 min si `esNuevo=true`, 30 min si `false`
7. Calcular slots disponibles con `computeAvailableSlots(disponibilidad, citasExistentes, duracion)`
8. Retornar slots con `{ hora_inicio, hora_fin, disponible }`

**Response:**
```typescript
{
  slots: Array<{
    hora_inicio: string;    // "08:00"
    hora_fin: string;       // "08:30" o "09:00" si primera vez
    disponible: boolean;
  }>;
  duracion: 30 | 60;
}
```

**Endpoint backend recomendado**: `GET /appointments/available-slots?doctor_id=X&fecha=Y&es_nuevo=Z`

---

### 3.4 Obtener Fechas Disponibles del Mes

**Action**: `obtenerFechasDisponibles`

> Este endpoint es llamado desde `+page.server.ts` (no desde el +server.ts REST)

```json
{
  "doctorId": "doc-001",
  "year": 2026,
  "month": 4
}
```

**Lógica**: Para cada día del mes, verificar si el doctor tiene al menos 1 slot disponible.

**Response:**
```typescript
{ availableDates: string[] }
// ["2026-04-03", "2026-04-04", "2026-04-07", ...]
```

**Endpoint backend recomendado**: `GET /appointments/available-dates?doctor_id=X&year=Y&month=Z`

---

### 3.5 Confirmar Cita

**Action**: `confirmarCita`

```json
{
  "action": "confirmarCita",
  "pacienteId": "pac-001",
  "doctorId": "doc-001",
  "especialidadId": "esp-001",
  "fecha": "2026-04-10",
  "hora_inicio": "09:00",
  "hora_fin": "09:30",
  "duracion_min": 30,
  "es_primera_vez": false,
  "motivo_consulta": "Control rutinario",
  "observaciones": ""
}
```

**Validaciones:**
1. Todos los campos requeridos presentes
2. `fecha` ≥ 2 días después de hoy
3. **Verificar slot no ocupado** (prevención de doble-reserva): `isSlotOccupied(doctorId, fecha, hora_inicio)`
4. Si ocupado → 409

**Response (200):**
```typescript
{
  citaId: string;
  redirectUrl: '/mis-citas?agendada=1'
}
```

**Endpoint backend equivalente**: `POST /appointments` (ya documentado en [03-appointments.md](03-appointments.md))

---

## 4. Hub del Paciente (Mis Citas)

### Datos que carga `/mis-citas`

El hub del paciente carga 3 conjuntos de datos en paralelo:

| Dato | Endpoint | Documentado en |
|------|----------|----------------|
| Citas del paciente | `GET /appointments?patient_cedula=X&page_size=100` | [03-appointments.md](03-appointments.md) |
| Historial médico | `GET /medical-records/patient/{id}?limit=20` | [05-medical-records.md](05-medical-records.md) |
| Recetas del paciente | `GET /inventory/prescriptions?patient_id=X` | [07-pharmacy.md](07-pharmacy.md) |

**Fuente frontend**: `src/routes/(app)/mis-citas/+page.server.ts`

---

### Cancelar Cita (acción del paciente)

### `PATCH /appointments/{id}/status`

El paciente puede cancelar sus propias citas pendientes/confirmadas.

```json
{ "estado": "cancelada" }
```

**Validación adicional**: El backend debe verificar que el paciente autenticado sea el dueño de la cita (`cita.paciente_id === session.user.id`).

---

## 5. Redirect Post-Agendamiento

Después de confirmar una cita exitosamente:
- El frontend redirige a `/mis-citas?agendada=1`
- El query param `agendada=1` dispara un toast de éxito
- El param se limpia de la URL con `history.replaceState`

No requiere endpoint adicional — es lógica 100% frontend.

---

## Resumen de Endpoints del Portal

| # | Método | Path | Descripción | Mock Flag |
|---|--------|------|-------------|-----------|
| 1 | POST | `/auth/patient/login` | Login por cédula | — |
| 2 | POST | `/patients/register` | Registro planilla ULA | `MOCK_PACIENTES` |
| 3 | GET | `/patients?cedula=X` | Buscar paciente | `MOCK_PACIENTES` |
| 4 | GET | `/appointments/available-slots` | Slots disponibles para fecha | `MOCK_CITAS` + `MOCK_DOCTORES` |
| 5 | GET | `/appointments/available-dates` | Fechas con disponibilidad | `MOCK_CITAS` + `MOCK_DOCTORES` |
| 6 | POST | `/appointments` | Confirmar cita | `MOCK_CITAS` |
| 7 | GET | `/appointments?patient_cedula=X` | Citas del paciente | `MOCK_CITAS` |
| 8 | PATCH | `/appointments/{id}/status` | Cancelar cita | `MOCK_CITAS` |
| 9 | GET | `/medical-records/patient/{id}` | Historial médico | `MOCK_HISTORIAS` |
| 10 | GET | `/inventory/prescriptions?patient_id=X` | Recetas del paciente | `MOCK_INVENTORY_PRESCRIPTIONS` |

---

## Flujo Completo del Paciente

```
Portal (/portal)
  ├── "Ya tengo expediente" → /portal/login
  │     └── Ingresa cédula → POST /auth/patient/login
  │           ├── Encontrado → Cookie + redirect → /mis-citas
  │           └── No encontrado → "Regístrese"
  │
  └── "Soy nuevo" → /portal/registro
        └── 5 pasos → POST /patients/register
              └── Cookie + redirect → /agendar

Agendar (/agendar)
  ├── Step 0: Identificación → buscarPaciente
  ├── Step 1: Registro (si nuevo) → registrarPaciente
  ├── Step 2: Selección doctor
  ├── Step 3: Fecha + hora → obtenerSlots
  └── Step 4: Confirmar → confirmarCita → redirect /mis-citas?agendada=1

Hub (/mis-citas)
  ├── Citas próximas (cancelar/reagendar)
  ├── Historial de consultas (read-only)
  └── Recetas médicas (read-only)
```
