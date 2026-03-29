# Especificación del Sistema de Schemas Dinámicos (Form Builder)

> **Propósito:** Documentar la estructura de los schemas que controlan qué formulario ve cada doctor según la especialidad.

---

## Concepto

Cada especialidad médica tiene su propio formulario de evaluación. En lugar de hardcodear formularios, el sistema usa **schemas JSON** que definen la estructura del formulario. Un administrador puede crear/editar estos schemas desde el Form Builder del frontend.

El backend solo necesita **almacenar y servir** estos schemas como JSONB. Toda la lógica de renderizado ocurre en el frontend.

---

## Estructura del Schema

```
MedicalFormSchema
├── id: string              ("medicina-general-v1")
├── version: string         ("1.0")
├── specialtyId: string     ("medicina-general")
├── specialtyName: string   ("Medicina General")
└── sections: FormSection[]
    ├── id: string
    ├── title: string
    ├── description?: string
    ├── icon?: string
    ├── collapsible?: boolean
    ├── defaultCollapsed?: boolean
    ├── conditions?: FieldCondition[]
    └── groups: FormFieldGroup[]
        ├── id: string
        ├── label?: string
        ├── description?: string
        ├── columns?: 1|2|3|4|6
        ├── conditions?: FieldCondition[]
        └── fields: FormFieldSchema[]
            ├── key: string           (dot-path: "examen_fisico.ta")
            ├── type: FieldType
            ├── label: string
            ├── placeholder?: string
            ├── hint?: string
            ├── defaultValue?: any
            ├── validation?: FieldValidation
            ├── conditions?: FieldCondition[]
            ├── options?: FieldOption[]
            ├── tableSchema?: TableSchema
            ├── widgetConfig?: WidgetConfig
            ├── colSpan?: 1-12
            ├── unit?: string
            └── rows?: number
```

---

## Tipos de Campo (FieldType)

| Tipo | Descripción | Datos asociados |
|------|-------------|-----------------|
| `text` | Input de texto, una línea | `string` |
| `textarea` | Texto multilínea | `string` |
| `number` | Input numérico | `number` |
| `date` | Selector de fecha | `string` (ISO date) |
| `time` | Selector de hora | `string` ("HH:MM") |
| `select` | Dropdown de selección única | `string` (valor seleccionado) |
| `combobox` | Select con búsqueda | `string` |
| `autocomplete` | Input con sugerencias | `string` |
| `checkbox` | Casilla Sí/No | `boolean` |
| `checkbox_group` | Múltiples casillas | `string[]` (valores seleccionados) |
| `radio` | Opciones excluyentes | `string` (valor seleccionado) |
| `switch` | Toggle On/Off | `boolean` |
| `table` | Tabla editable con filas dinámicas | `Record[]` |
| `widget` | Componente especializado (odontograma, mapa corporal, etc.) | variable |

---

## Validación (FieldValidation)

```json
{
  "required": true,
  "min": 0,
  "max": 300,
  "minLength": 2,
  "maxLength": 5000,
  "pattern": "^[A-Z][0-9]{2}",
  "patternMessage": "Formato CIE-10 inválido"
}
```

---

## Visibilidad Condicional (FieldCondition)

Permite mostrar/ocultar campos basado en valores de otros campos:

```json
{
  "conditions": [
    {
      "field": "antecedentes.diabetes",
      "operator": "eq",
      "value": true
    }
  ]
}
```

Operadores: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `in`, `not_in`, `truthy`, `falsy`

Todas las condiciones deben cumplirse (AND). Si alguna falla, el campo se oculta.

---

## Opciones (para select, radio, checkbox_group)

```json
{
  "options": [
    { "value": "leve", "label": "Leve", "description": "Sin impacto funcional" },
    { "value": "moderado", "label": "Moderado" },
    { "value": "severo", "label": "Severo", "description": "Requiere intervención" }
  ]
}
```

---

## Widgets Especializados (WidgetConfig)

```json
{
  "type": "widget",
  "widgetConfig": {
    "widgetType": "dental_chart",
    "props": {}
  }
}
```

Tipos de widget implementados:
| Widget | Uso | Datos que genera |
|--------|-----|-----------------|
| `dental_chart` | Odontología | `Record<string, ToothState>` — mapa de pieza dental → estado |
| `body_diagram` | Dermatología | `BodyMark[]` — array de marcadores con coordenadas |
| `pain_scale` | General | (pendiente) |
| `vaccination_table` | Pediatría | (pendiente) |
| `lab_grid` | Laboratorio | (pendiente) |

---

## Ejemplo Completo: Schema de Medicina General

```json
{
  "id": "medicina-general-v1",
  "version": "1.0",
  "specialtyId": "medicina-general",
  "specialtyName": "Medicina General",
  "sections": [
    {
      "id": "motivo",
      "title": "Motivo de Consulta",
      "icon": "clipboard",
      "groups": [
        {
          "id": "motivo-group",
          "fields": [
            {
              "key": "motivo_consulta",
              "type": "textarea",
              "label": "Motivo de consulta",
              "placeholder": "Describa el motivo principal...",
              "rows": 2,
              "validation": { "required": true, "maxLength": 2000 }
            },
            {
              "key": "anamnesis",
              "type": "textarea",
              "label": "Anamnesis",
              "placeholder": "Historia clínica...",
              "rows": 4
            }
          ]
        }
      ]
    },
    {
      "id": "examen-fisico",
      "title": "Examen Físico",
      "icon": "stethoscope",
      "groups": [
        {
          "id": "signos-vitales",
          "label": "Signos Vitales",
          "columns": 3,
          "fields": [
            { "key": "examen_fisico.ta", "type": "text", "label": "T.A.", "placeholder": "120/80", "colSpan": 4, "unit": "mmHg" },
            { "key": "examen_fisico.fc", "type": "text", "label": "F.C.", "placeholder": "72", "colSpan": 4, "unit": "lpm" },
            { "key": "examen_fisico.fr", "type": "text", "label": "F.R.", "placeholder": "16", "colSpan": 4, "unit": "rpm" },
            { "key": "examen_fisico.temp", "type": "text", "label": "Temp", "placeholder": "36.5", "colSpan": 4, "unit": "°C" },
            { "key": "examen_fisico.peso", "type": "text", "label": "Peso", "placeholder": "70", "colSpan": 4, "unit": "kg" },
            { "key": "examen_fisico.talla", "type": "text", "label": "Talla", "placeholder": "1.70", "colSpan": 4, "unit": "m" }
          ]
        }
      ]
    },
    {
      "id": "diagnostico",
      "title": "Diagnóstico",
      "icon": "search",
      "groups": [
        {
          "id": "diagnostico-group",
          "columns": 2,
          "fields": [
            { "key": "diagnostico.cie10", "type": "text", "label": "Código CIE-10", "placeholder": "J00", "colSpan": 3 },
            { "key": "diagnostico.descripcion", "type": "text", "label": "Descripción", "placeholder": "Ej: Rinofaringitis aguda", "colSpan": 9 }
          ]
        }
      ]
    },
    {
      "id": "tratamiento",
      "title": "Tratamiento e Indicaciones",
      "icon": "pill",
      "groups": [
        {
          "id": "tratamiento-group",
          "fields": [
            { "key": "tratamiento", "type": "textarea", "label": "Tratamiento", "placeholder": "Medicamentos, dosis...", "rows": 3 },
            { "key": "indicaciones", "type": "textarea", "label": "Indicaciones", "placeholder": "Reposo, dieta...", "rows": 3 }
          ]
        }
      ]
    }
  ]
}
```

---

## Ejemplo: Schema con Widget (Odontología parcial)

```json
{
  "id": "odontologia-v1",
  "specialtyId": "odontologia",
  "specialtyName": "Odontología",
  "sections": [
    {
      "id": "examen-dental",
      "title": "Examen Dental",
      "groups": [
        {
          "id": "odontograma",
          "fields": [
            {
              "key": "examen_dental",
              "type": "widget",
              "label": "Odontograma",
              "hint": "Registre el estado de cada pieza dental",
              "widgetConfig": {
                "widgetType": "dental_chart"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Normalización de Nombre a Key

El frontend normaliza nombres de especialidad para usarlos como keys:

```
"Medicina General"  → "medicina-general"
"Odontología"       → "odontologia"
"Cirugía General"   → "cirugia-general"
"Control Prenatal"  → "control-prenatal"
```

Reglas:
1. Minúsculas
2. Remover acentos (NFD + strip combining marks)
3. Espacios → guiones
4. Solo alfanumérico y guiones

El backend debe implementar la misma normalización para poder buscar schemas tanto por UUID como por nombre normalizado.

---

## Notas para el Backend

1. **Solo almacenar y servir:** El backend no necesita interpretar la estructura del schema. Solo guardar el JSON y retornarlo cuando se solicite.

2. **Versionamiento:** El campo `version` permite mantener múltiples versiones del mismo schema. Las historias médicas guardan `schema_id` y `schema_version` para saber con qué versión fueron creadas.

3. **Fallback:** Si se solicita un schema que no existe, retornar el de "Medicina General" como fallback (o 404 y dejar que el frontend use su fallback local).

4. **Validación mínima:** El backend puede validar que el JSON tiene la estructura básica (`id`, `version`, `specialtyId`, `sections` como array) pero no necesita validar la estructura profunda de campos.
