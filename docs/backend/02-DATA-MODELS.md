# Modelos de Datos — Referencia para Backend

> **Propósito:** Definición completa de todas las entidades del sistema para mapear a modelos SQLAlchemy/Pydantic.

---

## Entidades Principales

### Paciente
```
Tabla: patients
─────────────────────────────────────────────
id                    UUID PK (auto-generated)
nhm                   INTEGER UNIQUE NOT NULL (auto-increment, Número de Historia Médica)
cedula                VARCHAR(20) UNIQUE NOT NULL
nombre                VARCHAR(100) NOT NULL
apellido              VARCHAR(100) NOT NULL
sexo                  ENUM('M', 'F') NULL
fecha_nacimiento      DATE NULL
lugar_nacimiento      VARCHAR(100) NULL
edad                  INTEGER NULL (calculado o manual)
estado_civil          ENUM('soltero','casado','divorciado','viudo','union_libre') NULL
religion              VARCHAR(50) NULL
procedencia           VARCHAR(100) NULL
direccion_habitacion  TEXT NULL
telefono              VARCHAR(20) NULL
profesion             VARCHAR(100) NULL
ocupacion_actual      VARCHAR(100) NULL
direccion_trabajo     TEXT NULL
clasificacion_economica VARCHAR(10) NULL
relacion_univ         ENUM('empleado','estudiante','profesor','tercero') NOT NULL
parentesco            ENUM('hijo','padre','madre','conyuge','otro') NULL
titular_nhm           INTEGER NULL (FK → patients.nhm, para familiares)
datos_medicos         JSONB NOT NULL DEFAULT '{}'
contacto_emergencia   JSONB NULL
es_nuevo              BOOLEAN DEFAULT true
created_at            TIMESTAMP DEFAULT NOW()
```

**datos_medicos** (JSONB):
```json
{
  "tipo_sangre": "O+",
  "alergias": ["Penicilina", "Sulfas"],
  "numero_contacto": "0412-1234567",
  "condiciones": ["Hipertensión", "Diabetes"]
}
```

**contacto_emergencia** (JSONB):
```json
{
  "nombre": "María González",
  "parentesco": "Esposa",
  "direccion": "Av. Principal",
  "telefono": "0414-1112233"
}
```

---

### Especialidad
```
Tabla: specialties
─────────────────────────────────────────────
id          UUID PK
nombre      VARCHAR(100) UNIQUE NOT NULL
activo      BOOLEAN DEFAULT true
created_at  TIMESTAMP DEFAULT NOW()
```

---

### Doctor
```
Tabla: doctors
─────────────────────────────────────────────
id               UUID PK
nombre           VARCHAR(100) NOT NULL
apellido         VARCHAR(100) NOT NULL
especialidad_id  UUID FK → specialties.id
activo           BOOLEAN DEFAULT true
created_at       TIMESTAMP DEFAULT NOW()
```

**Relaciones:**
- `doctor.especialidad` → JOIN con `specialties`

---

### Disponibilidad Doctor
```
Tabla: doctor_availability
─────────────────────────────────────────────
id             UUID PK
doctor_id      UUID FK → doctors.id NOT NULL
day_of_week    SMALLINT NOT NULL CHECK(1-5)  -- 1=Lunes, 5=Viernes
hora_inicio    TIME NOT NULL
hora_fin       TIME NOT NULL
duracion_slot  INTEGER DEFAULT 30  -- minutos
```

**Constraint:** No overlapping blocks para el mismo doctor y día.

---

### Cita (Appointment)
```
Tabla: appointments
─────────────────────────────────────────────
id               UUID PK
paciente_id      UUID FK → patients.id NOT NULL
doctor_id        UUID FK → doctors.id NOT NULL
especialidad_id  UUID FK → specialties.id NOT NULL
fecha            DATE NOT NULL
hora_inicio      TIME NOT NULL
hora_fin         TIME NOT NULL
duracion_min     SMALLINT NOT NULL CHECK(30 OR 60)
es_primera_vez   BOOLEAN DEFAULT false
estado           ENUM('pendiente','confirmada','atendida','cancelada','no_asistio') DEFAULT 'pendiente'
motivo_consulta  TEXT NULL
observaciones    TEXT NULL
notas_admin      TEXT NULL
created_at       TIMESTAMP DEFAULT NOW()
created_by       VARCHAR(50) NOT NULL  -- 'portal_publico', 'analista_01', 'doctor_emergencia'
```

**Constraint:** UNIQUE(doctor_id, fecha, hora_inicio) — un doctor no puede tener dos citas en el mismo slot.

**Relaciones para `CitaConPaciente`:**
- `cita.paciente` → JOIN con `patients` (todos los campos)
- `cita.doctor` → JOIN con `doctors` + `specialties`

---

### Historia Médica (Medical Record)
```
Tabla: medical_records
─────────────────────────────────────────────
id              UUID PK
cita_id         UUID FK → appointments.id UNIQUE NOT NULL
paciente_id     UUID FK → patients.id NOT NULL
doctor_id       UUID FK → doctors.id NOT NULL
schema_id       VARCHAR(100) NULL  -- ej: "medicina-general-v1"
schema_version  VARCHAR(20) NULL   -- ej: "1.0"
evaluacion      JSONB NOT NULL DEFAULT '{}'
preparado       BOOLEAN DEFAULT false
preparado_at    TIMESTAMP NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()  -- actualizar en cada PUT
```

**Constraint:** UNIQUE(cita_id) — una cita tiene exactamente una historia médica.

**evaluacion** (JSONB) — Estructura flexible por especialidad:
```json
{
  // Campos del schema de la especialidad (dinámicos)
  "motivo_consulta": "...",
  "anamnesis": "...",
  "examen_fisico": { "ta": "120/80", "fc": "72", ... },
  "diagnostico": { "cie10": "R51", "descripcion": "Cefalea" },
  "tratamiento": "...",
  "indicaciones": "...",

  // Secciones universales (siempre presentes, independientes del schema)
  "observaciones": "Notas libres del doctor...",
  "receta": {
    "medicamentos": [
      {
        "id": "rx-1a2b3c",
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

  // Widgets especializados (solo si el schema los incluye)
  "examen_dental": {
    "12": { "estado": "cariado", "descripcion": "Caries oclusal", "soporte": "RX Periapical" },
    "24": { "estado": "obturado", "descripcion": "Amalgama en buen estado" }
  },
  "diagrama_corporal": [
    { "id": "bm-1", "x": 45, "y": 30, "view": "front", "descripcion": "Lesión eritematosa 2cm" }
  ]
}
```

---

### Schema de Formulario
```
Tabla: form_schemas
─────────────────────────────────────────────
id              VARCHAR(100) PK  -- ej: "medicina-general-v1"
version         VARCHAR(20) NOT NULL
specialty_id    VARCHAR(100) NOT NULL  -- key normalizado: "medicina-general"
specialty_name  VARCHAR(100) NOT NULL  -- nombre legible: "Medicina General"
schema_json     JSONB NOT NULL  -- estructura completa del schema
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

**schema_json** contiene la estructura completa `MedicalFormSchema` (ver documento 04).

---

## Tipos Enum para Referencia

```python
# Python enums para FastAPI/Pydantic

class Sexo(str, Enum):
    M = "M"
    F = "F"

class EstadoCivil(str, Enum):
    soltero = "soltero"
    casado = "casado"
    divorciado = "divorciado"
    viudo = "viudo"
    union_libre = "union_libre"

class RelacionUniversidad(str, Enum):
    empleado = "empleado"
    estudiante = "estudiante"
    profesor = "profesor"
    tercero = "tercero"

class Parentesco(str, Enum):
    hijo = "hijo"
    padre = "padre"
    madre = "madre"
    conyuge = "conyuge"
    otro = "otro"

class CitaEstado(str, Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    atendida = "atendida"
    cancelada = "cancelada"
    no_asistio = "no_asistio"

class ToothEstado(str, Enum):
    normal = "normal"
    cariado = "cariado"
    obturado = "obturado"
    ext_indicada = "ext_indicada"
    extraido = "extraido"
    protesis = "protesis"

class PresentacionMedicamento(str, Enum):
    tabletas = "tabletas"
    capsulas = "capsulas"
    jarabe = "jarabe"
    ampolla = "ampolla"
    crema = "crema"
    gotas = "gotas"
    inyectable = "inyectable"
    supositorio = "supositorio"
    suspension = "suspension"
    polvo = "polvo"
    solucion = "solucion"
    parche = "parche"
    inhalador = "inhalador"
    otro = "otro"

class ViaAdministracion(str, Enum):
    oral = "oral"
    iv = "iv"
    im = "im"
    sc = "sc"
    sublingual = "sublingual"
    topica = "topica"
    inhalatoria = "inhalatoria"
    rectal = "rectal"
    oftalmica = "oftalmica"
    otica = "otica"
    nasal = "nasal"
    otro = "otro"
```

---

## Índices Recomendados

```sql
-- Búsqueda de pacientes
CREATE INDEX idx_patients_cedula ON patients(cedula);
CREATE INDEX idx_patients_nhm ON patients(nhm);

-- Citas por doctor y fecha (consulta más frecuente)
CREATE INDEX idx_appointments_doctor_fecha ON appointments(doctor_id, fecha);
CREATE INDEX idx_appointments_fecha ON appointments(fecha);
CREATE INDEX idx_appointments_paciente ON appointments(paciente_id);
CREATE INDEX idx_appointments_estado ON appointments(estado);

-- Historias médicas
CREATE UNIQUE INDEX idx_medical_records_cita ON medical_records(cita_id);
CREATE INDEX idx_medical_records_paciente ON medical_records(paciente_id);

-- Disponibilidad
CREATE INDEX idx_availability_doctor_dow ON doctor_availability(doctor_id, day_of_week);

-- Schemas
CREATE INDEX idx_schemas_specialty ON form_schemas(specialty_id);
```
