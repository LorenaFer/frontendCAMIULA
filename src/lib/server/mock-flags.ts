// ============================================================
// Control de mock POR MÓDULO
//
// Cada módulo tiene su propia variable de entorno.
// Cuando el endpoint de un módulo esté listo en FastAPI,
// cambiar su flag a 'false' en .env — sin afectar los demás.
//
// .env de desarrollo (todos en mock):
//   MOCK_PACIENTES=true
//   MOCK_DOCTORES=true
//   MOCK_CITAS=true
//   MOCK_HISTORIAS=true
//
// Cuando el endpoint de doctores esté listo:
//   MOCK_DOCTORES=false
// ============================================================

import { env } from '$env/dynamic/private';

// Default: mock activo si la variable no está definida como 'false'
export const mockFlags = {
	pacientes: env.MOCK_PACIENTES !== 'false',
	doctores: env.MOCK_DOCTORES !== 'false',
	citas: env.MOCK_CITAS !== 'false',
	historias: env.MOCK_HISTORIAS !== 'false'
} as const;
