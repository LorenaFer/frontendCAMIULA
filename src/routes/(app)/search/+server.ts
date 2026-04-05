import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPermission, P } from '$shared/rbac-config.js';
import type { AuthUser } from '$shared/types/auth.js';
import * as pacientesService from '$lib/server/pacientes.service.js';
import * as citasService from '$lib/server/citas.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';
import * as medicationsService from '$lib/server/inventory/medications.service.js';
import * as suppliersService from '$lib/server/inventory/suppliers.service.js';
import * as usersService from '$lib/server/users.service.js';

interface SearchResultItem {
	id: string;
	title: string;
	subtitle?: string;
	href?: string;
	tag?: string;
	tagVariant?: 'default' | 'success' | 'warning' | 'danger';
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q || q.length < 2) return json({ categories: [] });

	const user = locals.user as AuthUser | null;
	const role = user?.role ?? 'paciente';
	const categories: Array<{ label: string; results: SearchResultItem[] }> = [];

	// Todas las búsquedas en paralelo (solo las que el rol puede ver)
	const promises: Array<Promise<void>> = [];

	// ── Pacientes (PACIENTES_READ) ──
	if (hasPermission(role, P.PACIENTES_READ)) {
		promises.push(
			pacientesService.getPacientesPaginated({ search: q, page: 1, page_size: 5 })
				.then(res => {
					if (res.items.length > 0) {
						categories.push({
							label: 'Pacientes',
							results: res.items.map(p => ({
								id: p.id,
								title: `${p.nombre} ${p.apellido}`,
								subtitle: `NHM ${p.nhm} · ${p.cedula}`,
								href: `/patients/${p.id}`,
								tag: p.es_nuevo ? 'Nuevo' : undefined,
								tagVariant: 'warning' as const
							}))
						});
					}
				}).catch(() => {})
		);
	}

	// ── Citas (CITAS_READ) ──
	if (hasPermission(role, P.CITAS_READ)) {
		promises.push(
			citasService.getCitasByFilters({ search: q, page_size: 5 })
				.then(res => {
					if (res.items.length > 0) {
						const statusTags: Record<string, { tag: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
							pendiente: { tag: 'Pendiente', variant: 'warning' },
							confirmada: { tag: 'Confirmada', variant: 'default' },
							atendida: { tag: 'Atendida', variant: 'success' },
							cancelada: { tag: 'Cancelada', variant: 'danger' },
							no_asistio: { tag: 'No asistió', variant: 'danger' }
						};
						categories.push({
							label: 'Citas',
							results: res.items.slice(0, 5).map(c => {
								const st = statusTags[c.estado] ?? { tag: c.estado, variant: 'default' as const };
								return {
									id: c.id,
									title: `${c.paciente.nombre} ${c.paciente.apellido}`,
									subtitle: `${c.fecha} · ${c.hora_inicio} · ${c.doctor?.especialidad?.nombre ?? ''}`,
									href: role === 'doctor' ? `/doctor/citas/${c.id}` : `/analista/citas?search=${encodeURIComponent(q)}`,
									tag: st.tag,
									tagVariant: st.variant
								};
							})
						});
					}
				}).catch(() => {})
		);
	}

	// ── Doctores (DISPONIBILIDAD_READ) ──
	if (hasPermission(role, P.DISPONIBILIDAD_READ)) {
		promises.push(
			doctoresService.getActiveDoctores()
				.then(docs => {
					const ql = q.toLowerCase();
					const filtered = docs.filter(d =>
						`${d.nombre} ${d.apellido}`.toLowerCase().includes(ql) ||
						d.especialidad?.nombre?.toLowerCase().includes(ql)
					).slice(0, 5);
					if (filtered.length > 0) {
						categories.push({
							label: 'Doctores',
							results: filtered.map(d => ({
								id: d.id,
								title: `Dr. ${d.nombre} ${d.apellido}`,
								subtitle: d.especialidad?.nombre ?? 'Sin especialidad',
								href: role === 'analista' || role === 'admin'
									? `/analista/citas?doctor_id=${d.id}`
									: `/analista/horarios`
							}))
						});
					}
				}).catch(() => {})
		);
	}

	// ── Medicamentos (INVENTORY_READ) ──
	if (hasPermission(role, P.INVENTORY_READ)) {
		promises.push(
			medicationsService.getMedications({ search: q, page: 1, pageSize: 5 })
				.then(res => {
					if (res.data.length > 0) {
						categories.push({
							label: 'Medicamentos',
							results: res.data.map(m => ({
								id: m.id,
								title: m.generic_name,
								subtitle: `${m.code} · ${m.pharmaceutical_form} · Stock: ${m.current_stock}`,
								href: '/inventory/medications',
								tag: m.medication_status === 'active' ? undefined : 'Inactivo',
								tagVariant: 'danger' as const
							}))
						});
					}
				}).catch(() => {})
		);
	}

	// ── Proveedores (INVENTORY_WRITE) ──
	if (hasPermission(role, P.INVENTORY_WRITE)) {
		promises.push(
			suppliersService.getSuppliers(1, 50)
				.then(res => {
					const ql = q.toLowerCase();
					const filtered = res.data.filter(s =>
						s.name.toLowerCase().includes(ql) ||
						s.rif?.toLowerCase().includes(ql) ||
						s.contact_name?.toLowerCase().includes(ql)
					).slice(0, 5);
					if (filtered.length > 0) {
						categories.push({
							label: 'Proveedores',
							results: filtered.map(s => ({
								id: s.id,
								title: s.name,
								subtitle: `${s.rif ?? ''} ${s.contact_name ? `· ${s.contact_name}` : ''}`.trim(),
								href: '/inventory/suppliers'
							}))
						});
					}
				}).catch(() => {})
		);
	}

	// ── Usuarios (SETTINGS_READ — solo admin) ──
	if (hasPermission(role, P.SETTINGS_READ)) {
		promises.push(
			usersService.getUsers(1, 10, { staffOnly: true, search: q })
				.then(res => {
					if (res.items.length > 0) {
						const roleLabels: Record<string, string> = {
							administrador: 'Admin', admin: 'Admin', doctor: 'Doctor',
							analista: 'Analista', farmaceutico: 'Farmacéutico', paciente: 'Paciente'
						};
						categories.push({
							label: 'Usuarios',
							results: res.items.slice(0, 5).map(u => ({
								id: u.id,
								title: u.full_name,
								subtitle: u.email,
								href: '/admin/configuracion',
								tag: u.roles.map(r => roleLabels[r] ?? r).join(', '),
								tagVariant: 'default' as const
							}))
						});
					}
				}).catch(() => {})
		);
	}

	// ── Navegación rápida a módulos (siempre, filtrado por RBAC + query) ──
	const modules: Array<{ title: string; subtitle: string; href: string; keywords: string[]; permission?: string }> = [
		{ title: 'Dashboard', subtitle: 'Panel principal', href: '/', keywords: ['dashboard', 'inicio', 'panel', 'resumen'], permission: P.DASHBOARD_READ },
		{ title: 'Pacientes', subtitle: 'Listado y expedientes', href: '/patients', keywords: ['paciente', 'expediente', 'nhm', 'cedula'] , permission: P.PACIENTES_READ },
		{ title: 'Agendar Cita', subtitle: 'Nueva cita médica', href: '/agendar', keywords: ['agendar', 'nueva cita', 'reservar', 'turno'], permission: P.CITAS_CREATE },
		{ title: 'Gestión de Citas', subtitle: 'Vista de analista', href: '/analista/citas', keywords: ['gestion', 'citas', 'analista', 'agenda'], permission: P.CITAS_CANCEL },
		{ title: 'Horarios Doctores', subtitle: 'Disponibilidad médica', href: '/analista/horarios', keywords: ['horario', 'disponibilidad', 'doctor', 'agenda', 'slot'], permission: P.DISPONIBILIDAD_READ },
		{ title: 'Mis Citas', subtitle: 'Agenda del día', href: '/doctor/citas', keywords: ['mis citas', 'agenda', 'hoy', 'consulta'], permission: P.CITAS_MARK_ATTENDED },
		{ title: 'Mi Disponibilidad', subtitle: 'Gestionar horarios', href: '/doctor/disponibilidad', keywords: ['mi disponibilidad', 'horario', 'bloque'], permission: P.DISPONIBILIDAD_CREATE },
		{ title: 'Inventario', subtitle: 'Resumen de farmacia', href: '/inventory', keywords: ['inventario', 'farmacia', 'stock', 'resumen'], permission: P.INVENTORY_READ },
		{ title: 'Medicamentos', subtitle: 'Catálogo de medicamentos', href: '/inventory/medications', keywords: ['medicamento', 'catalogo', 'farmaco', 'droga'], permission: P.INVENTORY_READ },
		{ title: 'Stock y Lotes', subtitle: 'Control de lotes', href: '/inventory/batches', keywords: ['stock', 'lote', 'batch', 'vencimiento', 'inventario'], permission: P.INVENTORY_READ },
		{ title: 'Despachos', subtitle: 'Despacho de medicamentos', href: '/inventory/dispatches', keywords: ['despacho', 'dispensar', 'entregar'], permission: P.INVENTORY_DISPATCH },
		{ title: 'Proveedores', subtitle: 'Gestión de proveedores', href: '/inventory/suppliers', keywords: ['proveedor', 'supplier', 'compra'], permission: P.INVENTORY_WRITE },
		{ title: 'Órdenes de Compra', subtitle: 'Pedidos a proveedores', href: '/inventory/purchase-orders', keywords: ['orden', 'compra', 'pedido', 'purchase'], permission: P.INVENTORY_WRITE },
		{ title: 'Configuración', subtitle: 'Especialidades y usuarios', href: '/admin/configuracion', keywords: ['configuracion', 'config', 'especialidad', 'usuario', 'admin', 'ajustes'], permission: P.SETTINGS_READ }
	];

	const ql = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	const matchedModules = modules.filter(m => {
		if (m.permission && !hasPermission(role, m.permission)) return false;
		return m.title.toLowerCase().includes(ql) ||
			m.subtitle.toLowerCase().includes(ql) ||
			m.keywords.some(k => k.includes(ql) || ql.includes(k));
	}).slice(0, 5);

	await Promise.all(promises);

	// Agregar módulos al inicio si hay matches
	if (matchedModules.length > 0) {
		categories.unshift({
			label: 'Ir a',
			results: matchedModules.map(m => ({
				id: `nav-${m.href}`,
				title: m.title,
				subtitle: m.subtitle,
				href: m.href,
				tag: 'Módulo',
				tagVariant: 'default' as const
			}))
		});
	}

	// Ordenar categorías (Ir a primero, luego datos)
	const order = ['Ir a', 'Pacientes', 'Citas', 'Doctores', 'Medicamentos', 'Proveedores', 'Usuarios'];
	categories.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));

	return json({ categories });
};
