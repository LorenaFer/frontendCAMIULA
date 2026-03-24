# Sistema de Tipos

## Ubicacion

Todos los tipos compartidos viven en `src/lib/shared/types/`:

```
src/lib/shared/types/
├── index.ts              # Re-exporta todos los tipos
├── auth.ts               # Roles y usuario autenticado
├── appointments.ts       # Modelo de dominio (citas, pacientes, doctores)
└── navigation.ts         # Navegacion y UI
```

Los tipos son **compartidos**: tanto el servidor (`+page.server.ts`, servicios) como el cliente (componentes) los importan.

---

## Tipos de Autenticacion

```typescript
// src/lib/shared/types/auth.ts

export type UserRole = 'paciente' | 'analista' | 'doctor' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  doctorId?: number;  // Solo para doctores y admins con contexto de doctor
}
```

---

## Tipos del Dominio (Citas)

### Pacientes

```typescript
// Relacion con la universidad
type RelacionUniversidad = 'empleado' | 'estudiante' | 'profesor' | 'tercero';
type Parentesco = 'hijo' | 'padre' | 'madre' | 'conyuge' | 'otro';
type Sexo = 'M' | 'F';
type EstadoCivil = 'soltero' | 'casado' | 'divorciado' | 'viudo';

// Paciente completo (server-side, datos sensibles)
interface Paciente {
  id: number;
  nhm: number;                          // Numero de Historia Medica
  cedula: string;                       // Documento de identidad
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;            // YYYY-MM-DD
  sexo?: Sexo;
  estado_civil?: EstadoCivil;
  relacion_univ: RelacionUniversidad;
  parentesco?: Parentesco;              // Si es "tercero"
  titular_cedula?: string;              // Cedula del titular (si es familiar)
  datos_medicos?: DatosMedicos;
  contacto_emergencia?: ContactoEmergencia;
}

// Paciente publico (client-side, datos reducidos por privacidad)
interface PacientePublic {
  id: number;
  nhm: number;
  nombre: string;
  apellido: string;
  relacion_univ: RelacionUniversidad;
  es_nuevo: boolean;
}
```

### Doctores

```typescript
interface Doctor {
  id: number;
  nombre: string;
  apellido: string;
  especialidadId: number;
}

// Doctor con nombre de especialidad resuelto
interface DoctorConEspecialidad extends Doctor {
  especialidad: string;
}

// Doctor para selectores (incluye dias de trabajo)
interface DoctorOption {
  id: number;
  nombre: string;
  apellido: string;
  especialidadId: number;
  especialidad: string;
  diasTrabajo: number[];  // 0=Dom, 1=Lun, ..., 6=Sab
}

// Disponibilidad horaria del doctor
interface DisponibilidadDoctor {
  id: number;
  doctor_id: number;
  dia_semana: number;       // 0-6
  hora_inicio: string;      // "08:00"
  hora_fin: string;         // "12:00"
}
```

### Especialidades

```typescript
interface Especialidad {
  id: number;
  nombre: string;
  departamento?: string;
}
```

### Citas

```typescript
type CitaEstado = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';

interface Cita {
  id: number;
  paciente_id: number;
  doctor_id: number;
  especialidad_id: number;
  fecha: string;            // 'YYYY-MM-DD'
  hora_inicio: string;      // 'HH:MM'
  hora_fin: string;         // 'HH:MM'
  estado: CitaEstado;
  motivo?: string;
  es_emergencia?: boolean;
  created_at?: string;
}

// Cita con datos de paciente y doctor resueltos
interface CitaConPaciente extends Cita {
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_cedula: string;
  doctor_nombre: string;
  especialidad_nombre: string;
}
```

### Time Slots

```typescript
interface TimeSlot {
  hora_inicio: string;      // "08:00"
  hora_fin: string;         // "08:30"
  disponible: boolean;      // true si esta libre
}
```

### Historial Medico

```typescript
interface HistoriaMedica {
  paciente_id: number;
  evaluaciones: Evaluacion[];
}

interface Evaluacion {
  id: number;
  cita_id: number;
  doctor_id: number;
  fecha: string;
  motivo_consulta: string;
  examen_fisico?: ExamenFisico;
  diagnosticos: Diagnostico[];
  indicaciones?: string;
}

interface ExamenFisico {
  peso?: number;
  talla?: number;
  presion_arterial?: string;
  frecuencia_cardiaca?: number;
  temperatura?: number;
  observaciones?: string;
}

interface Diagnostico {
  codigo_cie10?: string;
  descripcion: string;
  tipo: 'presuntivo' | 'definitivo';
}
```

### Datos Medicos y Contacto

```typescript
interface DatosMedicos {
  tipo_sangre?: string;
  alergias?: string[];
  enfermedades_cronicas?: string[];
  medicamentos_actuales?: string[];
}

interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  parentesco: string;
}
```

### Filtros y Paginacion

```typescript
interface AppointmentFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: CitaEstado;
  doctor_id?: number;
  especialidad_id?: number;
  search?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Resultados de operaciones
interface BuscarPacienteResult {
  encontrado: boolean;
  paciente?: PacientePublic;
}

interface ObtenerSlotsResult {
  slots: TimeSlot[];
  fecha: string;
  doctor_id: number;
}

interface ConfirmarCitaResult {
  cita_id: number;
  codigo_confirmacion: string;
}
```

---

## Tipos de Navegacion

```typescript
// src/lib/shared/types/navigation.ts
import type { Snippet } from 'svelte';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: Snippet;              // Snippet de Svelte 5 para renderizar icono
  permission?: string;        // Permiso RBAC requerido
  badge?: number;             // Contador de notificaciones
  group?: string;             // Nombre del grupo/seccion en sidebar
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatar?: string;
}

export interface Hospital {
  id: string;
  name: string;
  logo?: string;
}

export interface NavigationConfig {
  items: NavItem[];
  user: UserProfile;
  hospitals: Hospital[];
}
```

---

## Tipos Globales

```typescript
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user?: import('$shared/types').AuthUser | null;
    }
  }
}
```

Esto hace que `event.locals.user` este tipado en todos los archivos del servidor.

---

## Convenciones

### Nombrar Tipos

| Convencion | Ejemplo |
|---|---|
| Interface para entidades | `interface Paciente { ... }` |
| Type para unions | `type CitaEstado = 'pendiente' \| 'confirmada' \| ...` |
| Sufijo `Public` para datos reducidos | `PacientePublic` (sin datos sensibles) |
| Sufijo `Con*` para joins | `CitaConPaciente`, `DoctorConEspecialidad` |
| Sufijo `Option` para selectores | `DoctorOption` (datos para dropdown) |
| Prefijo `Create*` para inputs | `CreatePacienteInput` |
| Sufijo `Result` para respuestas | `BuscarPacienteResult` |
| Sufijo `Filters` para filtros | `AppointmentFilters` |

### Agregar Nuevos Tipos

1. Crear o editar archivo en `src/lib/shared/types/`
2. Re-exportar desde `src/lib/shared/types/index.ts`:
   ```typescript
   export type { MiNuevoTipo, OtroTipo } from './mi-modulo';
   ```
3. Importar con alias `$shared`:
   ```typescript
   import type { MiNuevoTipo } from '$shared/types';
   ```

### Tipos vs Interfaces

| Usar | Cuando |
|---|---|
| `interface` | Objetos/entidades que representan datos (pueden extenderse) |
| `type` | Unions, aliases, tipos computados |

```typescript
// Interface para entidad (extensible)
interface Paciente {
  id: number;
  nombre: string;
}

// Type para union (no extensible)
type CitaEstado = 'pendiente' | 'confirmada' | 'atendida';

// Type para alias
type PacienteId = number;
```
