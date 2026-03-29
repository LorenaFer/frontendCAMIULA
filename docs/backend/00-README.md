# Documentación Backend — Sistema de Historia Médica Digital

> **Para:** Equipo de Backend (FastAPI)
> **De:** Equipo de Frontend (SvelteKit)
> **Fecha:** 2026-03-26

---

## Documentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [API-CONTRACTS.md](./01-API-CONTRACTS.md) | Todos los endpoints (método, ruta, body, response) — **empezar por aquí** |
| 02 | [DATA-MODELS.md](./02-DATA-MODELS.md) | Modelos de datos, esquema de tablas, tipos enum, índices recomendados |
| 03 | [FLOW-CITAS-HMD.md](./03-FLOW-CITAS-HMD.md) | Flujo completo agendado → evaluación → historia clínica, con diagramas |
| 04 | [FORM-SCHEMA-SPEC.md](./04-FORM-SCHEMA-SPEC.md) | Sistema de schemas dinámicos, Form Builder, estructura JSON completa |

---

## Resumen de Endpoints (31 total)

| Módulo | Endpoints | Prioridad |
|--------|-----------|-----------|
| Pacientes | 5 | Alta — necesario para agendar |
| Especialidades | 4 | Alta — catálogo base |
| Doctores + Disponibilidad | 9 | Alta — necesario para agendar |
| Citas | 7 | Alta — core del sistema |
| Historias Médicas | 5 | Alta — evaluación médica |
| Schemas (Form Builder) | 4 | Media — los schemas mock funcionan mientras tanto |

---

## Prioridad de Implementación Sugerida

### Fase 1 — Flujo base de agendado (MVP)
1. `GET/POST /api/patients` (buscar + crear)
2. `GET /api/specialties`
3. `GET /api/doctors/options`
4. `GET /api/doctors/{id}/availability`
5. `POST /api/appointments` + `GET /api/appointments/check-slot`
6. `GET /api/appointments?{filtros}` + `GET /api/appointments/{id}`
7. `PATCH /api/appointments/{id}/status`

### Fase 2 — Evaluación médica
8. `GET /api/medical-records?appointment_id={id}`
9. `PUT /api/medical-records` (upsert — usado para save Y autosave)
10. `GET /api/medical-records/patient/{id}` (historial previo)
11. `GET /api/schemas/{specialty}` (servir schemas)

### Fase 3 — Administración
12. `CRUD /api/specialties` (crear, editar, toggle)
13. `PUT/DELETE /api/schemas` (guardar/eliminar schemas desde Form Builder)
14. `GET /api/appointments/stats` (dashboard)

---

## Cómo Probar la Integración

El frontend tiene mock flags que permiten activar cada módulo independientemente:

```env
# .env — poner 'false' cuando el endpoint esté listo
MOCK_PACIENTES=true
MOCK_DOCTORES=true
MOCK_CITAS=true
MOCK_HISTORIAS=true
MOCK_SCHEMAS=true
```

Ejemplo: si Pacientes está listo pero Citas no:
```env
MOCK_PACIENTES=false   # llama al backend real
MOCK_CITAS=true        # sigue usando mock
```

---

## Lo que necesitamos de vuelta

Por favor retornar un documento con:
1. **Confirmación de rutas** — cualquier ajuste en las rutas o métodos HTTP
2. **Cambios en los modelos** — si algún campo cambia de nombre, tipo o se agrega/quita
3. **Formato de errores** — estructura exacta de errores de validación (422)
4. **Autenticación** — mecanismo definido (JWT, session, etc.) y cómo se envía el token
5. **URL base** — confirmar si es `/api` o diferente

Con ese documento, el frontend hará los ajustes finales en los servicios.
