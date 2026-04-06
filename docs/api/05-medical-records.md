# Módulo: Historias Médicas y Schemas de Formularios

> **Flags de mock:**
> - `MOCK_HISTORIAS` — Datos simulados para historias médicas.
> - `MOCK_SCHEMAS` — Datos simulados para schemas de formularios dinámicos.

---

## Tabla de contenido

1. [Interfaces de Historias Médicas](#interfaces-de-historias-médicas)
2. [Interfaces de Schemas de Formularios](#interfaces-de-schemas-de-formularios)
3. [Endpoints de Historias Médicas](#endpoints-de-historias-médicas)
4. [Endpoints de Schemas](#endpoints-de-schemas)

---

## Interfaces de Historias Médicas

### `ExamenFisico`

Signos vitales y medidas antropométricas registradas durante la consulta.

```typescript
interface ExamenFisico {
  ta?: string;    // Tensión arterial (ej: "120/80")
  fc?: string;    // Frecuencia cardíaca (ej: "72")
  fr?: string;    // Frecuencia respiratoria (ej: "18")
  temp?: string;  // Temperatura (ej: "36.5")
  peso?: string;  // Peso en kg (ej: "70")
  talla?: string; // Talla en cm (ej: "170")
}
```

### `Diagnostico`

```typescript
interface Diagnostico {
  cie10?: string;        // Código CIE-10 (ej: "J06.9")
  descripcion?: string;  // Descripción libre del diagnóstico
}
```

### `Evaluacion`

Estructura fija de la evaluación médica (schema legacy / Medicina General).

```typescript
interface Evaluacion {
  motivo_consulta?: string;
  anamnesis?: string;
  examen_fisico?: ExamenFisico;
  diagnostico?: Diagnostico;
  tratamiento?: string;
  indicaciones?: string;
}
```

### `HistoriaMedica`

Registro principal de historia médica, vinculado a una cita.

```typescript
interface HistoriaMedica {
  id: string;            // UUID
  cita_id: string;       // FK → Cita.id
  paciente_id: string;   // FK → Paciente.id
  doctor_id: string;     // FK → Doctor.id
  evaluacion: Evaluacion;
  preparado: boolean;    // true si enfermería ya preparó al paciente
  preparado_at?: string; // ISO datetime de cuándo se preparó
  created_at: string;    // ISO datetime
  updated_at: string;    // ISO datetime
}
```

### `DynamicEvaluacion`

Evaluación dinámica: las keys coinciden con los `field.key` del schema de formulario usado.

```typescript
interface DynamicEvaluacion {
  [key: string]: unknown;
}
```

### `HistoriaMedicaDynamic`

Extiende `HistoriaMedica` para historias generadas con schemas dinámicos.

```typescript
interface HistoriaMedicaDynamic extends HistoriaMedica {
  schema_id: string;       // ID del MedicalFormSchema usado
  schema_version: string;  // Versión del schema al momento de guardar
  evaluacion: DynamicEvaluacion;
}
```

### `HistorialPrevioEntry`

Resumen de una historia previa del paciente, usado en el panel de insights del médico.

```typescript
interface HistorialPrevioEntry {
  id: string;
  fecha: string;                    // Fecha ISO "2025-04-10"
  especialidad: string;             // Nombre de la especialidad
  doctor_nombre: string;            // Nombre completo del doctor
  diagnostico_descripcion?: string; // Descripción del diagnóstico
  diagnostico_cie10?: string;       // Código CIE-10
}
```

---

## Interfaces de Schemas de Formularios

El motor de formularios dinámicos permite definir schemas JSON por especialidad que controlan qué campos se renderizan en la UI de evaluación médica.

### `FieldType`

Tipos de campo soportados por el motor de formularios.

```typescript
type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'combobox'
  | 'autocomplete'
  | 'checkbox'
  | 'checkbox_group'
  | 'radio'
  | 'switch'
  | 'table'
  | 'widget';
```

### `FieldValidation`

Reglas de validación aplicables a un campo.

```typescript
interface FieldValidation {
  required?: boolean;
  min?: number;            // Valor mínimo (para number)
  max?: number;            // Valor máximo (para number)
  minLength?: number;      // Longitud mínima (para text/textarea)
  maxLength?: number;      // Longitud máxima (para text/textarea)
  pattern?: string;        // Regex de validación
  patternMessage?: string; // Mensaje de error personalizado para el pattern
}
```

### `ConditionOperator`

Operadores disponibles para visibilidad condicional de campos.

```typescript
type ConditionOperator =
  | 'eq'      // Igual
  | 'neq'     // No igual
  | 'gt'      // Mayor que
  | 'lt'      // Menor que
  | 'gte'     // Mayor o igual
  | 'lte'     // Menor o igual
  | 'in'      // Está en array
  | 'not_in'  // No está en array
  | 'truthy'  // Valor truthy (no requiere value)
  | 'falsy';  // Valor falsy (no requiere value)
```

### `FieldCondition`

Define una condición de visibilidad que referencia otro campo del formulario.

```typescript
interface FieldCondition {
  field: string;          // Dot-path al campo referenciado (ej: "antecedentes.diabetes")
  operator: ConditionOperator;
  value?: unknown;        // Valor de comparación (omitido para truthy/falsy)
}
```

> **Nota:** Cuando un campo o grupo tiene múltiples condiciones, se evalúan con lógica **AND** (todas deben cumplirse).

### `FieldOption`

Opción para campos de tipo `select`, `radio` y `checkbox_group`.

```typescript
interface FieldOption {
  value: string;
  label: string;
  description?: string;
}
```

### `TableColumnSchema`

Definición de una columna para campos de tipo `table`.

```typescript
interface TableColumnSchema {
  key: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: FieldOption[];
  width?: string;
  validation?: FieldValidation;
}
```

### `TableSchema`

Configuración completa de un campo de tipo `table`.

```typescript
interface TableSchema {
  columns: TableColumnSchema[];
  defaultRow: Record<string, unknown>; // Valores por defecto para una nueva fila
  minRows?: number;
  maxRows?: number;
  addLabel?: string;                   // Texto del botón "Agregar fila"
}
```

### `WidgetType`

Tipos de widget especial soportados.

```typescript
type WidgetType =
  | 'dental_chart'       // Odontograma
  | 'body_diagram'       // Diagrama corporal
  | 'pain_scale'         // Escala de dolor
  | 'vaccination_table'  // Tabla de vacunación
  | 'lab_grid';          // Grilla de laboratorio
```

### `WidgetConfig`

Configuración de un campo de tipo `widget`.

```typescript
interface WidgetConfig {
  widgetType: WidgetType;
  props?: Record<string, unknown>; // Props específicos del widget
}
```

### `FormFieldSchema`

Schema de un campo individual del formulario.

```typescript
interface FormFieldSchema {
  key: string;                     // Identificador único, usado como data path (ej: "examen_fisico.ta")
  type: FieldType;
  label: string;
  placeholder?: string;
  hint?: string;                   // Texto de ayuda debajo del campo
  defaultValue?: unknown;
  validation?: FieldValidation;
  conditions?: FieldCondition[];   // Todas deben cumplirse (AND) para mostrar el campo
  options?: FieldOption[];         // Para select, radio, checkbox_group
  tableSchema?: TableSchema;       // Para type 'table'
  widgetConfig?: WidgetConfig;     // Para type 'widget'
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // Columnas en grid de 12
  unit?: string;                   // Sufijo de unidad (ej: "mmHg", "kg", "°C")
  rows?: number;                   // Filas para textarea
}
```

### `FormFieldGroup`

Agrupación lógica de campos dentro de una sección.

```typescript
interface FormFieldGroup {
  id: string;
  label?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4 | 6;   // Columnas del grid para este grupo
  fields: FormFieldSchema[];
  conditions?: FieldCondition[];   // Visibilidad condicional del grupo completo
}
```

### `FormSection`

Sección del formulario (equivale a un "tab" o "acordeón" en la UI).

```typescript
interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;                   // Nombre del ícono (ej: "stethoscope")
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  groups: FormFieldGroup[];
  conditions?: FieldCondition[];   // Visibilidad condicional de la sección completa
}
```

### `MedicalFormSchema`

Schema de nivel superior que define el formulario completo de una especialidad.

```typescript
interface MedicalFormSchema {
  id: string;              // UUID del schema
  version: string;         // Versión semántica (ej: "1.0.0")
  specialtyId: string;     // FK → Especialidad.id
  specialtyName: string;   // Nombre legible (ej: "Medicina General")
  sections: FormSection[];
}
```

---

## Endpoints de Historias Médicas

### `GET /medical-records?appointment_id={citaId}`

Busca la historia médica asociada a una cita específica.

| Parámetro        | Ubicación | Tipo   | Requerido | Descripción       |
|------------------|-----------|--------|-----------|-------------------|
| `appointment_id` | query     | string | Sí        | UUID de la cita   |

**Respuesta:** `HistoriaMedica | null`

Devuelve `null` si la cita aún no tiene historia médica registrada.

**Servicio frontend:** `historias.service.ts → findByCita(citaId)`

---

### `GET /medical-records/{historiaId}`

Obtiene una historia médica por su ID.

| Parámetro    | Ubicación | Tipo   | Requerido | Descripción              |
|--------------|-----------|--------|-----------|--------------------------|
| `historiaId` | path      | string | Sí        | UUID de la historia      |

**Respuesta:** `HistoriaMedica | null`

**Servicio frontend:** `historias.service.ts → findById(historiaId)`

---

### `PUT /medical-records`

Crea o actualiza (upsert) una historia médica. Si ya existe una historia para la cita indicada, la actualiza; si no, la crea.

**Request body (schema fijo):**

```json
{
  "cita_id": "cita-uuid-...",
  "paciente_id": "pac-uuid-...",
  "doctor_id": "doc-uuid-...",
  "evaluacion": {
    "motivo_consulta": "Dolor de cabeza persistente",
    "anamnesis": "Paciente refiere cefalea de 3 días...",
    "examen_fisico": {
      "ta": "120/80",
      "fc": "72",
      "fr": "18",
      "temp": "36.5",
      "peso": "70",
      "talla": "170"
    },
    "diagnostico": {
      "cie10": "R51",
      "descripcion": "Cefalea tensional"
    },
    "tratamiento": "Ibuprofeno 400mg c/8h",
    "indicaciones": "Reposo, hidratación, control en 1 semana"
  }
}
```

**Request body (schema dinámico):**

Para historias basadas en schemas de formularios dinámicos, se incluyen los campos `schema_id` y `schema_version`. La `evaluacion` es un objeto con claves que corresponden a los `field.key` del schema.

```json
{
  "cita_id": "cita-uuid-...",
  "paciente_id": "pac-uuid-...",
  "doctor_id": "doc-uuid-...",
  "schema_id": "schema-uuid-...",
  "schema_version": "1.2.0",
  "evaluacion": {
    "motivo_consulta": "Control odontológico",
    "odontograma": { "pieza_18": "caries_oclusal" },
    "plan_tratamiento": "Restauración pieza 18"
  }
}
```

**Respuesta:** `HistoriaMedica`

**Servicios frontend:**
- `historias.service.ts → upsertHistoria(citaId, pacienteId, doctorId, evaluacion)` (schema fijo)
- `historias.service.ts → upsertHistoriaDynamic(citaId, pacienteId, doctorId, evaluacion, schemaId, schemaVersion)` (schema dinámico)

---

### `GET /medical-records/patient/{pacienteId}`

Obtiene un resumen de las historias médicas previas de un paciente, ordenadas de más reciente a más antigua.

| Parámetro    | Ubicación | Tipo   | Requerido | Descripción                                                 |
|--------------|-----------|--------|-----------|-------------------------------------------------------------|
| `pacienteId` | path      | string | Sí        | UUID del paciente                                           |
| `limit`      | query     | number | No        | Cantidad máxima de resultados (default: 5)                  |
| `exclude`    | query     | string | No        | UUID de cita a excluir (para no mostrar la consulta actual) |

**Respuesta:** `HistorialPrevioEntry[]`

```json
[
  {
    "id": "hist-uuid-...",
    "fecha": "2025-03-20",
    "especialidad": "Medicina General",
    "doctor_nombre": "María González",
    "diagnostico_descripcion": "Cefalea tensional",
    "diagnostico_cie10": "R51"
  },
  {
    "id": "hist-uuid-...",
    "fecha": "2025-02-10",
    "especialidad": "Odontología",
    "doctor_nombre": "Carlos Pérez",
    "diagnostico_descripcion": "Caries dental",
    "diagnostico_cie10": "K02.1"
  }
]
```

**Servicio frontend:** `historias.service.ts → findByPaciente(pacienteId, options?)`

---

### `PATCH /medical-records/{historiaId}/prepared`

Marca una historia médica como "preparada" por enfermería. Esto indica que los signos vitales y datos preliminares ya fueron registrados.

| Parámetro    | Ubicación | Tipo   | Requerido | Descripción             |
|--------------|-----------|--------|-----------|-------------------------|
| `historiaId` | path      | string | Sí        | UUID de la historia     |

**Request body:**

```json
{
  "preparado_por": "user-uuid-enfermera"
}
```

**Respuesta:** `void` (204 No Content)

**Efecto:** Establece `preparado = true` y `preparado_at` con la fecha/hora actual.

**Servicio frontend:** `historias.service.ts → marcarPreparado(historiaId, preparadoPor)`

---

## Endpoints de Schemas

### `GET /schemas/{specialtyIdOrName}`

Obtiene el schema de formulario para una especialidad. Acepta tanto el UUID de la especialidad como su nombre normalizado (ej: `medicina-general`).

| Parámetro            | Ubicación | Tipo   | Requerido | Descripción                                      |
|----------------------|-----------|--------|-----------|--------------------------------------------------|
| `specialtyIdOrName`  | path      | string | Sí        | UUID de la especialidad o nombre normalizado      |

**Normalización de nombres:** Los nombres de especialidad se normalizan a minúsculas, sin acentos, espacios reemplazados por guiones. Ejemplo: `"Medicina General"` se convierte en `"medicina-general"`.

**Respuesta:** `MedicalFormSchema`

```json
{
  "id": "schema-uuid-...",
  "version": "1.0.0",
  "specialtyId": "esp-001",
  "specialtyName": "Medicina General",
  "sections": [
    {
      "id": "sec-motivo",
      "title": "Motivo de Consulta",
      "icon": "stethoscope",
      "groups": [
        {
          "id": "grp-principal",
          "columns": 1,
          "fields": [
            {
              "key": "motivo_consulta",
              "type": "textarea",
              "label": "Motivo de consulta",
              "validation": { "required": true },
              "rows": 3,
              "colSpan": 12
            }
          ]
        }
      ]
    }
  ]
}
```

> **Nota:** El servicio frontend implementa cache en memoria. Si no existe un schema para la especialidad solicitada, devuelve un schema de fallback (Medicina General).

**Servicio frontend:** `schemas.service.ts → getFormSchema(specialtyIdOrName)`

---

### `GET /schemas`

Obtiene todos los schemas de formularios disponibles.

**Respuesta:** `MedicalFormSchema[]`

**Servicio frontend:** `schemas.service.ts → getAllSchemas()`

---

### `PUT /schemas`

Crea o actualiza (upsert) un schema de formulario. La operación se identifica por `specialtyId`.

**Request body:** `MedicalFormSchema`

```json
{
  "id": "schema-uuid-...",
  "version": "1.1.0",
  "specialtyId": "esp-002",
  "specialtyName": "Odontología",
  "sections": [
    {
      "id": "sec-odontograma",
      "title": "Odontograma",
      "icon": "tooth",
      "groups": [
        {
          "id": "grp-chart",
          "fields": [
            {
              "key": "odontograma",
              "type": "widget",
              "label": "Odontograma",
              "widgetConfig": {
                "widgetType": "dental_chart"
              },
              "colSpan": 12
            }
          ]
        }
      ]
    }
  ]
}
```

**Respuesta:** `MedicalFormSchema`

> **Nota:** Al guardar un schema, el cache en memoria del servicio se invalida automáticamente para esa especialidad.

**Servicio frontend:** `schemas.service.ts → saveSchema(schema)`

---

### `DELETE /schemas/{specialtyKey}`

Elimina un schema de formulario. El `specialtyKey` es el nombre normalizado de la especialidad.

| Parámetro      | Ubicación | Tipo   | Requerido | Descripción                               |
|----------------|-----------|--------|-----------|-------------------------------------------|
| `specialtyKey` | path      | string | Sí        | Nombre normalizado (ej: "odontologia")    |

**Respuesta:** `void` (204 No Content)

**Servicio frontend:** `schemas.service.ts → deleteSchema(specialtyKey)`

---

### Invalidación de cache

El servicio frontend mantiene un cache en memoria (`Map`) para schemas, ya que cambian con poca frecuencia. El cache se invalida automáticamente en operaciones `saveSchema` y `deleteSchema`.

Para invalidación manual (por ejemplo, al recibir una notificación de que otro admin actualizó un schema):

```typescript
// Invalidar un schema específico
invalidateSchemaCache('esp-002');

// Invalidar todo el cache
invalidateSchemaCache();
```

---

## Archivos fuente relevantes

| Archivo | Descripción |
|---------|-------------|
| `src/lib/server/historias.service.ts` | Servicio de historias médicas |
| `src/lib/server/schemas.service.ts` | Servicio de schemas de formularios dinámicos |
| `src/lib/shared/types/appointments.ts` | Interfaces base: HistoriaMedica, Evaluacion, ExamenFisico, Diagnostico |
| `src/lib/shared/types/medical-records.ts` | Interfaces extendidas: HistoriaMedicaDynamic, DynamicEvaluacion, HistorialPrevioEntry |
| `src/lib/shared/types/form-schema.ts` | Interfaces del motor de formularios: MedicalFormSchema, FormSection, FormFieldSchema, etc. |
