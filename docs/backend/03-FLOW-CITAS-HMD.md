# Flujo Completo: Agendado de Citas → Evaluación Médica → Historia Clínica

> **Propósito:** Describir el flujo end-to-end desde que un paciente agenda una cita hasta que el doctor completa la evaluación médica.

---

## Diagrama de Flujo General

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  1. Agendar │────▶│ 2. Confirmar │────▶│  3. Evaluar   │────▶│ 4. Completar │
│    Cita     │     │    Cita      │     │   (Doctor)    │     │   Historia   │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
    Portal              Analista           Consultorio           Administración
   Público
```

---

## Fase 1: Agendado de Cita (Portal Público o Analista)

### Paso 1.1 — Identificación del Paciente
- **Acción:** Buscar por cédula o NHM
- **Endpoint:** `GET /api/patients?cedula={cedula}`
- **Si no existe:** Registrar nuevo paciente → `POST /api/patients`

### Paso 1.2 — Selección de Especialidad y Doctor
- **Acción:** Mostrar lista de especialidades activas y doctores disponibles
- **Endpoints:**
  - `GET /api/specialties`
  - `GET /api/doctors/options`

### Paso 1.3 — Selección de Fecha y Hora
- **Acción:** Mostrar calendario con días disponibles, luego slots horarios
- **Endpoints:**
  - `GET /api/doctors/{doctorId}/availability?dow={dayOfWeek}` — bloques base
  - `GET /api/doctors/{doctorId}/exceptions?date={fecha}` — excepciones/ausencias
  - `GET /api/appointments?doctor_id={id}&fecha={date}` — citas ya ocupadas
- **Lógica frontend:** Computa slots disponibles restando ocupados de los bloques base

### Paso 1.4 — Confirmación
- **Acción:** Verificar disponibilidad y crear la cita
- **Endpoints:**
  - `GET /api/appointments/check-slot?doctor_id={id}&fecha={date}&hora_inicio={time}` — guard contra race conditions
  - `POST /api/appointments` — crear con `estado: 'pendiente'`

### Paso 1.5 — Primera vez
- Si `es_primera_vez: true` → duración 60 min (en vez de 30)
- El frontend determina esto comparando si el paciente tiene citas previas con esa especialidad

---

## Fase 2: Gestión de Citas (Analista)

### Acciones disponibles
| Acción | Endpoint | Transición de estado |
|--------|----------|---------------------|
| Confirmar | `PATCH /api/appointments/{id}/status` | `pendiente` → `confirmada` |
| Cancelar | `PATCH /api/appointments/{id}/status` | `pendiente/confirmada` → `cancelada` |
| Exportar | (solo frontend, CSV local) | — |

### Vista del analista
- **Endpoint:** `GET /api/appointments?{filtros}` (paginado)
- **Dashboard:** `GET /api/appointments/stats?{filtros}`

---

## Fase 3: Evaluación Médica (Doctor)

### Paso 3.1 — Agenda del Día
El doctor ve sus citas del día.
- **Endpoint:** `GET /api/appointments?fecha={today}&doctor_id={doctorId}`

### Paso 3.2 — Abrir Evaluación
Al hacer clic en una cita, se carga todo en paralelo:
```
Promise.all([
  GET /api/appointments/{citaId}                    → datos de la cita + paciente
  GET /api/medical-records?appointment_id={citaId}  → historia existente (o null)
  GET /api/schemas/{specialtyName}                  → schema del formulario
  GET /api/medical-records/patient/{pacienteId}     → historial previo (últimas 5)
])
```

### Paso 3.3 — Formulario Dinámico
El frontend renderiza:
1. **Panel izquierdo:** Información del paciente, alertas médicas, historial previo
2. **Panel derecho:** Formulario dinámico según schema de la especialidad
3. **Secciones universales (siempre presentes):**
   - Observaciones / Notas libres
   - Receta médica (tabla de medicamentos)
4. **Widgets especializados (si el schema los incluye):**
   - Odontograma (dental_chart) — para Odontología
   - Mapa corporal (body_diagram) — para Dermatología

### Paso 3.4 — Autosave
Cada 3 segundos, si hay cambios:
- **Endpoint:** `PUT /api/medical-records` (upsert)
- El backend debe hacer upsert por `cita_id` (si ya existe, actualizar; si no, crear)
- **Importante:** Este endpoint se llama frecuentemente. Debe ser idempotente y rápido.

### Paso 3.5 — Guardado Manual
El doctor presiona "Guardar evaluación":
- **Endpoint:** `PUT /api/medical-records` (mismo que autosave, datos completos)

### Paso 3.6 — Marcar como Atendida
Después de guardar, el doctor marca la cita como atendida:
- **Endpoint:** `PATCH /api/appointments/{id}/status` → `{ "estado": "atendida" }`

---

## Fase 4: Finalización (Administración)

### Marcar Historia como Preparada
Un administrador puede marcar la historia como "preparada" (revisada y completa):
- **Endpoint:** `PATCH /api/medical-records/{historiaId}/prepared`
- **Body:** `{ "preparado_por": "userId" }`

---

## Estructura del Payload de Evaluación

El campo `evaluacion` en `medical_records` es un JSONB flexible. Su estructura depende de 3 capas:

### Capa 1: Campos del Schema de Especialidad (dinámicos)
Varían según la especialidad. Ejemplo para Medicina General:
```json
{
  "motivo_consulta": "Dolor de cabeza persistente",
  "anamnesis": "Refiere cefalea de 3 días de evolución...",
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
    "descripcion": "Cefalea no especificada"
  },
  "tratamiento": "Acetaminofén 500mg c/8h por 5 días",
  "indicaciones": "Reposo relativo, hidratación, control en 1 semana"
}
```

### Capa 2: Secciones Universales (siempre presentes)
Independientes del schema, el frontend siempre envía estos campos:
```json
{
  "observaciones": "Paciente ansioso, recomendar seguimiento psicológico",
  "receta": {
    "medicamentos": [
      {
        "id": "rx-a1b2c3",
        "medicamento": "Acetaminofén",
        "presentacion": "tabletas",
        "dosis": "500mg",
        "via": "oral",
        "frecuencia": "c/8h",
        "duracion": "5 días",
        "cantidad": 15,
        "indicaciones": "Tomar con alimentos"
      },
      {
        "id": "rx-d4e5f6",
        "medicamento": "Omeprazol",
        "presentacion": "capsulas",
        "dosis": "20mg",
        "via": "oral",
        "frecuencia": "Una vez al día",
        "duracion": "14 días",
        "cantidad": 14,
        "indicaciones": "En ayunas, 30 min antes del desayuno"
      }
    ]
  }
}
```

### Capa 3: Widgets Especializados (condicional por especialidad)
Solo presentes si el schema de la especialidad incluye un widget:

**Odontograma** (`examen_dental`):
```json
{
  "examen_dental": {
    "12": {
      "estado": "cariado",
      "descripcion": "Caries oclusal profunda con posible afectación pulpar",
      "soporte": "Periapical RX-01"
    },
    "24": {
      "estado": "obturado",
      "descripcion": "Obturación de amalgama en buen estado"
    },
    "36": {
      "estado": "extraido",
      "descripcion": "Extraído hace 2 años"
    },
    "46": {
      "estado": "ext_indicada",
      "descripcion": "Resto radicular, indicada exodoncia"
    },
    "15": {
      "estado": "protesis",
      "descripcion": "Corona metal-porcelana"
    }
  }
}
```
Estados posibles: `normal`, `cariado`, `obturado`, `ext_indicada`, `extraido`, `protesis`

**Mapa Corporal** (`diagrama_corporal`):
```json
{
  "diagrama_corporal": [
    {
      "id": "bm-1a2b",
      "x": 45,
      "y": 30,
      "view": "front",
      "descripcion": "Lesión eritematosa circular, 2cm diámetro, bordes definidos"
    },
    {
      "id": "bm-3c4d",
      "x": 60,
      "y": 55,
      "view": "back",
      "descripcion": "Mancha hiperpigmentada irregular, 1.5cm"
    }
  ]
}
```

---

## Diagrama de Estados de Cita

```
                    ┌─────────────┐
          ┌────────▶│  cancelada  │ (terminal)
          │         └─────────────┘
          │
┌─────────┴──┐     ┌──────────────┐     ┌──────────────┐
│  pendiente │────▶│  confirmada  │────▶│   atendida   │ (terminal)
└────────────┘     └──────┬───────┘     └──────────────┘
                          │
                          │         ┌──────────────┐
                          └────────▶│  no_asistió  │ (terminal)
                                    └──────────────┘
```

---

## Consideraciones para el Backend

1. **Upsert de historias médicas:** El `PUT /api/medical-records` debe hacer INSERT si no existe historia para esa `cita_id`, o UPDATE si ya existe. Se llama cada 3 segundos durante el autosave.

2. **Receta médica futura:** El campo `receta.medicamentos` dentro de `evaluacion` está preparado para integrarse con un futuro módulo de inventario. Por ahora solo se almacena como JSONB.

3. **Schemas de formularios:** Se almacenan como JSONB. El admin puede editarlos desde el Form Builder del frontend. El backend solo necesita guardarlos y servirlos.

4. **RBAC:** El frontend valida permisos del lado del cliente pero el backend debe revalidar. Roles: `paciente`, `analista`, `doctor`, `admin`.

5. **Búsqueda de pacientes:** El campo `search` en citas busca en `nombre`, `apellido` y `cedula` del paciente (JOIN). Soportar búsqueda parcial (ILIKE).
