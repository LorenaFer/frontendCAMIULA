# Módulo: Inventario — Medicamentos, Proveedores, Órdenes y Lotes

> Documentación de los endpoints del módulo de inventario.
> Todos los endpoints usan el prefijo base de la API configurada en el servidor.

---

## Formato de respuesta paginada

Todos los listados paginados del módulo de inventario devuelven el siguiente formato genérico:

```typescript
interface InventoryPaginatedResponse<T> {
  data: T[];       // Elementos de la página actual
  total: number;   // Total de registros que cumplen los filtros
  page: number;    // Página actual (base 1)
  pageSize: number; // Tamaño de página solicitado
  hasNext: boolean; // true si existen más páginas después de la actual
}
```

Parámetros de paginación comunes (query string):

| Parámetro   | Tipo   | Default | Descripción             |
|-------------|--------|---------|-------------------------|
| `page`      | number | 1       | Número de página (base 1) |
| `page_size` | number | 25      | Cantidad de elementos por página |

---

## Enums / Tipos de estado

```typescript
type SupplierStatus       = 'active' | 'inactive';
type MedicationStatus     = 'active' | 'discontinued' | 'pending';
type PurchaseOrderStatus  = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
type BatchStatus          = 'available' | 'depleted' | 'expired' | 'quarantine';
type StockAlert           = 'ok' | 'low' | 'critical' | 'expired';
```

---

## 1. Medicamentos

**Mock flag:** `MOCK_INVENTORY_MEDICATIONS`

### Interfaces

```typescript
interface Medication {
  id: string;
  code: string;
  generic_name: string;
  commercial_name?: string;
  pharmaceutical_form: string;
  concentration?: string;
  unit_measure: string;
  therapeutic_class?: string;
  controlled_substance: boolean;
  requires_refrigeration: boolean;
  medication_status: MedicationStatus;
  /** Calculado en query — stock total disponible */
  current_stock: number;
  created_at: string;
}

interface MedicationOption {
  id: string;
  code: string;
  generic_name: string;
  pharmaceutical_form: string;
  concentration?: string;
  unit_measure: string;
  current_stock: number;
}

interface CreateMedicationInput {
  code: string;
  generic_name: string;
  commercial_name?: string;
  pharmaceutical_form: string;
  concentration?: string;
  unit_measure: string;
  therapeutic_class?: string;
  controlled_substance: boolean;
  requires_refrigeration: boolean;
}

interface MedicationFilters {
  search?: string;
  status?: MedicationStatus;
  therapeutic_class?: string;
  page?: number;
  pageSize?: number;
}
```

### Endpoints

#### 1.1 Listar medicamentos

```
GET /inventory/medications
```

**Query parameters:**

| Parámetro          | Tipo             | Requerido | Descripción                                    |
|--------------------|------------------|-----------|------------------------------------------------|
| `q`                | string           | No        | Búsqueda por nombre genérico, código o nombre comercial |
| `status`           | MedicationStatus | No        | Filtrar por estado del medicamento             |
| `therapeutic_class`| string           | No        | Filtrar por clase terapéutica                  |
| `page`             | number           | No        | Página (default: 1)                            |
| `page_size`        | number           | No        | Tamaño de página (default: 25)                 |

**Respuesta:** `InventoryPaginatedResponse<Medication>`

---

#### 1.2 Obtener medicamento por ID

```
GET /inventory/medications/{id}
```

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción           |
|-----------|--------|-----------------------|
| `id`      | string | ID del medicamento    |

**Respuesta:** `Medication`

**Errores:**
- `404` — Medicamento no encontrado

---

#### 1.3 Opciones de medicamentos (select/combo)

```
GET /inventory/medications/options
```

Devuelve una lista ligera de medicamentos para usar en selectores y combos del frontend. No requiere parámetros.

**Respuesta:** `MedicationOption[]`

---

#### 1.4 Crear medicamento

```
POST /inventory/medications
```

**Body:** `CreateMedicationInput` (JSON)

```json
{
  "code": "MED-001",
  "generic_name": "Acetaminofén",
  "commercial_name": "Atamel",
  "pharmaceutical_form": "Tableta",
  "concentration": "500mg",
  "unit_measure": "tableta",
  "therapeutic_class": "Analgésico",
  "controlled_substance": false,
  "requires_refrigeration": false
}
```

**Respuesta:** `Medication` (el recurso creado con `id`, `medication_status: 'active'`, `current_stock: 0`, `created_at`)

**Errores:**
- `409` — Ya existe un medicamento con ese código

---

#### 1.5 Actualizar medicamento

```
PATCH /inventory/medications/{id}
```

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción           |
|-----------|--------|-----------------------|
| `id`      | string | ID del medicamento    |

**Body:** `Partial<CreateMedicationInput>` (JSON) — Solo los campos que se desean modificar.

**Respuesta:** `Medication` (el recurso actualizado)

**Errores:**
- `404` — Medicamento no encontrado

---

## 2. Proveedores

**Mock flag:** `MOCK_INVENTORY_SUPPLIERS`

### Interfaces

```typescript
interface Supplier {
  id: string;
  name: string;
  rif: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  payment_terms?: string;
  supplier_status: SupplierStatus;
  created_at: string;
}

interface SupplierOption {
  id: string;
  name: string;
  rif: string;
}

interface CreateSupplierInput {
  name: string;
  rif: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  payment_terms?: string;
}
```

### Endpoints

#### 2.1 Listar proveedores

```
GET /inventory/suppliers
```

**Query parameters:**

| Parámetro   | Tipo   | Requerido | Descripción                     |
|-------------|--------|-----------|---------------------------------|
| `page`      | number | No        | Página (default: 1)             |
| `page_size` | number | No        | Tamaño de página (default: 25)  |

**Respuesta:** `InventoryPaginatedResponse<Supplier>`

---

#### 2.2 Obtener proveedor por ID

```
GET /inventory/suppliers/{id}
```

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción        |
|-----------|--------|--------------------|
| `id`      | string | ID del proveedor   |

**Respuesta:** `Supplier`

**Errores:**
- `404` — Proveedor no encontrado

---

#### 2.3 Opciones de proveedores (select/combo)

```
GET /inventory/suppliers/options
```

Devuelve solo proveedores con estado `active`. Lista ligera para selectores del frontend.

**Respuesta:** `SupplierOption[]`

---

#### 2.4 Crear proveedor

```
POST /inventory/suppliers
```

**Body:** `CreateSupplierInput` (JSON)

```json
{
  "name": "Distribuidora Farmacéutica CA",
  "rif": "J-12345678-9",
  "phone": "+58 212 1234567",
  "email": "ventas@distfarm.com",
  "contact_name": "Juan Pérez",
  "payment_terms": "30 días"
}
```

**Respuesta:** `Supplier` (el recurso creado con `id`, `supplier_status: 'active'`, `created_at`)

**Errores:**
- `409` — Ya existe un proveedor con ese RIF

---

#### 2.5 Actualizar proveedor

```
PATCH /inventory/suppliers/{id}
```

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción        |
|-----------|--------|--------------------|
| `id`      | string | ID del proveedor   |

**Body:** `Partial<CreateSupplierInput>` (JSON) — Solo los campos que se desean modificar.

**Respuesta:** `Supplier` (el recurso actualizado)

**Errores:**
- `404` — Proveedor no encontrado

---

## 3. Órdenes de Compra

**Mock flag:** `MOCK_INVENTORY_PURCHASE_ORDERS`

### Interfaces

```typescript
interface PurchaseOrderItem {
  id: string;
  medication_id: string;
  medication: MedicationOption;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  fk_supplier_id: string;
  supplier: SupplierOption;
  order_date: string;
  expected_date?: string;
  notes?: string;
  order_status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  /** Calculado: suma de (quantity_ordered * unit_cost) de cada ítem */
  total_amount: number;
  created_at: string;
  created_by?: string;
  sent_at?: string;
  sent_by?: string;
  received_at?: string;
  received_by?: string;
}

interface CreatePurchaseOrderInput {
  fk_supplier_id: string;
  expected_date?: string;
  notes?: string;
  items: Array<{
    medication_id: string;
    quantity_ordered: number;
    unit_cost: number;
  }>;
}

interface ReceivePurchaseOrderInput {
  order_id: string;
  items: Array<{
    purchase_order_item_id: string;
    quantity_received: number;
    lot_number: string;
    expiration_date: string;
    unit_cost?: number;
  }>;
}
```

### Endpoints

#### 3.1 Listar órdenes de compra

```
GET /inventory/purchase-orders
```

**Query parameters:**

| Parámetro   | Tipo   | Requerido | Descripción                     |
|-------------|--------|-----------|---------------------------------|
| `page`      | number | No        | Página (default: 1)             |
| `page_size` | number | No        | Tamaño de página (default: 25)  |

**Respuesta:** `InventoryPaginatedResponse<PurchaseOrder>`

---

#### 3.2 Obtener orden de compra por ID

```
GET /inventory/purchase-orders/{id}
```

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción              |
|-----------|--------|--------------------------|
| `id`      | string | ID de la orden de compra |

**Respuesta:** `PurchaseOrder`

**Errores:**
- `404` — Orden de compra no encontrada

---

#### 3.3 Crear orden de compra

```
POST /inventory/purchase-orders
```

**Body:** `CreatePurchaseOrderInput` (JSON)

```json
{
  "fk_supplier_id": "sup-abc123",
  "expected_date": "2026-04-15",
  "notes": "Pedido urgente para reposición de analgésicos",
  "items": [
    {
      "medication_id": "med-001",
      "quantity_ordered": 500,
      "unit_cost": 2.50
    },
    {
      "medication_id": "med-002",
      "quantity_ordered": 200,
      "unit_cost": 5.00
    }
  ]
}
```

**Respuesta:** `PurchaseOrder` (el recurso creado con `order_status: 'draft'`, `order_number` generado, `items` con relaciones resueltas)

**Nota:** La orden se crea en estado `draft`. Debe enviarse explícitamente con el endpoint 3.4.

---

#### 3.4 Enviar orden de compra

```
POST /inventory/purchase-orders/{id}/send
```

Transiciona la orden del estado `draft` a `sent`. No requiere body.

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción              |
|-----------|--------|--------------------------|
| `id`      | string | ID de la orden de compra |

**Respuesta:** `PurchaseOrder` (con `order_status: 'sent'`, `sent_at` y `sent_by` actualizados)

**Errores:**
- `404` — Orden de compra no encontrada
- `400` — Solo se pueden enviar órdenes en estado `draft`

---

#### 3.5 Recibir orden de compra

```
POST /inventory/purchase-orders/{id}/receive
```

Registra la recepción de mercancía para una orden. Crea lotes automáticamente en el sistema para cada ítem recibido.

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción              |
|-----------|--------|--------------------------|
| `id`      | string | ID de la orden de compra (debe coincidir con `order_id` del body) |

**Body:** `ReceivePurchaseOrderInput` (JSON)

```json
{
  "order_id": "po-abc123",
  "items": [
    {
      "purchase_order_item_id": "poi-001",
      "quantity_received": 480,
      "lot_number": "LOT-2026-0401",
      "expiration_date": "2028-04-01",
      "unit_cost": 2.50
    },
    {
      "purchase_order_item_id": "poi-002",
      "quantity_received": 200,
      "lot_number": "LOT-2026-0402",
      "expiration_date": "2027-12-01"
    }
  ]
}
```

**Respuesta:** `PurchaseOrder` (con `order_status: 'received'` o `'partial'`, `received_at` y `received_by` actualizados)

**Errores:**
- `404` — Orden de compra no encontrada

**Efectos secundarios:**
- Se crean registros `Batch` por cada ítem recibido.
- Se actualiza el `current_stock` de cada medicamento asociado.

---

## 4. Lotes (Batches)

**Mock flag:** `MOCK_INVENTORY_BATCHES`

### Interfaces

```typescript
interface Batch {
  id: string;
  fk_medication_id: string;
  medication: MedicationOption;
  fk_supplier_id?: string;
  supplier_name?: string;
  lot_number: string;
  expiration_date: string;
  quantity_received: number;
  quantity_available: number;
  unit_cost?: number;
  batch_status: BatchStatus;
  received_at: string;
}

interface StockItem {
  medication_id: string;
  code: string;
  generic_name: string;
  pharmaceutical_form: string;
  unit_measure: string;
  total_available: number;
  batch_count: number;
  /** ISO date del lote que vence antes */
  nearest_expiration?: string;
  days_to_expiration?: number;
  stock_alert: StockAlert;
}

interface BatchFilters {
  medication_id?: string;
  status?: BatchStatus;
  /** ISO date — lotes que vencen antes de esta fecha */
  expiring_before?: string;
  page?: number;
  pageSize?: number;
}
```

### Endpoints

#### 4.1 Listar lotes

```
GET /inventory/batches
```

**Query parameters:**

| Parámetro        | Tipo        | Requerido | Descripción                                      |
|------------------|-------------|-----------|--------------------------------------------------|
| `medication_id`  | string      | No        | Filtrar lotes de un medicamento específico        |
| `status`         | BatchStatus | No        | Filtrar por estado del lote                       |
| `expiring_before`| string (ISO)| No        | Lotes que vencen antes de esta fecha              |
| `page`           | number      | No        | Página (default: 1)                               |
| `page_size`      | number      | No        | Tamaño de página (default: 25)                    |

**Respuesta:** `InventoryPaginatedResponse<Batch>`

---

#### 4.2 Obtener lote por ID

```
GET /inventory/batches/{id}
```

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción    |
|-----------|--------|----------------|
| `id`      | string | ID del lote    |

**Respuesta:** `Batch`

**Errores:**
- `404` — Lote no encontrado

---

#### 4.3 Reporte de stock consolidado

```
GET /inventory/reports/stock
```

Devuelve una vista consolidada del stock por medicamento, incluyendo alertas de nivel. No requiere parámetros. No es paginado.

**Respuesta:** `StockItem[]`

Cada `StockItem` incluye:
- `total_available` — Suma de `quantity_available` de todos los lotes activos del medicamento.
- `batch_count` — Cantidad de lotes activos.
- `nearest_expiration` — Fecha ISO del lote con vencimiento más cercano.
- `days_to_expiration` — Días restantes hasta `nearest_expiration`.
- `stock_alert` — Nivel de alerta: `'ok'`, `'low'`, `'critical'` o `'expired'`.

---

## Resumen de mock flags

Cada sección del módulo puede funcionar con datos mock (sin backend) activando la variable de entorno correspondiente:

| Variable de entorno              | Sección afectada   |
|----------------------------------|--------------------|
| `MOCK_INVENTORY_MEDICATIONS`     | Medicamentos       |
| `MOCK_INVENTORY_SUPPLIERS`       | Proveedores        |
| `MOCK_INVENTORY_PURCHASE_ORDERS` | Órdenes de Compra  |
| `MOCK_INVENTORY_BATCHES`         | Lotes y Stock      |

Cuando el mock flag está activo (`true`), el servicio devuelve datos ficticios desde memoria sin realizar llamadas HTTP al backend. Esto permite desarrollo frontend independiente.

---

## Notas de implementación

- Todos los campos `created_at`, `received_at`, `sent_at` y fechas similares se manejan como strings en formato **ISO 8601** (e.g., `"2026-04-02T14:30:00.000Z"`).
- Los campos `expiration_date` y `expected_date` usan formato **ISO date** (e.g., `"2026-04-15"`).
- `MedicationOption` y `SupplierOption` son versiones ligeras de sus entidades completas, diseñadas para selectores y relaciones embebidas.
- El campo `total_amount` en `PurchaseOrder` se calcula en el frontend como la suma de `quantity_ordered * unit_cost` de cada ítem.
- La recepción de una orden (`POST .../receive`) genera automáticamente lotes (`Batch`) y actualiza el stock.
