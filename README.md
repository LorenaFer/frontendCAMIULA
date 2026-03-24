# Sistema de Gestion Hospitalaria - Frontend

Sistema de citas y gestion hospitalaria multi-tenant construido con **SvelteKit 2.50**, **Svelte 5**, **Tailwind CSS 4** y **TypeScript**.

## Stack Tecnologico

| Tecnologia | Version | Proposito |
|---|---|---|
| SvelteKit | 2.50 | Framework fullstack (SSR + routing + server) |
| Svelte | 5.49+ | UI reactivo con runes |
| Tailwind CSS | 4.1.18 | Utilidades CSS con `@theme` block |
| Vite | 7.3.1 | Bundler + dev server |
| TypeScript | 5.9 | Tipado estatico |
| Node Adapter | 5.5 | Despliegue SSR (Vercel compatible) |

## Inicio Rapido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Verificar tipos
npm run check

# Build de produccion
npm run build

# Preview del build
npm run preview
```

### Variables de Entorno

Crear archivo `.env` en la raiz:

```env
API_URL=http://localhost:8000
MOCK_PACIENTES=true
MOCK_DOCTORES=true
MOCK_CITAS=true
MOCK_HISTORIAS=true
```

> Cada flag `MOCK_*` controla si un modulo usa datos mock o el backend FastAPI real. Cambiar a `false` cuando el endpoint este listo.

---

## Documentacion

Toda la documentacion del proyecto esta en la carpeta [`docs/`](docs/). Lean estos documentos **antes de empezar a trabajar** en el frontend.

### Arquitectura y Estructura

| Documento | Descripcion |
|---|---|
| [Arquitectura del Proyecto](docs/01-architecture.md) | Estructura de directorios, principios, alias de paths, separacion server/shared |
| [Rutas y Multi-Tenancy](docs/02-routing.md) | Sistema de rutas, layouts anidados, load functions, server actions, endpoints REST |
| [Autenticacion y RBAC](docs/03-auth-rbac.md) | Roles, permisos, middleware, guards en server y client |

### Desarrollo con Svelte 5

| Documento | Descripcion |
|---|---|
| [Patrones de Svelte 5](docs/04-svelte5-patterns.md) | Guia completa de runes, snippets, stores con clases, Context API |
| [Sistema de Componentes](docs/05-component-system.md) | Catalogo de componentes, patron estandar, reglas de composicion, Portal |

### Diseno y Estilos

| Documento | Descripcion |
|---|---|
| [Design System](docs/06-design-system.md) | Colores, sombras, tipografia, movimiento, glassmorphism, animaciones |
| [Dark Mode](docs/07-dark-mode.md) | Implementacion, tokens semanticos, prevencion FOUC, compatibilidad Safari |

### Integracion y Contribucion

| Documento | Descripcion |
|---|---|
| [Integracion con Backend](docs/08-backend-integration.md) | Cliente HTTP, service layer, sistema mock/live, flujo de datos |
| [Sistema de Tipos](docs/09-type-system.md) | Tipos del dominio, contratos server/client, como agregar nuevos tipos |
| [Guia de Contribucion](docs/10-contributing.md) | Convenciones, reglas, gotchas, flujo para agregar features |

---

## Estructura del Proyecto (Resumen)

```
src/
├── app.html                  # HTML base (script anti-FOUC)
├── app.css                   # UNICO archivo de design tokens
├── hooks.server.ts           # Middleware auth + RBAC
│
├── routes/                   # Rutas SvelteKit
│   ├── login/                # Autenticacion
│   ├── hospitals/            # Seleccion de hospital
│   └── [tenantId]/           # Rutas multi-tenant
│       ├── agendar/          # Wizard de citas
│       ├── mis-citas/        # Citas del paciente
│       ├── analista/citas/   # Gestion (analista)
│       ├── doctor/citas/     # Citas (doctor)
│       └── ...
│
└── lib/
    ├── shared/               # Codigo compartido
    │   ├── components/       # ~95 componentes, 19 categorias
    │   ├── stores/           # Stores reactivos
    │   ├── types/            # Tipos TypeScript
    │   └── rbac-config.ts    # Matriz de permisos
    │
    └── server/               # Solo servidor
        ├── api.ts            # Cliente HTTP
        ├── *.service.ts      # Servicios por entidad
        ├── mock-flags.ts     # Feature flags
        └── mock/data.ts      # Datos mock
```

## Recursos

- [Documentacion Svelte 5](https://svelte.dev/docs/svelte)
- [Documentacion SvelteKit](https://svelte.dev/docs/kit)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Geist Font](https://vercel.com/font)
