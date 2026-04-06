# Domain Layer — Screaming Architecture

Este directorio organiza el código por **dominio de negocio**, no por tipo técnico.
Un nuevo integrante puede entender qué hace la aplicación solo mirando esta estructura:

```
domain/
├── patients/           → Gestión de pacientes (datos demográficos, médicos, contacto)
├── appointments/       → Citas médicas (agendamiento, slots, estados, filtros)
├── staff/              → Médicos y especialidades (disponibilidad, turnos)
├── medical-records/    → Historias médicas (evaluaciones, formularios dinámicos, recetas)
└── inventory/          → Farmacia (medicamentos, lotes, proveedores, despachos)
```

## Estructura de un dominio

```
domain/<nombre>/
├── types.ts              Contrato de tipos compartido entre server y UI
├── components/           Componentes Svelte específicos de este dominio
└── [otros archivos]      Schemas, constantes, helpers del dominio
```

La lógica de negocio (services, mappers) vive en `src/lib/server/<nombre>/`.

## Reglas

1. **Un dominio NO importa internals de otro.** Usa los tipos exportados desde `types.ts`.
2. **Componentes genéricos** (Button, Card, Dialog) viven en `$shared/components/`, NO aquí.
3. **Tipos nuevos** van en el `types.ts` del dominio correspondiente.
4. **Para crear un nuevo dominio**, ejecuta: `node scripts/new-feature.js <nombre>`

## Relación con las rutas

Las rutas en `src/routes/` son la capa de orquestación (use cases). Cada `+page.server.ts`
llama a servicios de `$lib/server/<dominio>/` y pasa datos al `+page.svelte` que usa
componentes de `$domain/<dominio>/components/`.

```
Route (+page.server.ts)  →  Service ($lib/server/<domain>/)  →  API Backend
      ↓                           ↓
Page (+page.svelte)       Types ($domain/<domain>/types.ts)
      ↓
Components ($domain/<domain>/components/ + $shared/components/)
```
