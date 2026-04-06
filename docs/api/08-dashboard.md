# Módulo: Dashboard BI — Métricas Consolidadas

> **Fuente frontend**: `src/routes/(app)/+page.server.ts`
> **Consumido por**: Página principal del dashboard (`/`)
> **Rol requerido**: `dashboard:read` (analista, doctor, admin)

---

## Contexto

El dashboard consolida data de **todos los módulos** (citas, pacientes, doctores, inventario, historias médicas) en una sola vista gerencial. Actualmente el frontend hace las agregaciones cruzando múltiples endpoints existentes + data mock importada directamente.

**En producción**, el backend debería exponer un endpoint consolidado `/dashboard` que devuelva todas las métricas pre-calculadas, evitando que el frontend haga ~10 llamadas paralelas y agregaciones pesadas en cada carga de página.

---

## Endpoint Principal

### `GET /dashboard`

Devuelve todas las métricas del dashboard en una sola llamada.

**Query params opcionales** (para filtrado por período):

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `fecha` | `string` | Hoy (`YYYY-MM-DD`) | Fecha de referencia |
| `periodo` | `string` | `month` | `today` \| `week` \| `month` \| `quarter` |

**Response:**

```typescript
interface DashboardResponse {
  // ─── Metadata ───
  fecha: string;                    // YYYY-MM-DD
  generado_at: string;              // ISO timestamp

  // ─── 1. KPIs Ejecutivos ───
  kpis: {
    total_citas: number;
    citas_hoy: number;
    citas_pendientes: number;       // pendiente + confirmada
    tasa_atencion: number;          // % (atendidas / total * 100)
    tasa_no_show: number;           // % (no_asistio / total * 100)
    tasa_cancelacion: number;       // % (canceladas / total * 100)
    ocupacion_slots: number;        // % (citas agendadas / slots disponibles * 100)
    total_pacientes: number;
    pacientes_nuevos: number;       // es_nuevo = true
    total_doctores: number;
    valor_inventario: number;       // Σ(batch.quantity_available × batch.unit_cost)
  };

  // ─── 2. Citas por Estado ───
  citas_por_estado: Record<CitaEstado, number>;
  // Ejemplo: { pendiente: 3, confirmada: 2, atendida: 10, cancelada: 1, no_asistio: 2 }

  // ─── 3. Citas por Especialidad ───
  citas_por_especialidad: Array<{
    nombre: string;                 // Nombre de la especialidad
    count: number;                  // Total de citas
  }>;

  // ─── 4. Tendencia Diaria ───
  tendencia_diaria: number[];       // Array de conteos, últimos 7 días con data
  // Para sparkline: [12, 8, 15, 10, 14, 11, 13]

  // ─── 5. Distribución Horaria ───
  distribucion_horaria: Array<{
    hora: string;                   // "08:00", "09:00", etc.
    count: number;
  }>;

  // ─── 6. Heatmap de Horarios Pico ───
  heatmap: number[][];
  // Matriz 5×12: [fila=día Lun-Vie][col=hora 07:00-18:00]
  // Ejemplo: heatmap[0][1] = citas del Lunes a las 08:00

  // ─── 7. Ocupación por Especialidad ───
  ocupacion_por_especialidad: Array<{
    nombre: string;
    slots_disponibles: number;      // Calculado desde disponibilidad de doctores
    citas_agendadas: number;        // Citas en el período
  }>;

  // ─── 8. Ausentismo por Especialidad ───
  ausentismo_por_especialidad: Array<{
    nombre: string;
    total: number;                  // Total citas de esa especialidad
    no_shows: number;               // estado = 'no_asistio'
    tasa: number;                   // % redondeado
  }>;

  // ─── 9. Rendimiento por Doctor ───
  rendimiento_por_doctor: Array<{
    nombre: string;                 // "Dr. Apellido"
    especialidad: string;
    count: number;                  // Total citas
    atendidas: number;              // estado = 'atendida'
  }>;

  // ─── 10. Pacientes por Tipo ───
  pacientes_por_tipo: Record<string, number>;
  // { empleado: 5, estudiante: 12, profesor: 3, tercero: 2 }

  pacientes_por_sexo: Record<string, number>;
  // { M: 10, F: 12 }

  primera_vez_count: number;
  retorno_count: number;

  // ─── 11. Diagnósticos Frecuentes ───
  top_diagnosticos: Array<{
    cie10: string;                  // Código CIE-10
    descripcion: string;            // Texto del diagnóstico
    count: number;                  // Frecuencia
  }>;

  // ─── 12. Inventario ───
  inventario: {
    total_medicamentos: number;
    stock_critico: number;          // stock_alert = 'critical'
    lotes_por_vencer: number;       // Batches expiring en próximos 90 días
    valor_estimado: number;         // Σ(quantity_available × unit_cost)
  };

  // ─── 13. Consumo de Medicamentos ───
  consumo_top: Array<{
    medication_id: string;
    generic_name: string;
    total_dispatched: number;
    patient_count: number;          // Pacientes distintos
  }>;

  // ─── 14. Estado del Stock ───
  stock_items: Array<{
    medication_id: string;
    generic_name: string;
    total_available: number;
    unit_measure: string;
    stock_alert: 'ok' | 'low' | 'critical' | 'expired';
  }>;
}
```

**Códigos de respuesta:**

| Código | Descripción |
|--------|-------------|
| 200 | Métricas generadas correctamente |
| 401 | No autenticado |
| 403 | Sin permiso `dashboard:read` |

---

## Endpoints Individuales (Alternativa)

Si el backend prefiere no implementar un endpoint consolidado, el dashboard puede consumir los endpoints existentes de otros módulos. Estos son los que actualmente usa:

| # | Endpoint Existente | Documentado en | Dato que provee |
|---|-------------------|----------------|-----------------|
| 1 | `GET /appointments/stats` | [03-appointments.md](03-appointments.md) | `CitasStats` (total, byStatus, bySpecialty, byDoctor, peakHours, dailyTrend, etc.) |
| 2 | `GET /appointments?fecha={hoy}` | [03-appointments.md](03-appointments.md) | Conteo de citas hoy |
| 3 | `GET /appointments?page_size=10000` | [03-appointments.md](03-appointments.md) | Todas las citas (para heatmap y ausentismo) |
| 4 | `GET /doctors?active=true` | [04-doctors.md](04-doctors.md) | Lista de doctores activos |
| 5 | `GET /specialties` | [04-doctors.md](04-doctors.md) | Lista de especialidades |
| 6 | `GET /doctors/{id}/availability` | [04-doctors.md](04-doctors.md) | Bloques de disponibilidad (para cálculo de ocupación) |
| 7 | `GET /patients` | [02-patients.md](02-patients.md) | Todos los pacientes (para demografía) |
| 8 | `GET /inventory/reports/stock` | [07-pharmacy.md](07-pharmacy.md) | Reporte de stock |
| 9 | `GET /inventory/reports/expiration?threshold_days=90` | [07-pharmacy.md](07-pharmacy.md) | Lotes por vencer |
| 10 | `GET /inventory/reports/consumption?period={YYYY-MM}` | [07-pharmacy.md](07-pharmacy.md) | Consumo del mes |
| 11 | `GET /medical-records/patient/{id}` | [05-medical-records.md](05-medical-records.md) | Historias médicas (para diagnósticos) |

### Problema con la alternativa

Actualmente el frontend importa data mock directamente para dos cálculos que **no tienen endpoint**:

```typescript
// ❌ Importa mock data directamente — necesita endpoint
import { mockHistorias } from '$lib/server/mock/data.js';
import { mockDisponibilidad } from '$lib/server/mock/data.js';
```

Estos se usan para:

1. **Top diagnósticos**: Necesita `GET /medical-records/diagnostics/top?limit=5` o que `/appointments/stats` incluya campo `topDiagnosticos`
2. **Ocupación por especialidad**: Necesita `GET /doctors/{id}/availability` por cada doctor — ineficiente. Mejor incluirlo en `/dashboard` o crear `GET /availability/summary`

---

## Endpoints Nuevos Recomendados

### `GET /medical-records/diagnostics/top`

Devuelve los diagnósticos más frecuentes.

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `limit` | `number` | `5` | Máximo de resultados |
| `periodo` | `string` | — | Filtro opcional: `YYYY-MM` |

```typescript
// Response
Array<{
  cie10: string;
  descripcion: string;
  count: number;
}>
```

**Mock flag**: `MOCK_HISTORIAS`

---

### `GET /availability/summary`

Resumen de disponibilidad agregada por especialidad (slots semanales).

```typescript
// Response
Array<{
  especialidad_id: string;
  especialidad_nombre: string;
  total_slots_semana: number;      // Todos los doctores de esa especialidad
  total_doctores: number;
  total_horas_semana: number;
}>
```

**Mock flag**: `MOCK_DOCTORES`

---

### `GET /appointments/heatmap`

Heatmap de citas agrupadas por día de la semana × hora del día.

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `fecha_desde` | `string` | Hace 30 días | Inicio del rango |
| `fecha_hasta` | `string` | Hoy | Fin del rango |

```typescript
// Response
{
  heatmap: number[][];
  // Matriz 5×12: [0=Lun..4=Vie][0=07:00..11=18:00]
  // Cada celda = cantidad de citas en ese día×hora
}
```

**Mock flag**: `MOCK_CITAS`

---

### `GET /patients/demographics`

Estadísticas demográficas de pacientes sin devolver data individual.

```typescript
// Response
{
  total: number;
  nuevos: number;                   // es_nuevo = true
  por_tipo: Record<string, number>; // { empleado: 5, estudiante: 12, ... }
  por_sexo: Record<string, number>; // { M: 10, F: 12 }
  primera_vez: number;              // Con al menos 1 cita es_primera_vez
  retorno: number;
}
```

**Mock flag**: `MOCK_PACIENTES`

---

## Recomendación de Implementación

**Opción A (recomendada)**: Implementar `GET /dashboard` como endpoint consolidado que internamente consulta las tablas necesarias y devuelve todo pre-calculado. Ventaja: 1 request, 1 query plan optimizable, cache-friendly.

**Opción B**: Implementar los 4 endpoints nuevos (`diagnostics/top`, `availability/summary`, `heatmap`, `demographics`) y dejar que el frontend haga las ~10 llamadas en paralelo. Ventaja: reutilizable por otras vistas.

**Opción C (híbrida)**: Implementar los endpoints individuales + un `/dashboard` que los llame internamente y cachee el resultado por 5 minutos.

---

## Archivos Frontend Relacionados

| Archivo | Descripción |
|---------|-------------|
| `src/routes/(app)/+page.server.ts` | Server load — agrega data de múltiples servicios |
| `src/routes/(app)/+page.svelte` | Dashboard UI — visualizaciones con StatCard, Sparkline, Progress, Heatmap CSS |
| `src/routes/(app)/analista/horarios/+page.server.ts` | Vista de horarios — usa métricas similares |
