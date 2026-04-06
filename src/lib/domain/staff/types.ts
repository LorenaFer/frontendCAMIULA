// ============================================================
// Tipos del Dominio: Médicos y Especialidades
// ============================================================

export interface Especialidad {
	id: string;
	nombre: string;
	activo: boolean;
}

export interface Doctor {
	id: string;
	nombre: string;
	apellido: string;
	especialidad_id: string;
	activo: boolean;
}

export interface DoctorConEspecialidad extends Doctor {
	especialidad: Especialidad;
}

/** Versión reducida para selects/dropdowns — campos snake_case del backend */
export interface DoctorOption {
	id: string;
	nombre_completo: string;
	especialidad: string;
	especialidad_id: string;
	dias_trabajo: number[]; // 1=Lun … 5=Vie (días en que el doctor atiende)
}

export interface DisponibilidadDoctor {
	id: string;
	doctor_id: string;
	/** 1 = Lunes … 5 = Viernes */
	day_of_week: 1 | 2 | 3 | 4 | 5;
	hora_inicio: string; // "08:00"
	hora_fin: string; // "17:00"
	duracion_slot: number; // minutos, default 30
}
