#!/usr/bin/env node

/**
 * Architecture Validation Script - Screaming Architecture Validator
 *
 * Validates SvelteKit project structure to ensure:
 * - Domain-driven feature organization
 * - Proper separation of concerns
 * - Consistent naming conventions
 * - Minimal business logic in routes
 * - TypeScript compilation and build validation
 *
 * ============================================================
 * ⚠️  PRINCIPIO DE USO — LEER ANTES DE "ARREGLAR" VIOLACIONES
 * ============================================================
 *
 * Este validador es una herramienta de REFACTORIZACIÓN ESTRUCTURAL.
 * NO es licencia para alterar la UI ni para mutilar componentes.
 *
 * Si una "fix" propuesta para satisfacer este validador (o errores de
 * TypeScript relacionados) implicaría:
 *   ❌ Quitar props que el componente sí acepta en runtime (variant,
 *      style, color, size, trend, href, etc.)
 *   ❌ Sustituir variantes visuales por fallbacks "compatibles con el tipo"
 *   ❌ Eliminar bloques de UI porque "el tipo no expone ese campo"
 *   ❌ Reemplazar componentes ricos por equivalentes empobrecidos
 *
 * → El problema está en el TIPO (mal declarado o desactualizado),
 *   no en el componente. ARREGLA EL TIPO, NO EL COMPONENTE.
 *   Preserva la calidad visual siempre. Si hay duda, consulta antes
 *   de tocar markup/styling.
 *
 * Refactors válidos típicos: extraer helpers a módulos, dividir un
 * componente grande en sub-componentes preservando props/markup,
 * mover archivos a sub-carpetas, sustituir fetch() por un client de
 * dominio. NUNCA: cambiar el aspecto del producto para callar un linter.
 * ============================================================
 *
 * COMPLEMENTOS QUE ESTE VALIDADOR NO HACE (correr aparte):
 *   • Duplicación de código (componentes casi-iguales):
 *       npx jscpd src/ --min-lines 30 --min-tokens 100
 *   • Cambios destructivos a UI (props/clases removidas en un PR):
 *       git diff origin/main...HEAD -- '*.svelte' | \
 *         grep -E '^-.*(variant|color|size|class|style)='
 *   • Visual regression (look & feel del producto):
 *       herramienta dedicada (Percy, Chromatic, Playwright screenshots)
 *
 * Usage: node scripts/validate-architecture.js
 *        node scripts/validate-architecture.js --ci   (skip TS/build)
 * Exit codes: 0 = success, 1 = violations found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, relative } from 'path';
import { execSync } from 'child_process';

// ================== CONFIGURATION ==================

const CONFIG = {
  // Project root directory (relative to script location)
  ROOT_DIR: process.cwd(),
  
  // Paths to validate
  PATHS: {
    FEATURES: 'src/lib/domain', // Current domain structure (to be validated as features)
    SHARED: 'src/lib/shared',
    ROUTES: 'src/routes',
    SERVER: 'src/lib/server'
  },
  
  // File size limits (lines of code)
  LIMITS: {
    ROUTE_PAGE_MAX_LINES: 400,        // Max lines for +page.svelte files
    ROUTE_SERVER_MAX_LINES: 300,      // Max lines for +page.server.ts files
    COMPONENT_MAX_LINES: 500          // Max lines for individual components
  },

  // Naming conventions
  NAMING: {
    // Files should be kebab-case
    FILE_PATTERN: /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(svelte|ts|js)$/,
    // Components should be PascalCase
    COMPONENT_PATTERN: /^[A-Z][a-zA-Z0-9]*\.svelte$/,
    // Feature directories should be kebab-case
    FEATURE_DIR_PATTERN: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
  },

  // Business logic anti-patterns: only flag classes with constructors
  // (rutas que instancian objetos con estado son la señal real de lógica
  // que debería vivir en services). Todo lo demás (tamaño de funciones,
  // verbos comunes, objetos literales) genera demasiado falso positivo.
  BUSINESS_LOGIC_PATTERNS: [
    /class\s+\w+\s*{[\s\S]*?constructor/        // Class definitions with constructors
  ],

  // Component logic weight thresholds. fetch/class son errores (rompen build);
  // los thresholds de tamaño/densidad siguen como warnings (señales blandas).
  COMPONENT_LOGIC: {
    SCRIPT_LINES_WARN: 200,           // <script> con más de N líneas se sugiere extraer
    SCRIPT_RATIO_WARN: 0.6,           // <script> ocupa más del 60% del archivo
    ASYNC_FUNCS_WARN: 4,              // Más de N async funcs sugiere mover a client module
    FLAT_COMPONENTS_MAX: 4,           // > N archivos planos en components/ es ERROR (forzar sub-folders)
    PROPS_COUNT_WARN: 8,              // Props interface con > N campos sugiere prop drilling
    PROPS_COUNT_MAX: 12,              // > N props es ERROR (composición / contexto)
    FUNCTION_BODY_WARN: 50,           // Función con cuerpo > N líneas sugiere extraer a service/util
    FUNCTION_BODY_MAX: 100,           // > N líneas es ERROR (lógica de negocio en componente)
    IMPORT_DEPTH_MAX: 2               // Imports relativos con > N niveles arriba (../../../) son ERROR
  },

  // Nombres genéricos prohibidos (señal de "no sabía cómo llamarlo").
  // Los nombres de archivo deben describir el dominio que representan.
  GENERIC_NAMES: new Set([
    'Foo', 'Bar', 'Baz', 'Qux',
    'Helper', 'Helpers', 'Util', 'Utils',
    'Common', 'Misc', 'Stuff', 'Thing', 'Things',
    'Wrapper', 'Container', 'Generic', 'Base', 'Default',
    'Component', 'MyComponent', 'NewComponent',
    'Test', 'TestComponent', 'Temp', 'Tmp', 'Demo', 'Example',
    'Data', 'Info', 'Item' // Item solo si es bare; "PrescriptionItem" pasa
  ]),

  // Suffixes que sugieren agrupar componentes en sub-carpetas
  COMPONENT_GROUP_SUFFIXES: ['Form', 'Dialog', 'Modal', 'View', 'List', 'Card', 'Item', 'Wizard', 'Section', 'Management', 'Table', 'Filters', 'Stats']
};

// ================== UTILITY FUNCTIONS ==================

/**
 * Recursively get all files in a directory with their stats
 */
function getAllFiles(dir, extensions = ['.svelte', '.ts', '.js']) {
  const files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!item.startsWith('.') && item !== 'node_modules') {
          files.push(...getAllFiles(fullPath, extensions));
        }
      } else if (extensions.includes(extname(item))) {
        files.push({
          path: fullPath,
          relativePath: relative(CONFIG.ROOT_DIR, fullPath),
          name: basename(item),
          size: stat.size,
          extension: extname(item)
        });
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  
  return files;
}

/**
 * Count lines in a file
 */
function countLines(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if file contains heavy business logic
 */
function hasHeavyBusinessLogic(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Check for business logic patterns
    for (const pattern of CONFIG.BUSINESS_LOGIC_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }
    
    // Check for long files (indication of complex logic)
    const lines = content.split('\n').length;
    if (filePath.includes('routes/') && lines > CONFIG.LIMITS.ROUTE_PAGE_MAX_LINES) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Extract concatenated <script> content from a Svelte file
 */
function extractScriptContent(content) {
  const blocks = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
  return blocks.map(b => b.replace(/<\/?script[^>]*>/gi, '')).join('\n');
}

/**
 * Count <script> lines vs total lines for a Svelte file
 */
function countScriptVsTotal(content) {
  const totalLines = content.split('\n').length;
  const blocks = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
  let scriptLines = 0;
  for (const b of blocks) scriptLines += b.split('\n').length;
  return { scriptLines, totalLines };
}

/**
 * Validate naming convention for a file
 */
function validateFileName(fileName, isComponent = false) {
  // SvelteKit special files are exempt from naming rules
  if (fileName.startsWith('+') || fileName.startsWith('[') || fileName.includes('$types')) {
    return true;
  }
  
  // Svelte store files (.svelte.ts) have special naming rules
  if (fileName.endsWith('.svelte.ts')) {
    // Remove .svelte.ts suffix for validation
    const baseName = fileName.replace('.svelte.ts', '');
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(baseName);
  }
  
  if (isComponent) {
    return CONFIG.NAMING.COMPONENT_PATTERN.test(fileName);
  }
  return CONFIG.NAMING.FILE_PATTERN.test(fileName);
}

/**
 * Validate feature directory structure
 */
function validateFeatureStructure(featurePath) {
  const violations = [];
  
  try {
    const items = readdirSync(featurePath);
    const hasComponents = items.includes('components');
    const hasTypes = items.some(item => item.endsWith('types.ts'));
    
    if (!hasComponents && items.some(item => item.endsWith('.svelte'))) {
      violations.push(`Feature should have components/ directory instead of loose .svelte files: ${featurePath}`);
    }
    
    if (!hasTypes) {
      violations.push(`Feature missing types.ts file: ${featurePath}`);
    }
    
    // Check for proper organization
    const svelteFiles = items.filter(item => item.endsWith('.svelte'));
    if (svelteFiles.length > 0 && hasComponents) {
      violations.push(`Feature has both components/ directory and loose .svelte files: ${featurePath}`);
    }
    
  } catch (error) {
    violations.push(`Cannot read feature directory: ${featurePath}`);
  }
  
  return violations;
}

// ================== VALIDATION FUNCTIONS ==================

/**
 * Validate feature/domain organization
 */
function validateFeatureOrganization() {
  const violations = [];
  const featuresPath = join(CONFIG.ROOT_DIR, CONFIG.PATHS.FEATURES);
  
  try {
    const features = readdirSync(featuresPath).filter(item => {
      const fullPath = join(featuresPath, item);
      return statSync(fullPath).isDirectory();
    });
    
    for (const feature of features) {
      // Validate feature directory naming
      if (!CONFIG.NAMING.FEATURE_DIR_PATTERN.test(feature)) {
        violations.push(`Feature directory should use kebab-case: ${feature}`);
      }
      
      // Validate feature structure
      const featurePath = join(featuresPath, feature);
      violations.push(...validateFeatureStructure(featurePath));
    }
    
    if (features.length < 3) {
      violations.push(`Expected at least 3 feature domains, found ${features.length}. Consider better domain separation.`);
    }
    
  } catch (error) {
    violations.push(`Cannot access features directory: ${CONFIG.PATHS.FEATURES}`);
  }
  
  return violations;
}

/**
 * Validate that routes contain minimal business logic
 */
function validateRoutesLogic() {
  const violations = [];
  const routesPath = join(CONFIG.ROOT_DIR, CONFIG.PATHS.ROUTES);
  const routeFiles = getAllFiles(routesPath);
  
  for (const file of routeFiles) {
    // Check for business logic in route files
    if (hasHeavyBusinessLogic(file.path)) {
      violations.push(`Route contains heavy business logic: ${file.relativePath}`);
    }
    
    // Check line count limits
    const lines = countLines(file.path);
    if (file.name.includes('+page.svelte') && lines > CONFIG.LIMITS.ROUTE_PAGE_MAX_LINES) {
      violations.push(`Route page too large (${lines} lines > ${CONFIG.LIMITS.ROUTE_PAGE_MAX_LINES}): ${file.relativePath}`);
    }
    
    if (file.name.includes('+page.server.ts') && lines > CONFIG.LIMITS.ROUTE_SERVER_MAX_LINES) {
      violations.push(`Route server file too large (${lines} lines > ${CONFIG.LIMITS.ROUTE_SERVER_MAX_LINES}): ${file.relativePath}`);
    }
    
    // Check for component files in routes (should be in features)
    if (file.extension === '.svelte' && !file.name.startsWith('+')) {
      violations.push(`Component file should be in feature/shared, not routes: ${file.relativePath}`);
    }
  }
  
  return violations;
}

/**
 * Validate naming conventions across the project
 */
function validateNamingConventions() {
  const violations = [];
  const pathsToCheck = [
    CONFIG.PATHS.FEATURES,
    CONFIG.PATHS.SHARED,
    CONFIG.PATHS.ROUTES
  ];
  
  for (const pathToCheck of pathsToCheck) {
    const fullPath = join(CONFIG.ROOT_DIR, pathToCheck);
    const files = getAllFiles(fullPath);
    
    for (const file of files) {
      const isComponent = file.extension === '.svelte';
      const isValid = validateFileName(file.name, isComponent);
      
      if (!isValid) {
        const expectedPattern = isComponent ? 'PascalCase.svelte' : 'kebab-case';
        violations.push(`Invalid filename (expected ${expectedPattern}): ${file.relativePath}`);
      }
    }
  }
  
  return violations;
}

/**
 * Validate shared component organization
 */
function validateSharedOrganization() {
  const violations = [];
  const sharedPath = join(CONFIG.ROOT_DIR, CONFIG.PATHS.SHARED, 'components');
  
  try {
    const categories = readdirSync(sharedPath).filter(item => {
      const fullPath = join(sharedPath, item);
      return statSync(fullPath).isDirectory();
    });
    
    // Check for proper categorization
    const expectedCategories = ['input', 'layout', 'card', 'table', 'dialog', 'button'];
    const foundCategories = categories.filter(cat => expectedCategories.includes(cat));
    
    if (foundCategories.length < 5) {
      violations.push(`Shared components should be properly categorized. Found: ${categories.join(', ')}`);
    }
    
    // Check for loose component files
    const files = readdirSync(sharedPath);
    const looseSvelteFiles = files.filter(file => file.endsWith('.svelte'));
    
    if (looseSvelteFiles.length > 0) {
      violations.push(`Shared components should be organized in categories, not loose files: ${looseSvelteFiles.join(', ')}`);
    }
    
  } catch (error) {
    violations.push(`Cannot access shared components directory: ${sharedPath}`);
  }
  
  return violations;
}

/**
 * Validate component sizes
 */
function validateComponentSizes() {
  const violations = [];
  const pathsToCheck = [CONFIG.PATHS.FEATURES, CONFIG.PATHS.SHARED];

  for (const pathToCheck of pathsToCheck) {
    const fullPath = join(CONFIG.ROOT_DIR, pathToCheck);
    const files = getAllFiles(fullPath, ['.svelte']);

    for (const file of files) {
      const lines = countLines(file.path);
      if (lines > CONFIG.LIMITS.COMPONENT_MAX_LINES) {
        violations.push(`Component too large (${lines} lines > ${CONFIG.LIMITS.COMPONENT_MAX_LINES}): ${file.relativePath}`);
      }
    }
  }

  return violations;
}

/**
 * Detecta lógica pesada que debería vivir fuera del componente:
 *  - fetch() global → mover a un client de dominio
 *  - definición de class X → mover a stores o service modules
 *  - <script> con muchas líneas o desproporcionado vs template (warning)
 *  - alta densidad de async functions (warning)
 */
function validateComponentLogicWeight() {
  const findings = [];
  const pathsToCheck = [CONFIG.PATHS.FEATURES, CONFIG.PATHS.SHARED, CONFIG.PATHS.ROUTES];

  for (const pathToCheck of pathsToCheck) {
    const fullPath = join(CONFIG.ROOT_DIR, pathToCheck);
    const files = getAllFiles(fullPath, ['.svelte']);

    for (const file of files) {
      let content;
      try { content = readFileSync(file.path, 'utf8'); } catch { continue; }
      const script = extractScriptContent(content);
      if (!script) continue;

      const isRoutePage = file.name.startsWith('+');

      // ERROR: fetch() global en componentes de dominio/shared (ignora
      // `xxx.fetch(`). Route pages (`+page.svelte`, `+layout.svelte`) están
      // exentas: pueden llamar sus propias form actions vía `fetch('?/x')`.
      if (!isRoutePage && /(?<!\.)\bfetch\s*\(/.test(script)) {
        findings.push({
          severity: 'error',
          message: `Component calls global fetch() — extract HTTP calls to a domain client (e.g. domain/<feature>/<feature>-client.ts): ${file.relativePath}`
        });
      }

      // ERROR: definición de class dentro del componente
      const classMatch = script.match(/(^|\n)\s*class\s+(\w+)\b/);
      if (classMatch) {
        findings.push({
          severity: 'error',
          message: `Component defines class "${classMatch[2]}" — move to a store (.svelte.ts) or client module: ${file.relativePath}`
        });
      }

      // WARNING: script pesado en líneas y proporción
      const { scriptLines, totalLines } = countScriptVsTotal(content);
      const ratio = totalLines > 0 ? scriptLines / totalLines : 0;
      if (scriptLines > CONFIG.COMPONENT_LOGIC.SCRIPT_LINES_WARN && ratio > CONFIG.COMPONENT_LOGIC.SCRIPT_RATIO_WARN) {
        findings.push({
          severity: 'warning',
          message: `Heavy <script> block (${scriptLines} lines, ${(ratio * 100).toFixed(0)}% of file) — extract helpers/clients into .ts modules: ${file.relativePath}`
        });
      }

      // WARNING: alta densidad de async funcs (suele indicar API client embebido)
      const asyncCount = (script.match(/\basync\s+(function\b|\w+\s*\()/g) || []).length;
      if (asyncCount > CONFIG.COMPONENT_LOGIC.ASYNC_FUNCS_WARN) {
        findings.push({
          severity: 'warning',
          message: `${asyncCount} async functions in component — consider extracting a client module: ${file.relativePath}`
        });
      }
    }
  }

  return findings;
}

/**
 * Sugiere sub-organizar carpetas components/ con muchos archivos planos.
 */
function validateComponentOrganization() {
  const findings = [];
  const featuresPath = join(CONFIG.ROOT_DIR, CONFIG.PATHS.FEATURES);

  let features;
  try {
    features = readdirSync(featuresPath).filter(f => statSync(join(featuresPath, f)).isDirectory());
  } catch { return findings; }

  for (const feature of features) {
    const componentsPath = join(featuresPath, feature, 'components');
    let items;
    try { items = readdirSync(componentsPath); } catch { continue; }

    const flatSvelte = items.filter(item => {
      try {
        return statSync(join(componentsPath, item)).isFile() && item.endsWith('.svelte');
      } catch { return false; }
    });

    if (flatSvelte.length > CONFIG.COMPONENT_LOGIC.FLAT_COMPONENTS_MAX) {
      // Agrupar por sufijo conocido para sugerir sub-folders
      const pluralize = (s) => s.endsWith('s') ? s : s + 's';
      const groups = {};
      for (const file of flatSvelte) {
        let group = 'widgets';
        for (const suffix of CONFIG.COMPONENT_GROUP_SUFFIXES) {
          if (file.endsWith(`${suffix}.svelte`)) { group = pluralize(suffix.toLowerCase()); break; }
        }
        groups[group] = (groups[group] || 0) + 1;
      }
      const summary = Object.entries(groups)
        .sort((a, b) => b[1] - a[1])
        .map(([g, c]) => `${g}=${c}`)
        .join(', ');
      findings.push({
        severity: 'error',
        message: `Feature "${feature}" has ${flatSvelte.length} flat components — split into sub-folders by role (${summary}): src/lib/domain/${feature}/components/`
      });
    }
  }

  return findings;
}

/**
 * Detecta imports relativos profundos (../../../...). El proyecto tiene
 * aliases ($domain, $shared, $lib) — usar relativos profundos rompe la
 * encapsulación de feature y dificulta refactor.
 */
function validateImportDepth() {
  const findings = [];
  const pathsToCheck = [CONFIG.PATHS.FEATURES, CONFIG.PATHS.SHARED, CONFIG.PATHS.ROUTES, CONFIG.PATHS.SERVER];
  const maxDots = '../'.repeat(CONFIG.COMPONENT_LOGIC.IMPORT_DEPTH_MAX + 1);

  for (const pathToCheck of pathsToCheck) {
    const fullPath = join(CONFIG.ROOT_DIR, pathToCheck);
    const files = getAllFiles(fullPath);

    for (const file of files) {
      let content;
      try { content = readFileSync(file.path, 'utf8'); } catch { continue; }

      // Match `from '...'` y `import('...')` paths
      const importRegex = /(?:from|import)\s*\(?\s*['"`]([^'"`]+)['"`]/g;
      let m;
      const flagged = new Set();
      while ((m = importRegex.exec(content)) !== null) {
        const path = m[1];
        if (path.includes(maxDots) && !flagged.has(path)) {
          flagged.add(path);
          findings.push({
            severity: 'error',
            message: `Deep relative import (${maxDots.match(/\.\.\//g).length}+ levels) — use $domain/$shared/$lib alias: ${file.relativePath} → ${path}`
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Detecta prop drilling: Props interfaces o destructuring de $props con
 * demasiados campos. > 8 = warning, > 12 = error. La señal: el componente
 * está siendo usado como "pasamanos" — composición o context API ayudan.
 */
function validatePropDrilling() {
  const findings = [];
  // Skip shared/components: son primitivas (DataTable, FileUpload, DateInput)
  // que legítimamente exponen APIs configurables. La regla aplica a domain
  // y routes — donde la composición debería absorber la complejidad.
  const pathsToCheck = [CONFIG.PATHS.FEATURES, CONFIG.PATHS.ROUTES];

  for (const pathToCheck of pathsToCheck) {
    const fullPath = join(CONFIG.ROOT_DIR, pathToCheck);
    const files = getAllFiles(fullPath, ['.svelte']);

    for (const file of files) {
      let content;
      try { content = readFileSync(file.path, 'utf8'); } catch { continue; }
      const script = extractScriptContent(content);
      if (!script) continue;

      // Patrón A: `interface Props { ... }`
      const interfaceMatch = script.match(/interface\s+Props\s*\{([\s\S]*?)\}/);
      // Patrón B: tipo inline en $props: `}: { ... } = $props()`
      const inlineMatch = script.match(/\}\s*:\s*\{([\s\S]*?)\}\s*=\s*\$props\(\)/);

      const body = interfaceMatch ? interfaceMatch[1] : (inlineMatch ? inlineMatch[1] : null);
      if (!body) continue;

      // Cuenta líneas con `nombre:` (con o sin `?`) que no sean comentarios
      const propCount = (body.match(/^\s*\w+\s*[?]?\s*:/gm) || []).length;

      if (propCount > CONFIG.COMPONENT_LOGIC.PROPS_COUNT_MAX) {
        findings.push({
          severity: 'error',
          message: `Component has ${propCount} props (> ${CONFIG.COMPONENT_LOGIC.PROPS_COUNT_MAX}) — refactor with composition (snippets) or context API: ${file.relativePath}`
        });
      } else if (propCount > CONFIG.COMPONENT_LOGIC.PROPS_COUNT_WARN) {
        findings.push({
          severity: 'warning',
          message: `Component has ${propCount} props (> ${CONFIG.COMPONENT_LOGIC.PROPS_COUNT_WARN}) — possible prop drilling. Consider composition: ${file.relativePath}`
        });
      }
    }
  }

  return findings;
}

/**
 * Encuentra funciones (function decl o arrow asignada a const) y devuelve
 * pares {name, lines} con el conteo de líneas del cuerpo. Walker de braces
 * — sin AST pero suficiente para heurística.
 */
function findFunctionsWithBodyLines(script) {
  const results = [];
  const fnStartRegex = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>))/gm;
  let m;
  while ((m = fnStartRegex.exec(script)) !== null) {
    const name = m[1] || m[2];
    const after = script.substring(m.index);
    const braceIdx = after.indexOf('{');
    if (braceIdx === -1) continue;

    let depth = 0;
    let endIdx = -1;
    for (let i = braceIdx; i < after.length; i++) {
      if (after[i] === '{') depth++;
      else if (after[i] === '}') {
        depth--;
        if (depth === 0) { endIdx = i; break; }
      }
    }
    if (endIdx === -1) continue;
    const body = after.substring(braceIdx, endIdx + 1);
    results.push({ name, lines: body.split('\n').length });
  }
  return results;
}

/**
 * Detecta lógica de negocio dentro de componentes: funciones largas en
 * <script>. > 50 líneas = warning, > 100 = error. La señal: la función
 * es lo suficientemente compleja para merecer un service module.
 */
function validateBusinessLogicInComponents() {
  const findings = [];
  const pathsToCheck = [CONFIG.PATHS.FEATURES, CONFIG.PATHS.SHARED, CONFIG.PATHS.ROUTES];

  for (const pathToCheck of pathsToCheck) {
    const fullPath = join(CONFIG.ROOT_DIR, pathToCheck);
    const files = getAllFiles(fullPath, ['.svelte']);

    for (const file of files) {
      let content;
      try { content = readFileSync(file.path, 'utf8'); } catch { continue; }
      const script = extractScriptContent(content);
      if (!script) continue;

      const fns = findFunctionsWithBodyLines(script);
      for (const fn of fns) {
        if (fn.lines > CONFIG.COMPONENT_LOGIC.FUNCTION_BODY_MAX) {
          findings.push({
            severity: 'error',
            message: `Function "${fn.name}" has ${fn.lines} lines (> ${CONFIG.COMPONENT_LOGIC.FUNCTION_BODY_MAX}) — extract to a service or util module: ${file.relativePath}`
          });
        } else if (fn.lines > CONFIG.COMPONENT_LOGIC.FUNCTION_BODY_WARN) {
          findings.push({
            severity: 'warning',
            message: `Function "${fn.name}" has ${fn.lines} lines (> ${CONFIG.COMPONENT_LOGIC.FUNCTION_BODY_WARN}) — consider extracting business logic: ${file.relativePath}`
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Clasifica un import por tipo de bindings:
 *   'type'  — todos los bindings son types (`import type {...}` o `{ type Foo, type Bar }`)
 *   'value' — al menos un binding es runtime (default, namespace, o named sin `type`)
 *   'mixed' — combina types y values (`{ type Foo, runtimeFn }` o `import Foo, { type Bar }`)
 *   'side-effect' — `import 'x'` sin bindings (no aplica a este check)
 */
function classifyImport(specifierClause) {
  const clause = specifierClause.trim();

  // Top-level `type` keyword cubre todo el statement
  if (/^type\s+/.test(clause)) return 'type';

  // Sin braces: default o namespace, ambos value
  if (!clause.includes('{')) return 'value';

  // Hay named imports — analizar
  const braceMatch = clause.match(/\{([^}]*)\}/);
  if (!braceMatch) return 'value';

  const beforeBrace = clause.substring(0, clause.indexOf('{')).replace(/,\s*$/, '').trim();
  const hasDefaultOrNamespace = beforeBrace.length > 0;

  const namedSpecs = braceMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  if (namedSpecs.length === 0) {
    return hasDefaultOrNamespace ? 'value' : 'type';
  }

  const allTypePrefixed = namedSpecs.every(s => /^type\s+/.test(s));

  if (hasDefaultOrNamespace) {
    // Default/namespace siempre es value; named todos type → mixed
    return allTypePrefixed ? 'mixed' : 'value';
  }

  if (allTypePrefixed) return 'type';

  const someTypePrefixed = namedSpecs.some(s => /^type\s+/.test(s));
  return someTypePrefixed ? 'mixed' : 'value';
}

/**
 * Detecta acoplamiento entre features de dominio. Solo se permite
 * `import type` cross-domain (contratos compartidos). Imports value
 * cruzados son ERROR — usar composición o subir el código a shared/.
 *
 *   ✅  import type { Paciente } from '$domain/patients/types.js'
 *   ❌  import MedicationSelector from '$domain/inventory/components/...'
 *   ❌  import { type Foo, runtimeFn } from '$domain/...'  (mixed — separar)
 *
 * Routes y src/lib/server/ están exentos: routes son orquestadores
 * (componen várias features) y server tiene su propia capa de validación
 * (SvelteKit ya impide $lib/server/ en cliente).
 */
function validateCrossDomainImports() {
  const findings = [];
  const featuresPath = join(CONFIG.ROOT_DIR, CONFIG.PATHS.FEATURES);

  let features;
  try {
    features = readdirSync(featuresPath).filter(f =>
      statSync(join(featuresPath, f)).isDirectory()
    );
  } catch { return findings; }

  for (const feature of features) {
    const featureDir = join(featuresPath, feature);
    const files = getAllFiles(featureDir);

    for (const file of files) {
      let content;
      try { content = readFileSync(file.path, 'utf8'); } catch { continue; }

      // Match `import <something> from '...'` (saltea side-effect imports)
      const importStmtRegex = /^[ \t]*import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]/gm;
      let m;
      while ((m = importStmtRegex.exec(content)) !== null) {
        const specifierClause = m[1];
        const importPath = m[2];

        // Solo nos interesan $domain/* aliases
        const domainMatch = importPath.match(/^\$domain\/([^/]+)/);
        if (!domainMatch) continue;
        const importedFeature = domainMatch[1];

        // Mismo feature: OK
        if (importedFeature === feature) continue;

        const kind = classifyImport(specifierClause);

        if (kind === 'value') {
          findings.push({
            severity: 'error',
            message: `Cross-domain VALUE import: domain/${feature} → $domain/${importedFeature} (only 'import type' allowed across features). Move shared component to shared/, compose via props/snippets, or import only types: ${file.relativePath}`
          });
        } else if (kind === 'mixed') {
          findings.push({
            severity: 'error',
            message: `Cross-domain MIXED import: domain/${feature} → $domain/${importedFeature} (mixes types and values). Split into separate 'import type {...}' and 'import {...}' statements: ${file.relativePath}`
          });
        }
        // 'type' o 'side-effect' → permitidos
      }
    }
  }

  return findings;
}

/**
 * Detecta nombres genéricos / lazy en archivos. El nombre debe describir
 * el dominio. "Helper.svelte", "Utils.ts", "Foo.svelte" son señales de
 * "no sabía cómo llamarlo" — bloqueador para newcomers que escanean el
 * árbol buscando contexto.
 */
function validateSemanticNaming() {
  const findings = [];
  const pathsToCheck = [CONFIG.PATHS.FEATURES, CONFIG.PATHS.SHARED, CONFIG.PATHS.ROUTES, CONFIG.PATHS.SERVER];

  for (const pathToCheck of pathsToCheck) {
    const fullPath = join(CONFIG.ROOT_DIR, pathToCheck);
    const files = getAllFiles(fullPath);

    for (const file of files) {
      // index.ts/index.js es legítimo (barrel exports)
      if (file.name === 'index.ts' || file.name === 'index.js') continue;
      // SvelteKit specials
      if (file.name.startsWith('+') || file.name.startsWith('[') || file.name.includes('$types')) continue;
      // mock data dirs son convención, no production code
      if (file.relativePath.includes('/mock/')) continue;

      const baseName = file.name
        .replace(/\.svelte\.ts$/, '')
        .replace(/\.(svelte|ts|js)$/, '');

      // Para .ts/.js: convertir kebab-case a PascalCase para chequear
      const normalized = baseName.includes('-')
        ? baseName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
        : baseName.charAt(0).toUpperCase() + baseName.slice(1);

      if (CONFIG.GENERIC_NAMES.has(normalized)) {
        findings.push({
          severity: 'error',
          message: `Generic/lazy filename "${baseName}" — use a domain-meaningful name (e.g. "PatientRegistrationForm", not "Form"): ${file.relativePath}`
        });
      }
    }
  }

  return findings;
}

/**
 * Validate TypeScript compilation
 */
function validateTypeScriptCompilation() {
  const violations = [];
  
  try {
    console.log('   🔧 Running TypeScript check...');
    execSync('npx svelte-check --no-tsconfig', { 
      stdio: 'pipe', 
      encoding: 'utf-8',
      cwd: CONFIG.ROOT_DIR 
    });
  } catch (error) {
    const output = error.stdout || error.stderr || error.message;
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Error:') || line.includes('error TS')) {
        violations.push(`TypeScript error: ${line.trim()}`);
      }
    }
    
    if (violations.length === 0 && output.includes('error')) {
      violations.push('TypeScript compilation failed - check console output for details');
    }
  }
  
  return violations;
}

/**
 * Validate build process
 */
function validateBuild() {
  const violations = [];
  
  try {
    console.log('   🏗️  Running build check...');
    execSync('npm run build', { 
      stdio: 'pipe', 
      encoding: 'utf-8',
      cwd: CONFIG.ROOT_DIR 
    });
  } catch (error) {
    const output = error.stdout || error.stderr || error.message;
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('error') || line.includes('Error') || line.includes('ERROR')) {
        violations.push(`Build error: ${line.trim()}`);
      }
    }
    
    if (violations.length === 0) {
      violations.push('Build failed - check console output for details');
    }
  }
  
  return violations;
}

// ================== MAIN EXECUTION ==================

// --ci  → skip TypeScript and Build checks (already covered by other CI gates)
const CI_MODE = process.argv.includes('--ci');

/**
 * Normaliza el output de un validador. Acepta tanto strings (legacy)
 * como objetos {severity, message}. Strings se asumen 'error'.
 */
function normalizeFindings(rawList) {
  return rawList.map(item =>
    typeof item === 'string' ? { severity: 'error', message: item } : item
  );
}

/**
 * Main validation function
 */
function validateArchitecture() {
  if (CI_MODE) {
    console.log('🏗️  Validating Screaming Architecture (CI mode — skipping TS/build)...');
  } else {
    console.log('🏗️  Validating Screaming Architecture...');
  }
  console.log('⚠️   Recordatorio: este validador es para REFACTOR estructural.');
  console.log('    NO mutiles componentes ni cambies UI para silenciar violaciones.');
  console.log('    Si un fix implica quitar props visuales, arregla el TIPO, no el componente.\n');

  const allValidations = [
    { name: 'TypeScript Compilation', fn: validateTypeScriptCompilation, skipInCI: true },
    { name: 'Build Validation',       fn: validateBuild,                 skipInCI: true },
    { name: 'Feature Organization',   fn: validateFeatureOrganization },
    { name: 'Routes Logic',           fn: validateRoutesLogic },
    { name: 'Naming Conventions',     fn: validateNamingConventions },
    { name: 'Shared Organization',    fn: validateSharedOrganization },
    { name: 'Component Sizes',        fn: validateComponentSizes },
    { name: 'Component Logic Weight', fn: validateComponentLogicWeight },
    { name: 'Component Organization', fn: validateComponentOrganization },
    { name: 'Import Depth',           fn: validateImportDepth },
    { name: 'Cross-Domain Imports',   fn: validateCrossDomainImports },
    { name: 'Prop Drilling',          fn: validatePropDrilling },
    { name: 'Business Logic in Components', fn: validateBusinessLogicInComponents },
    { name: 'Semantic Naming',        fn: validateSemanticNaming }
  ];

  const validations = CI_MODE
    ? allValidations.filter(v => !v.skipInCI)
    : allValidations;

  let totalErrors = 0;
  let totalWarnings = 0;
  const results = [];

  for (const validation of validations) {
    console.log(`🔍 Checking ${validation.name}...`);
    const findings = normalizeFindings(validation.fn());
    const errors = findings.filter(f => f.severity === 'error');
    const warnings = findings.filter(f => f.severity === 'warning');

    results.push({ name: validation.name, errors: errors.length, warnings: warnings.length });
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`   ✅ No issues found`);
    } else {
      if (errors.length > 0) console.log(`   ❌ ${errors.length} error(s)`);
      if (warnings.length > 0) console.log(`   ⚠️  ${warnings.length} warning(s)`);
      errors.forEach(e => console.log(`      ❌ ${e.message}`));
      warnings.forEach(w => console.log(`      ⚠️  ${w.message}`));
    }
    console.log('');
  }

  // Summary
  console.log('📊 VALIDATION SUMMARY');
  console.log(''.padEnd(50, '='));
  results.forEach(r => {
    const parts = [];
    if (r.errors > 0) parts.push(`❌ ${r.errors} error(s)`);
    if (r.warnings > 0) parts.push(`⚠️  ${r.warnings} warning(s)`);
    const status = parts.length === 0 ? '✅ clean' : parts.join(', ');
    console.log(`${r.name}: ${status}`);
  });

  console.log('');
  console.log(`Errors: ${totalErrors} · Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n🚨 Architecture validation FAILED');
    console.log('Please fix the errors above before proceeding.');
    console.log('\n💡 SUGGESTIONS:');
    console.log('• Move HTTP calls (fetch) into domain client modules (e.g. domain/<feature>/<feature>-client.ts)');
    console.log('• Move class definitions into stores (.svelte.ts) or service modules');
    console.log('• Move component files from routes/ to appropriate feature/shared directories');
    console.log('• Use kebab-case for files and PascalCase for Svelte components');
    console.log('• Break down large files into smaller, focused modules');
    process.exit(1);
  }

  if (totalWarnings > 0) {
    console.log('\n✅ Architecture validation PASSED (with warnings)');
    console.log('Considera atender los warnings cuando puedas — no rompen el build.');
    process.exit(0);
  }

  console.log('\n🎉 Architecture validation PASSED');
  console.log('Your codebase follows Screaming Architecture principles!');
  process.exit(0);
}

// Run validation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateArchitecture();
}

export { validateArchitecture, CONFIG };