#!/usr/bin/env node
// ============================================================
// Genera la estructura de un nuevo dominio de negocio.
// Uso: node scripts/new-feature.js <nombre-dominio>
// Ejemplo: node scripts/new-feature.js laboratory
// ============================================================

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];

if (!name) {
	console.error('Uso: node scripts/new-feature.js <nombre-dominio>');
	console.error('Ejemplo: node scripts/new-feature.js laboratory');
	process.exit(1);
}

const kebab = name.toLowerCase().replace(/\s+/g, '-');
const pascal = kebab
	.split('-')
	.map((w) => w[0].toUpperCase() + w.slice(1))
	.join('');

const BASE = join(__dirname, '..');
const domainDir = join(BASE, 'src/lib/domain', kebab);
const componentsDir = join(domainDir, 'components');
const serverDir = join(BASE, 'src/lib/server', kebab);

for (const dir of [domainDir, componentsDir, serverDir]) {
	if (existsSync(dir)) {
		console.error(`Ya existe: ${dir}`);
		process.exit(1);
	}
	mkdirSync(dir, { recursive: true });
}

// Domain types
writeFileSync(
	join(domainDir, 'types.ts'),
	`// ============================================================
// Tipos del Dominio: ${pascal}
// Contrato compartido entre servicios server y componentes UI.
// ============================================================

// TODO: Definir tipos del dominio
`
);

// Server service
writeFileSync(
	join(serverDir, `${kebab}.service.ts`),
	`import { mockFlags } from '../mock-flags.js';
import { apiFetch } from '../api.js';
// import type { ... } from '$domain/${kebab}/types.js';

// TODO: Implementar servicio ${pascal}
`
);

// Server mappers
writeFileSync(
	join(serverDir, `${kebab}.mappers.ts`),
	`// ============================================================
// Mappers: ${pascal} — Backend (English) <-> Frontend (Spanish)
// ============================================================

type AnyRecord = Record<string, unknown>;

// TODO: Implementar mappers
`
);

console.log(`\nDominio "${kebab}" creado:\n`);
console.log(`  Tipos:       src/lib/domain/${kebab}/types.ts`);
console.log(`  Componentes: src/lib/domain/${kebab}/components/`);
console.log(`  Servicio:    src/lib/server/${kebab}/${kebab}.service.ts`);
console.log(`  Mappers:     src/lib/server/${kebab}/${kebab}.mappers.ts`);
console.log(`\nSiguientes pasos:`);
console.log(`  1. Definir tipos en domain/${kebab}/types.ts`);
console.log(`  2. Implementar servicio en server/${kebab}/${kebab}.service.ts`);
console.log(`  3. Crear componentes en domain/${kebab}/components/`);
console.log(`  4. Crear rutas en src/routes/(app)/${kebab}/`);
console.log(`  5. Agregar mock flag en server/mock-flags.ts`);
console.log(`  6. Agregar permisos en server/rbac.ts y shared/rbac-config.ts`);
