# Modulo: Farmacia -- Recetas, Despachos, Limites y Reportes

> **Base URL:** `/inventory`
> **Servicios frontend:** `src/lib/server/inventory/prescriptions.service.ts`, `dispatches.service.ts`, `limits.service.ts`, `reports.service.ts`
> **Tipos compartidos:** `src/lib/shared/types/inventory.ts`

---

## Tabla de Contenidos

1. [Recetas (Prescriptions)](#1-recetas-prescriptions)
2. [Despachos (Dispatches)](#2-despachos-dispatches)
3. [Limites de Despacho](#3-limites-de-despacho)
4. [Excepciones de Despacho](#4-excepciones-de-despacho)
5. [Reportes](#5-reportes)
6. [Interfaces TypeScript](#6-interfaces-typescript)
7. [Logica de Negocio](#7-logica-de-negocio)

---

## 1. Recetas (Prescriptions)

**Mock flag:** `MOCK_INVENTORY_PRESCRIPTIONS`

### 1.1 Obtener receta por cita

```
GET /inventory/prescriptions?appointment_id={appointment_id}
```

| Parametro        | Tipo   | Ubicacion | Requerido | Descripcion               |
|------------------|--------|-----------|-----------|---------------------------|
| `appointment_id` | string | query     | Si        | ID de la cita medica      |

**Respuesta:** `Prescription | null`

Devuelve la receta asociada a una cita especifica, o `null` si no existe.

---

### 1.2 Obtener receta por ID

```
GET /inventory/prescriptions/{id}
```

| Parametro | Tipo   | Ubicacion | Requerido | Descripcion       |
|-----------|--------|-----------|-----------|-------------------|
| `id`      | string | path      | Si        | ID de la receta   |

**Respuesta:** `Prescription`

**Errores:**
- `404` - Receta no encontrada

---

### 1.3 Obtener receta por numero

```
GET /inventory/prescriptions?prescription_number={prescription_number}
```

| Parametro             | Tipo   | Ubicacion | Requerido | Descripcion                        |
|-----------------------|--------|-----------|-----------|------------------------------------|
| `prescription_number` | string | query     | Si        | Numero de receta (ej: `RX-00001`) |

**Respuesta:** `Prescription | null`

El valor se envia con `encodeURIComponent` desde el frontend.

---

### 1.4 Obtener recetas de un paciente

```
GET /inventory/prescriptions?patient_id={patient_id}
```

| Parametro    | Tipo   | Ubicacion | Requerido | Descripcion       |
|--------------|--------|-----------|-----------|-------------------|
| `patient_id` | string | query     | Si        | ID del paciente   |

**Respuesta:** `Prescription[]`

Devuelve todas las recetas del paciente (array, puede estar vacio).

---

### 1.5 Crear receta

```
POST /inventory/prescriptions
```

**Body:** `CreatePrescriptionInput`

```json
{
  "fk_appointment_id": "apt-001",
  "fk_patient_id": "pat-001",
  "notes": "Tomar con alimentos",
  "items": [
    {
      "medication_id": "med-001",
      "quantity_prescribed": 30,
      "dosage_instructions": "1 tableta cada 8 horas",
      "duration_days": 10
    }
  ]
}
```

**Respuesta:** `Prescription`

El backend genera automaticamente:
- `id` - Identificador unico
- `prescription_number` - Numero secuencial (formato `RX-XXXXX`)
- `fk_doctor_id` - Se extrae del contexto de autenticacion
- `prescription_date` - Fecha actual
- `prescription_status` - Inicial: `"issued"`
- `created_at` - Timestamp de creacion

---

## 2. Despachos (Dispatches)

**Mock flag:** `MOCK_INVENTORY_DISPATCHES`

### 2.1 Listar despachos

```
GET /inventory/dispatches?patient_id=X&prescription_number=X&status=X&date_from=X&date_to=X&page=1&page_size=25
```

| Parametro             | Tipo           | Ubicacion | Requerido | Descripcion                                        |
|-----------------------|----------------|-----------|-----------|----------------------------------------------------|
| `patient_id`          | string         | query     | No        | Filtrar por paciente                               |
| `prescription_number` | string         | query     | No        | Busqueda parcial por numero de receta              |
| `status`              | DispatchStatus | query     | No        | `"pending"`, `"completed"`, `"cancelled"`          |
| `date_from`           | string (date)  | query     | No        | Fecha inicio (formato ISO `YYYY-MM-DD`)            |
| `date_to`             | string (date)  | query     | No        | Fecha fin (formato ISO `YYYY-MM-DD`)               |
| `page`                | number         | query     | No        | Pagina (default: `1`)                              |
| `page_size`           | number         | query     | No        | Elementos por pagina (default: `25`)               |

**Respuesta:** `InventoryPaginatedResponse<Dispatch>`

```json
{
  "data": [ /* Dispatch[] */ ],
  "total": 42,
  "page": 1,
  "pageSize": 25,
  "hasNext": true
}
```

---

### 2.2 Validar despacho

```
GET /inventory/dispatches/validate?prescription_id={prescription_id}
```

| Parametro         | Tipo   | Ubicacion | Requerido | Descripcion        |
|-------------------|--------|-----------|-----------|--------------------|
| `prescription_id` | string | query     | Si        | ID de la receta    |

**Respuesta:** `DispatchValidation`

```json
{
  "can_dispatch": true,
  "prescription_id": "presc-001",
  "patient_id": "pat-001",
  "items": [
    {
      "medication_id": "med-001",
      "generic_name": "Acetaminofen",
      "quantity_prescribed": 30,
      "quantity_available": 500,
      "monthly_limit": 60,
      "monthly_used": 30,
      "monthly_remaining": 30,
      "has_exception": false,
      "can_dispatch": true,
      "block_reason": null
    }
  ]
}
```

**Errores:**
- `404` - Receta no encontrada

Este endpoint debe invocarse **antes** de ejecutar un despacho. Verifica:
- Stock disponible por medicamento
- Limites mensuales por tipo de paciente
- Excepciones vigentes

Ver seccion [Logica de Negocio](#7-logica-de-negocio) para detalles del algoritmo.

---

### 2.3 Ejecutar despacho

```
POST /inventory/dispatches
```

**Body:** `ExecuteDispatchInput`

```json
{
  "prescription_id": "presc-001",
  "pharmacist_id": "user-001",
  "notes": "Entregado al paciente"
}
```

**Respuesta:** `Dispatch`

El backend ejecuta las siguientes operaciones en una **transaccion atomica**:
1. Valida limites mensuales y stock (misma logica que el endpoint de validacion)
2. Selecciona lotes usando algoritmo **FEFO** (First Expiry, First Out)
3. Deduce stock de los lotes seleccionados
4. Crea el registro de despacho con estado `"completed"`
5. Actualiza el estado de la receta a `"dispensed"`

**Errores:**
- `404` - Receta no encontrada
- `422` - Validacion fallida (stock insuficiente o limite mensual superado)

---

### 2.4 Cancelar despacho

```
POST /inventory/dispatches/{id}/cancel
```

| Parametro | Tipo   | Ubicacion | Requerido | Descripcion        |
|-----------|--------|-----------|-----------|--------------------|
| `id`      | string | path      | Si        | ID del despacho    |

**Body:**

```json
{
  "reason": "Paciente rechazo medicamento"
}
```

**Respuesta:** `void` (204 No Content)

Al cancelar un despacho:
- Se cambia el estado a `"cancelled"`
- Se registra el motivo en `notes`
- El backend debe **revertir** la deduccion de stock de los lotes afectados

**Errores:**
- `404` - Despacho no encontrado

---

## 3. Limites de Despacho

**Mock flag:** `MOCK_INVENTORY_LIMITS`

### 3.1 Listar limites

```
GET /inventory/dispatch-limits
```

**Respuesta:** `DispatchLimit[]`

Devuelve todos los limites de despacho configurados. Cada limite define la cantidad maxima mensual de un medicamento para un grupo de pacientes.

---

### 3.2 Crear limite

```
POST /inventory/dispatch-limits
```

**Body:** `CreateDispatchLimitInput`

```json
{
  "fk_medication_id": "med-001",
  "monthly_max_quantity": 60,
  "applies_to": "all"
}
```

| Campo                  | Tipo            | Requerido | Descripcion                                          |
|------------------------|-----------------|-----------|------------------------------------------------------|
| `fk_medication_id`     | string          | Si        | ID del medicamento                                   |
| `monthly_max_quantity`  | number          | Si        | Cantidad maxima mensual permitida                    |
| `applies_to`           | LimitAppliesTo  | Si        | `"all"`, `"student"`, `"employee"`, `"professor"`    |

**Respuesta:** `DispatchLimit`

---

### 3.3 Actualizar limite

```
PATCH /inventory/dispatch-limits/{id}
```

| Parametro | Tipo   | Ubicacion | Requerido | Descripcion       |
|-----------|--------|-----------|-----------|-------------------|
| `id`      | string | path      | Si        | ID del limite     |

**Body:** `Partial<CreateDispatchLimitInput>`

Todos los campos son opcionales. Solo se actualizan los campos enviados.

**Respuesta:** `DispatchLimit`

**Errores:**
- `404` - Limite no encontrado

---

## 4. Excepciones de Despacho

**Mock flag:** `MOCK_INVENTORY_LIMITS`

Las excepciones permiten autorizar cantidades adicionales por encima del limite mensual para pacientes especificos.

### 4.1 Listar excepciones

```
GET /inventory/dispatch-exceptions
```

**Respuesta:** `DispatchException[]`

---

### 4.2 Crear excepcion

```
POST /inventory/dispatch-exceptions
```

**Body:** `CreateDispatchExceptionInput`

```json
{
  "fk_patient_id": "pat-001",
  "fk_medication_id": "med-001",
  "authorized_quantity": 30,
  "valid_from": "2026-04-01",
  "valid_until": "2026-04-30",
  "reason": "Tratamiento post-quirurgico requiere dosis mayor"
}
```

| Campo                 | Tipo   | Requerido | Descripcion                                  |
|-----------------------|--------|-----------|----------------------------------------------|
| `fk_patient_id`       | string | Si        | ID del paciente                              |
| `fk_medication_id`    | string | Si        | ID del medicamento                           |
| `authorized_quantity`  | number | Si        | Cantidad adicional autorizada                |
| `valid_from`          | string | Si        | Fecha inicio de vigencia (`YYYY-MM-DD`)      |
| `valid_until`         | string | Si        | Fecha fin de vigencia (`YYYY-MM-DD`)         |
| `reason`              | string | Si        | Justificacion de la excepcion                |

**Respuesta:** `DispatchException`

**Errores:**
- `404` - Medicamento no encontrado

---

## 5. Reportes

**Mock flag:** `MOCK_INVENTORY_REPORTS`

### 5.1 Reporte de stock

```
GET /inventory/reports/stock
```

**Respuesta:** `StockReport`

```json
{
  "generated_at": "2026-04-02T10:30:00.000Z",
  "items": [ /* StockItem[] */ ],
  "total_medications": 85,
  "critical_count": 3,
  "expired_count": 1
}
```

Cada `StockItem` incluye:
- Stock total disponible consolidado por medicamento
- Cantidad de lotes activos (`batch_count`)
- Fecha del lote mas proximo a vencer (`nearest_expiration`)
- Dias restantes para vencimiento (`days_to_expiration`)
- Nivel de alerta: `"ok"`, `"low"`, `"critical"`, `"expired"`

---

### 5.2 Reporte de consumo

```
GET /inventory/reports/consumption?period={YYYY-MM}
```

| Parametro | Tipo   | Ubicacion | Requerido | Descripcion                           |
|-----------|--------|-----------|-----------|---------------------------------------|
| `period`  | string | query     | Si        | Periodo en formato `YYYY-MM`          |

**Respuesta:** `ConsumptionReport`

```json
{
  "period": "2026-03",
  "items": [
    {
      "medication_id": "med-001",
      "generic_name": "Acetaminofen 500mg",
      "total_dispatched": 450,
      "dispatch_count": 15,
      "patient_count": 12
    }
  ]
}
```

---

### 5.3 Reporte de vencimientos

```
GET /inventory/reports/expiration?threshold_days={days}
```

| Parametro        | Tipo   | Ubicacion | Requerido | Descripcion                                  |
|------------------|--------|-----------|-----------|----------------------------------------------|
| `threshold_days` | number | query     | No        | Dias de anticipacion (default: `90`)         |

**Respuesta:** `ExpirationReport`

```json
{
  "generated_at": "2026-04-02T10:30:00.000Z",
  "threshold_days": 90,
  "batches": [ /* Batch[] - lotes que vencen dentro del umbral */ ]
}
```

Solo incluye lotes con `batch_status = "available"` cuya `expiration_date` cae dentro del periodo de umbral.

---

## 6. Interfaces TypeScript

### Tipos enumerados

```typescript
type PrescriptionStatus = 'draft' | 'issued' | 'dispensed' | 'cancelled';
type DispatchStatus     = 'pending' | 'completed' | 'cancelled';
type StockAlert         = 'ok' | 'low' | 'critical' | 'expired';
type LimitAppliesTo     = 'all' | 'student' | 'employee' | 'professor';
type BatchStatus        = 'available' | 'depleted' | 'expired' | 'quarantine';
```

### Recetas

```typescript
interface PrescriptionItem {
  id: string;
  fk_medication_id: string;
  medication: MedicationOption;
  quantity_prescribed: number;
  dosage_instructions?: string;
  duration_days?: number;
}

interface Prescription {
  id: string;
  prescription_number: string;
  fk_appointment_id: string;
  fk_patient_id: string;
  fk_doctor_id: string;
  patient_name?: string;
  doctor_name?: string;
  prescription_date: string;       // YYYY-MM-DD
  notes?: string;
  prescription_status: PrescriptionStatus;
  items: PrescriptionItem[];
  created_at: string;              // ISO 8601
}

interface CreatePrescriptionInput {
  fk_appointment_id: string;
  fk_patient_id: string;
  notes?: string;
  items: Array<{
    medication_id: string;
    quantity_prescribed: number;
    dosage_instructions?: string;
    duration_days?: number;
  }>;
}
```

### Despachos

```typescript
interface DispatchItem {
  id: string;
  fk_batch_id: string;
  lot_number: string;
  expiration_date: string;         // YYYY-MM-DD
  fk_medication_id: string;
  medication: MedicationOption;
  quantity_dispatched: number;
}

interface Dispatch {
  id: string;
  fk_prescription_id: string;
  prescription_number: string;
  fk_patient_id: string;
  patient_name?: string;
  fk_pharmacist_id: string;
  pharmacist_name?: string;
  dispatch_date: string;           // YYYY-MM-DD
  notes?: string;
  dispatch_status: DispatchStatus;
  items: DispatchItem[];
  created_at: string;              // ISO 8601
}

interface ExecuteDispatchInput {
  prescription_id: string;
  pharmacist_id: string;
  notes?: string;
}
```

### Validacion de despacho

```typescript
interface DispatchValidationItem {
  medication_id: string;
  generic_name: string;
  quantity_prescribed: number;
  quantity_available: number;
  monthly_limit?: number;           // undefined si no hay limite configurado
  monthly_used: number;
  monthly_remaining: number;
  has_exception: boolean;
  can_dispatch: boolean;
  block_reason?: string;
}

interface DispatchValidation {
  can_dispatch: boolean;            // true solo si TODOS los items pueden despacharse
  prescription_id: string;
  patient_id: string;
  items: DispatchValidationItem[];
}
```

### Limites y excepciones

```typescript
interface DispatchLimit {
  id: string;
  fk_medication_id: string;
  medication: MedicationOption;
  monthly_max_quantity: number;
  applies_to: LimitAppliesTo;       // 'all' | 'student' | 'employee' | 'professor'
  active: boolean;
  created_at: string;
}

interface CreateDispatchLimitInput {
  fk_medication_id: string;
  monthly_max_quantity: number;
  applies_to: LimitAppliesTo;
}

interface DispatchException {
  id: string;
  fk_patient_id: string;
  patient_name?: string;
  fk_medication_id: string;
  medication: MedicationOption;
  authorized_quantity: number;
  valid_from: string;               // YYYY-MM-DD
  valid_until: string;              // YYYY-MM-DD
  reason: string;
  authorized_by?: string;
  created_at: string;
}

interface CreateDispatchExceptionInput {
  fk_patient_id: string;
  fk_medication_id: string;
  authorized_quantity: number;
  valid_from: string;
  valid_until: string;
  reason: string;
}
```

### Reportes

```typescript
interface StockReport {
  generated_at: string;
  items: StockItem[];
  total_medications: number;
  critical_count: number;
  expired_count: number;
}

interface StockItem {
  medication_id: string;
  code: string;
  generic_name: string;
  pharmaceutical_form: string;
  unit_measure: string;
  total_available: number;
  batch_count: number;
  nearest_expiration?: string;
  days_to_expiration?: number;
  stock_alert: StockAlert;
}

interface ConsumptionReport {
  period: string;                   // YYYY-MM
  items: ConsumptionItem[];
}

interface ConsumptionItem {
  medication_id: string;
  generic_name: string;
  total_dispatched: number;
  dispatch_count: number;
  patient_count: number;
}

interface ExpirationReport {
  generated_at: string;
  threshold_days: number;
  batches: Batch[];
}
```

### Tipo auxiliar: MedicationOption

Usado como referencia embebida en multiples interfaces:

```typescript
interface MedicationOption {
  id: string;
  code: string;
  generic_name: string;
  pharmaceutical_form: string;
  concentration?: string;
  unit_measure: string;
  current_stock: number;
}
```

### Paginacion

```typescript
interface InventoryPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}
```

### Filtros de despacho

```typescript
interface DispatchFilters {
  patient_id?: string;
  prescription_number?: string;
  status?: DispatchStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}
```

---

## 7. Logica de Negocio

### 7.1 Algoritmo FEFO (First Expiry, First Out)

Al ejecutar un despacho (`POST /inventory/dispatches`), el backend selecciona los lotes de medicamento usando el algoritmo **FEFO**:

1. Para cada item de la receta, se consultan los lotes disponibles del medicamento (`batch_status = "available"`, `quantity_available > 0`)
2. Los lotes se **ordenan por fecha de vencimiento ascendente** (el que vence primero se usa primero)
3. Se va descontando del lote con vencimiento mas proximo hasta cubrir la cantidad recetada
4. Si un lote no es suficiente, se continua con el siguiente lote
5. Cada item de despacho (`DispatchItem`) registra el lote del que provino: `fk_batch_id`, `lot_number`, `expiration_date`

**Objetivo:** Minimizar el desperdicio por vencimiento, asegurando que los medicamentos proximos a expirar se consuman primero.

> **Nota:** La logica FEFO se ejecuta exclusivamente en el backend (FastAPI). El mock del frontend no implementa seleccion de lotes real para evitar inconsistencias.

### 7.2 Validacion de limites mensuales

Antes de ejecutar un despacho, el sistema valida limites mensuales por medicamento y tipo de paciente:

**Proceso de validacion (implementado en `dispatch-validation.ts`):**

1. **Identificar periodo:** Se toma el mes actual (`YYYY-MM`)
2. **Calcular uso mensual:** Se suman todas las cantidades despachadas (`quantity_dispatched`) del mismo medicamento, al mismo paciente, en el mes actual, con estado `"completed"`
3. **Buscar limite aplicable:** Se busca un `DispatchLimit` activo para el medicamento. El campo `applies_to` determina a que grupo de pacientes aplica:
   - `"all"` -- Aplica a todos los pacientes
   - `"student"` -- Solo estudiantes (codigo `B` en `relacion_univ`)
   - `"employee"` -- Solo empleados (codigo `E`)
   - `"professor"` -- Solo profesores (codigo `P`)
4. **Verificar excepcion:** Si existe un `DispatchException` vigente (fecha actual entre `valid_from` y `valid_until`) para el paciente y medicamento, la cantidad autorizada se **suma** al limite base
5. **Evaluar:** `uso_mensual + cantidad_recetada <= limite_base + excepcion`

**Ejemplo:**
- Limite mensual de Acetaminofen: 60 unidades
- Paciente ya recibio 50 unidades este mes
- Receta actual: 20 unidades
- Excepcion activa: +30 unidades autorizadas
- Limite efectivo: 60 + 30 = 90
- Evaluacion: 50 + 20 = 70 <= 90 --> **Aprobado**

### 7.3 Logica de excepciones (override)

Las excepciones permiten superar el limite mensual estandar:

- Son **por paciente y por medicamento** (no globales)
- Tienen un **rango de vigencia** (`valid_from` a `valid_until`)
- La `authorized_quantity` se **suma** al limite mensual base (no lo reemplaza)
- Si no existe un limite para el medicamento, la excepcion no tiene efecto (no hay nada que incrementar)
- El campo `reason` documenta la justificacion medica
- El campo `authorized_by` registra quien autorizo la excepcion

### 7.4 Deduccion de stock en despacho

Al ejecutarse un despacho exitoso:

1. Se seleccionan lotes via FEFO (ver seccion 7.1)
2. Se reduce `quantity_available` de cada lote usado
3. Si un lote queda en `quantity_available = 0`, su `batch_status` cambia a `"depleted"`
4. Se recalcula `current_stock` del medicamento (suma de `quantity_available` de todos los lotes activos)
5. El estado de la receta cambia de `"issued"` a `"dispensed"`

**Al cancelar un despacho** (`POST /inventory/dispatches/{id}/cancel`):
- Se revierten las deducciones de stock
- Los lotes recuperan las cantidades descontadas
- El `batch_status` puede volver a `"available"` si habia cambiado a `"depleted"`

### 7.5 Reglas de bloqueo

Un item se marca como `can_dispatch: false` cuando:

| Condicion                | `block_reason`                                                    |
|--------------------------|-------------------------------------------------------------------|
| Stock insuficiente       | `"Stock insuficiente: disponible {N}, necesario {M}"`            |
| Limite mensual superado  | `"Limite mensual superado: usado {N}/{limite_efectivo}"`          |

El despacho global (`DispatchValidation.can_dispatch`) es `true` **solo si todos los items** pueden despacharse.

---

## Resumen de Endpoints

| #  | Metodo | Ruta                                          | Descripcion                    | Mock Flag                       |
|----|--------|-----------------------------------------------|--------------------------------|---------------------------------|
| 1  | GET    | `/inventory/prescriptions?appointment_id=X`   | Receta por cita                | `MOCK_INVENTORY_PRESCRIPTIONS`  |
| 2  | GET    | `/inventory/prescriptions/{id}`               | Receta por ID                  | `MOCK_INVENTORY_PRESCRIPTIONS`  |
| 3  | GET    | `/inventory/prescriptions?prescription_number=X` | Receta por numero           | `MOCK_INVENTORY_PRESCRIPTIONS`  |
| 4  | GET    | `/inventory/prescriptions?patient_id=X`       | Recetas de un paciente         | `MOCK_INVENTORY_PRESCRIPTIONS`  |
| 5  | POST   | `/inventory/prescriptions`                    | Crear receta                   | `MOCK_INVENTORY_PRESCRIPTIONS`  |
| 6  | GET    | `/inventory/dispatches`                       | Listar despachos (paginado)    | `MOCK_INVENTORY_DISPATCHES`     |
| 7  | GET    | `/inventory/dispatches/validate?prescription_id=X` | Validar despacho          | `MOCK_INVENTORY_DISPATCHES`     |
| 8  | POST   | `/inventory/dispatches`                       | Ejecutar despacho              | `MOCK_INVENTORY_DISPATCHES`     |
| 9  | POST   | `/inventory/dispatches/{id}/cancel`           | Cancelar despacho              | `MOCK_INVENTORY_DISPATCHES`     |
| 10 | GET    | `/inventory/dispatch-limits`                  | Listar limites                 | `MOCK_INVENTORY_LIMITS`         |
| 11 | POST   | `/inventory/dispatch-limits`                  | Crear limite                   | `MOCK_INVENTORY_LIMITS`         |
| 12 | PATCH  | `/inventory/dispatch-limits/{id}`             | Actualizar limite              | `MOCK_INVENTORY_LIMITS`         |
| 13 | GET    | `/inventory/dispatch-exceptions`              | Listar excepciones             | `MOCK_INVENTORY_LIMITS`         |
| 14 | POST   | `/inventory/dispatch-exceptions`              | Crear excepcion                | `MOCK_INVENTORY_LIMITS`         |
| 15 | GET    | `/inventory/reports/stock`                    | Reporte de stock               | `MOCK_INVENTORY_REPORTS`        |
| 16 | GET    | `/inventory/reports/consumption?period=YYYY-MM` | Reporte de consumo           | `MOCK_INVENTORY_REPORTS`        |
| 17 | GET    | `/inventory/reports/expiration?threshold_days=N` | Reporte de vencimientos      | `MOCK_INVENTORY_REPORTS`        |
