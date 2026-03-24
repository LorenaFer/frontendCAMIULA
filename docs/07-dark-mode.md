# Dark Mode

## Como Funciona

El dark mode esta completamente implementado usando un sistema de clase CSS:

1. **Clase `.dark`** en `<html>` activa el modo oscuro
2. **Tokens semanticos** en `app.css` se redefinen en el bloque `.dark {}`
3. **FOUC prevention**: Script inline en `app.html` detecta preferencia antes del render
4. **3 estados**: light, dark, system (sigue preferencia del OS)
5. **Transicion suave**: 0.3s al cambiar entre modos

---

## Arquitectura

### 1. Variante CSS (`app.css`)

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Esto permite usar `dark:` en Tailwind para estilos especificos del dark mode.

### 2. Tokens que se Redefinen (`.dark {}` en `app.css`)

Todos los tokens semanticos cambian automaticamente:

```css
.dark {
  --color-canvas: #0c0f14;
  --color-surface: #161b26;
  --color-surface-elevated: #1e2536;
  --color-ink: #e8ecf2;
  --color-ink-muted: #94a3b8;
  --color-border: #2a3344;
  /* ... y todos los demas tokens */
}
```

### 3. Prevencion de FOUC (`app.html`)

Script inline que se ejecuta ANTES de renderizar el body:

```html
<script>
  (function() {
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (!theme && prefersDark) || (theme === 'system' && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

> Esto evita el "flash" de tema claro al cargar la pagina cuando el usuario prefiere dark.

### 4. ThemeStore (`src/lib/shared/stores/theme.svelte.ts`)

```typescript
class ThemeStore {
  current = $state<Theme>(getInitialTheme());    // 'light' | 'dark' | 'system'
  isDark = $derived(shouldBeDark(this.current));   // boolean

  setTheme(t: Theme) {
    this.current = t;
    localStorage.setItem('theme', t);
    applyToDOM(shouldBeDark(t));
  }

  toggle() {
    // Cicla: light → dark → system → light
    const next: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
    this.setTheme(next[this.current]);
  }
}

export const themeStore = new ThemeStore();
```

### 5. ThemeToggle (`src/lib/shared/components/layout/ThemeToggle.svelte`)

Componente de 3 estados (light/dark/system) con icono correspondiente.

### 6. Transicion Suave

Al cambiar tema, se agrega temporalmente la clase `html.transitioning`:

```css
html.transitioning,
html.transitioning * {
  transition: background-color 0.3s ease,
              border-color 0.3s ease,
              color 0.2s ease !important;
}
```

---

## Reglas para Desarrolladores

### Regla 1: Usar Tokens Semanticos

Los ~73 componentes del proyecto usan tokens que se adaptan automaticamente:

```svelte
<!-- Funciona en ambos modos sin cambios -->
<div class="bg-surface text-ink border border-border">
  <p class="text-ink-muted">Texto secundario</p>
</div>
```

### Regla 2: No Usar Colores Fijos para Fondos/Texto

```svelte
<!-- INCORRECTO: se rompe en dark mode -->
<div class="bg-white text-black border border-gray-200">
<div class="bg-gray-50 text-gray-600">
<div class="bg-slate-100 text-slate-800">

<!-- CORRECTO -->
<div class="bg-surface text-ink border border-border">
<div class="bg-canvas-subtle text-ink-muted">
<div class="bg-canvas text-ink">
```

### Regla 3: `dark:` Solo para Excepciones

Usar `dark:` cuando un token semantico no cubre el caso:

```svelte
<!-- Excepcion: badge con fondo diferente en dark -->
<span class="bg-viking-50 text-viking-800 dark:bg-viking-950 dark:text-viking-200">
  Activo
</span>
```

### Regla 4: Verificar en Ambos Modos

Antes de hacer merge, verificar que tu componente se ve bien en:
- Light mode
- Dark mode
- System mode (cambia con la preferencia del OS)

### Regla 5: Sombras Adaptativas

Las sombras del design system ya se adaptan a dark mode (opacidad mayor). Usar siempre `shadow-[var(--shadow-N)]`:

```svelte
<!-- Las sombras se adaptan solas -->
<div class="shadow-[var(--shadow-2)]">
  <!-- Light: sombra sutil (0.04-0.08 opacidad) -->
  <!-- Dark: sombra mas fuerte (0.3-0.5 opacidad) -->
</div>
```

---

## Tabla de Mapeo de Colores

Referencia rapida para migrar colores hardcodeados:

| Hardcodeado | Token Semantico |
|---|---|
| `bg-white` | `bg-surface` o `bg-surface-elevated` |
| `bg-gray-50` | `bg-canvas` o `bg-canvas-subtle` |
| `bg-gray-100` | `bg-canvas-subtle` |
| `text-black` | `text-ink` |
| `text-gray-900` | `text-ink` |
| `text-gray-700` | `text-ink` |
| `text-gray-600` | `text-ink-muted` |
| `text-gray-500` | `text-ink-muted` |
| `text-gray-400` | `text-ink-subtle` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border-strong` |
| `border-gray-100` | `border-border-subtle` |
| `divide-gray-200` | `divide-border` |

---

## Glassmorphism en Dark Mode

Las clases `.glass` y `.glass-subtle` se adaptan automaticamente:

| Clase | Light | Dark |
|---|---|---|
| `.glass` | `rgba(248, 249, 251, 0.72)` | `rgba(12, 15, 20, 0.72)` |
| `.glass-subtle` | `rgba(255, 255, 255, 0.85)` | `rgba(22, 27, 38, 0.85)` |

No necesitas hacer nada extra. Solo usa la clase y funcionara en ambos modos.
