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
//   MOCK_INVENTORY_MEDICATIONS=true
//   MOCK_INVENTORY_SUPPLIERS=true
//   MOCK_INVENTORY_PURCHASE_ORDERS=true
//   MOCK_INVENTORY_BATCHES=true
//   MOCK_INVENTORY_PRESCRIPTIONS=true
//   MOCK_INVENTORY_DISPATCHES=true
//   MOCK_INVENTORY_LIMITS=true
//   MOCK_INVENTORY_REPORTS=true
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
	historias: env.MOCK_HISTORIAS !== 'false',
	schemas: env.MOCK_SCHEMAS !== 'false',
	// Inventario — granular por sub-módulo para corte progresivo
	inventoryMedications: env.MOCK_INVENTORY_MEDICATIONS !== 'false',
	inventorySuppliers: env.MOCK_INVENTORY_SUPPLIERS !== 'false',
	inventoryPurchaseOrders: env.MOCK_INVENTORY_PURCHASE_ORDERS !== 'false',
	inventoryBatches: env.MOCK_INVENTORY_BATCHES !== 'false',
	inventoryPrescriptions: env.MOCK_INVENTORY_PRESCRIPTIONS !== 'false',
	inventoryDispatches: env.MOCK_INVENTORY_DISPATCHES !== 'false',
	inventoryLimits: env.MOCK_INVENTORY_LIMITS !== 'false',
	inventoryReports: env.MOCK_INVENTORY_REPORTS !== 'false'
} as const;
