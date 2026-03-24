# Design System

## Fuente de Verdad: `src/app.css`

> **Regla absoluta**: `app.css` es el UNICO archivo donde se definen tokens de diseno. No existe `tailwind.config.js` ni otros archivos de configuracion. Tailwind v4 usa el bloque `@theme` directamente en CSS.

---

## Paleta de Colores

### Viking (Primario — Teal)

Color principal de la aplicacion. Transmite confianza y profesionalismo medico.

```
--color-viking-50:   #f0fafb    (fondos sutiles)
--color-viking-100:  #d9f2f4    (fondos hover)
--color-viking-200:  #b8e6eb    (bordes activos)
--color-viking-300:  #7ed3de    (iconos)
--color-viking-400:  #4ebdcc    (links hover)
--color-viking-500:  #2ea3b5    (color de marca)
--color-viking-600:  #278499    (botones primarios)
--color-viking-700:  #256b7d    (botones hover)
--color-viking-800:  #265867    (texto sobre fondo claro)
--color-viking-900:  #244a58
--color-viking-950:  #13303c    (mas oscuro)
```

### Sage (Verde — Exito, Salud)

Para metricas positivas, confirmaciones, estados de salud.

```
--color-sage-50:     #f6f9f4
--color-sage-500:    #639150    (acento principal)
--color-sage-700:    #3d5c33    (hover)
```

### Honey (Ambar — Alertas, Advertencias)

Para warnings, alertas, estados que requieren atencion.

```
--color-honey-50:    #fefaec
--color-honey-500:   #ee9512    (acento principal)
--color-honey-700:   #ae4f0e    (hover)
```

### Iris (Violeta — Info, Acciones Especiales)

Para informacion, acciones secundarias especiales, badges informativos.

```
--color-iris-50:     #f5f3ff
--color-iris-500:    #8b5cf6    (acento principal)
--color-iris-700:    #6d28d9    (hover)
```

### Slate (Grises con Tinte Azul)

Escala de grises con un sutil tinte azul para un look mas calido y moderno.

```
--color-slate-50:    #f8fafc
--color-slate-200:   #e2e8f0
--color-slate-400:   #94a3b8
--color-slate-500:   #64748b
--color-slate-700:   #334155
--color-slate-900:   #0f172a
```

---

## Colores Semanticos

Estos tokens **cambian automaticamente** entre light y dark mode:

| Token | Proposito | Light | Dark |
|---|---|---|---|
| `surface` | Fondo de cards | `#fafbfc` | `#161b26` |
| `surface-warm` | Variante calida | `#fefdfb` | `#1a2030` |
| `surface-elevated` | Elemento mas elevado | `#ffffff` | `#1e2536` |
| `canvas` | Fondo principal | `#f8f9fb` | `#0c0f14` |
| `canvas-subtle` | Fondo secundario | `#f4f6f8` | `#111520` |
| `ink` | Texto principal | `#1a2332` | `#e8ecf2` |
| `ink-muted` | Texto secundario | `#5c6878` | `#94a3b8` |
| `ink-subtle` | Texto terciario | `#8b95a5` | `#64748b` |
| `border` | Bordes | `#e5e9ef` | `#2a3344` |
| `border-subtle` | Bordes suaves | `#eef1f5` | `#222b3a` |
| `border-strong` | Bordes enfaticos | `#d1d7e0` | `#3a4556` |

### Uso Obligatorio

```svelte
<!-- CORRECTO: tokens semanticos -->
<div class="bg-surface text-ink border border-border rounded-xl">
  <h2 class="text-ink">Titulo</h2>
  <p class="text-ink-muted">Descripcion</p>
  <span class="text-ink-subtle">Nota al pie</span>
</div>

<!-- INCORRECTO: colores hardcodeados -->
<div class="bg-white text-gray-900 border border-gray-200">
  <!-- Esto se rompe en dark mode -->
</div>
```

---

## Sistema de Sombras

5 niveles de elevacion con sombras coloreadas (no negras puras):

| Nivel | Variable | Uso | Opacidad Light | Opacidad Dark |
|---|---|---|---|---|
| 0 | `--shadow-0` | Sin sombra | — | — |
| 1 | `--shadow-1` | Cards en reposo | 0.04-0.06 | 0.3-0.4 |
| 2 | `--shadow-2` | Cards hover, elevados | 0.04-0.08 | 0.3-0.5 |
| 3 | `--shadow-3` | Popovers, dropdowns | 0.06-0.10 | 0.4-0.5 |
| 4 | `--shadow-4` | Modales, dialogs | 0.08-0.12 | 0.4-0.6 |
| 5 | `--shadow-5` | Elementos flotantes max | 0.10-0.14 | 0.5-0.6 |

```svelte
<!-- Tailwind v4: SIEMPRE usar bracket syntax para sombras con variables -->
<div class="shadow-[var(--shadow-1)]">Card basica</div>
<div class="shadow-[var(--shadow-2)]">Card elevada</div>
<div class="shadow-[var(--shadow-4)]">Modal</div>

<!-- Transicion de sombra en hover -->
<div class="shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]
            transition-shadow duration-[var(--duration-normal)]">
  Card interactiva
</div>
```

> **Nota**: Las sombras usan `rgba(26, 35, 50, ...)` (color ink) en lugar de negro puro para un look mas natural.

---

## Tipografia

### Fuentes

| Fuente | Variable | Uso |
|---|---|---|
| **Geist** | `--font-sans` | Todo el texto (UI, headings, body) |
| **Geist Mono** | `--font-mono` | Datos, numeros, codigo |

Se cargan via Google Fonts en `app.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

### Clases Tipograficas

| Clase | Proposito | Propiedades |
|---|---|---|
| `.text-display` | Titulos prominentes | Bold, letter-spacing tight, line-height 1 |
| `.data-hero` | Numeros grandes (StatCards) | Mono, semibold, tabular-nums, tight tracking |
| `.data-value` | Valores tecnicos/datos | Mono, tabular-nums |

```svelte
<!-- Titulo de pagina -->
<h1 class="text-display text-2xl text-ink">Dashboard</h1>

<!-- Numero hero en una MetricCard -->
<span class="data-hero text-4xl text-viking-600">1,234</span>

<!-- Codigo o ID tecnico -->
<code class="data-value text-sm text-ink-muted">NHM-0042</code>
```

### Feature Settings

Geist se configura con sets estilísticos para un look moderno:
```css
font-feature-settings: "cv02", "cv03", "cv04", "cv11";
```

---

## Tokens de Movimiento

### Duraciones

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | `100ms` | Micro-interacciones (hover de iconos, toggles) |
| `--duration-normal` | `200ms` | Transiciones por defecto (hover de botones, borders) |
| `--duration-slow` | `350ms` | Animaciones de cards, transiciones de pagina |
| `--duration-slower` | `500ms` | Animaciones de entrada principales |

### Curvas de Easing

| Token | Valor | Personalidad |
|---|---|---|
| `--ease-spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Energetico, rebote suave |
| `--ease-gentle` | `cubic-bezier(0.4, 0, 0.2, 1)` | Profesional, suave |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot divertido |

### Uso en Componentes

```svelte
<!-- Transicion basica -->
<button class="transition-colors duration-[var(--duration-normal)] ease-[var(--ease-gentle)]">

<!-- Transicion multiple -->
<div class="transition-all duration-[var(--duration-slow)] ease-[var(--ease-spring)]">

<!-- NO usar valores hardcodeados -->
<div class="transition-all duration-200 ease-in-out">  <!-- EVITAR -->
```

---

## Animaciones

### Keyframes Disponibles

| Animacion | Clase | Uso |
|---|---|---|
| Fade in | `.fade-in` | Aparicion con opacidad |
| Zoom in | `.zoom-in-95` | Modal desktop (scale 0.95→1) |
| Slide up | `.slide-up` | Drawer mobile (bottom→up) |
| Slide right | `.slide-in-from-right-4` | Transicion entre pasos de wizard |
| Fade in up | `.animate-fade-in-up` | Cascada de cards |
| Page enter | `.animate-page-enter` | Transicion de ruta |
| Shake | `.animate-shake` | Error de validacion |
| Slide down | `.animate-slide-down` | Mensajes de error |
| Shimmer | `.skeleton` | Loading skeleton |

### Animaciones Stagger (Cascada)

Para que los cards entren uno tras otro con un delay de 60ms:

```svelte
{#each items as item, i}
  <div class="animate-fade-in-up stagger-{Math.min(i + 1, 6)}">
    <Card>
      <CardBody>{item.title}</CardBody>
    </Card>
  </div>
{/each}
```

Clases disponibles: `.stagger-1` (0ms) hasta `.stagger-6` (300ms).

### Dialog Responsivo

El dialog anima diferente en mobile y desktop:

```css
.dialog-panel {
  animation: slide-up 300ms var(--ease-spring) both;  /* Mobile: drawer */
}

@media (min-width: 640px) {
  .dialog-panel {
    animation: zoom-in-95 200ms var(--ease-spring) both;  /* Desktop: modal */
  }
}
```

---

## Glassmorphism

### `.glass` — Efecto Completo

```css
background: rgba(248, 249, 251, 0.72);
-webkit-backdrop-filter: blur(12px) saturate(180%);
backdrop-filter: blur(12px) saturate(180%);
```

Uso: overlays, paneles flotantes prominentes.

### `.glass-subtle` — Efecto Sutil

```css
background: rgba(255, 255, 255, 0.85);
-webkit-backdrop-filter: blur(8px) saturate(150%);
backdrop-filter: blur(8px) saturate(150%);
```

Uso: tooltips, popovers menos prominentes.

```svelte
<div class="glass rounded-xl p-4 border border-border-subtle">
  Contenido con fondo difuminado
</div>
```

> **Safari**: Siempre incluir `-webkit-backdrop-filter` antes de `backdrop-filter`.

---

## Clases de Utilidad

### Elevacion

| Clase | Efecto |
|---|---|
| `.card-elevated` | shadow-1 en reposo, shadow-2 en hover |
| `.btn-shine` | Gradiente sutil de brillo sobre botones |
| `.inset-depth` | Sombra interna sutil |
| `.texture-noise` | Textura de grano apenas perceptible |

### Layout

| Clase | Efecto |
|---|---|
| `.portal-container` | Isolation context + hardware acceleration |
| `.safe-fixed` | Position fixed con fix para Safari |
| `.dense-mode` | Reduce spacing con multiplicador 0.75 |

### Scrollbar

| Clase | Efecto |
|---|---|
| `.custom-scrollbar` | Scrollbar delgado color viking |
| `.custom-scrollbar-subtle` | Scrollbar semi-transparente minimo |

---

## Resumen: Que Usar y Que Evitar

| Usar | Evitar |
|---|---|
| `bg-surface`, `bg-canvas`, `bg-surface-elevated` | `bg-white`, `bg-gray-50` |
| `text-ink`, `text-ink-muted`, `text-ink-subtle` | `text-black`, `text-gray-800`, `text-gray-500` |
| `border-border`, `border-border-subtle` | `border-gray-200`, `border-gray-300` |
| `shadow-[var(--shadow-N)]` | `shadow-md`, `shadow-lg` |
| `duration-[var(--duration-normal)]` | `duration-200`, `duration-300` |
| `ease-[var(--ease-gentle)]` | `ease-in-out`, `ease-linear` |
| `bg-viking-600` (color de marca) | `bg-teal-600`, `bg-cyan-600` |
| `bg-sage-*` (exito) | `bg-green-*` |
| `bg-honey-*` (warning) | `bg-yellow-*`, `bg-amber-*` |
| `bg-iris-*` (info) | `bg-purple-*`, `bg-violet-*` |
