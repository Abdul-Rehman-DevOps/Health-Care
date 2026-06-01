import {
  AUTH_STORAGE_KEY,
  clearAuthStorage,
  notifySessionExpired,
} from './auth-session.js';
import { parseApiErrorBody } from './validation-errors.js';

const API = '/api';

type RequestOptions = {
  /** Attach stored JWT when present (default true). Set false for login. */
  auth?: boolean;
};

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { token: string }).token;
  } catch {
    return null;
  }
}

function isLoginPath(path: string) {
  return path === '/auth/login' || path.endsWith('/auth/login');
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: RequestOptions
): Promise<T> {
  const useAuth = options?.auth !== false;
  const token = useAuth ? getToken() : null;
  const hadToken = !!token;
  const hasBody = init?.body != null && init.body !== '';
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    const body = await res.json().catch(() => ({ error: res.statusText }));

    if (isLoginPath(path)) {
      throw parseApiErrorBody(body);
    }

    if (hadToken) {
      clearAuthStorage();
      notifySessionExpired();
      throw new Error(
        typeof body.error === 'string' && body.error
          ? body.error
          : 'Session expired. Please sign in again.'
      );
    }

    throw parseApiErrorBody(body);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw parseApiErrorBody(err);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: AuthUser }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        },
        { auth: false }
      ),
  },
  branding: {
    get: () => request<HospitalBranding>('/branding'),
  },
  dashboard: () =>
    request<{
      patients: number;
      doctors: number;
      appointmentsToday: number;
      drugs: number;
      lowStock: number;
      hospitalName: string;
    }>('/dashboard/stats'),
  settings: {
    get: () => request<HospitalSettings>('/settings'),
    update: (data: Record<string, unknown>) =>
      request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  users: {
    list: () => request<AppUser[]>('/users'),
    create: (data: NewAppUser) =>
      request<AppUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (id: string, password: string) =>
      request<{ ok: boolean; message: string }>(`/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      }),
    delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  },
  patients: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return request<{ items: Patient[]; total: number }>(
        `/patients${qs ? `?${qs}` : ''}`
      );
    },
    get: (id: string) => request<Patient>(`/patients/${id}`),
    create: (data: NewPatient) =>
      request<Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<NewPatient>) =>
      request<Patient>(`/patients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/patients/${id}`, { method: 'DELETE' }),
  },
  doctors: {
    list: () => request<Doctor[]>('/doctors'),
    create: (data: NewDoctor) =>
      request<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<NewDoctor>) =>
      request<Doctor>(`/doctors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/doctors/${id}`, { method: 'DELETE' }),
  },
  departments: {
    list: () => request<Department[]>('/departments'),
    create: (data: NewDepartment) =>
      request<Department>('/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<NewDepartment>) =>
      request<Department>(`/departments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/departments/${id}`, { method: 'DELETE' }),
  },
  appointments: {
    list: (date?: string) =>
      request<Appointment[]>(`/appointments${date ? `?date=${date}` : ''}`),
    create: (data: NewAppointment) =>
      request<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateAppointment) =>
      request<Appointment>(`/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/appointments/${id}`, { method: 'DELETE' }),
  },
  drugs: {
    list: (search?: string) =>
      request<Drug[]>(`/drugs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    create: (data: NewDrug) =>
      request<Drug>('/drugs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<NewDrug>) =>
      request<Drug>(`/drugs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateStock: (id: string, stockQuantity: number) =>
      request<Drug>(`/drugs/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stockQuantity }),
      }),
    delete: (id: string) => request(`/drugs/${id}`, { method: 'DELETE' }),
  },
};

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
};

export type AppUser = AuthUser;

export type NewAppUser = {
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'user';
};

export type HospitalBranding = {
  hospitalName: string;
  tagline: string | null;
};

export type HospitalSettings = HospitalBranding & {
  id: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  currency: string;
};

export type Patient = {
  id: string;
  patientId: string;
  name: string;
  fatherName: string | null;
  age: number | null;
  gender: string | null;
  contact: string | null;
  emergencyContact: string | null;
  address: string | null;
  bloodGroup: string | null;
  cnic: string | null;
  allergies: string | null;
  notes: string | null;
  createdAt: string;
};

export type NewPatient = {
  name: string;
  fatherName?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  contact?: string;
  emergencyContact?: string;
  address?: string;
  bloodGroup?: string;
  cnic?: string;
  allergies?: string;
  notes?: string;
};

export type Doctor = {
  id: string;
  name: string;
  qualification: string | null;
  specialization: string | null;
  contact: string | null;
  departmentId: string | null;
  fee: string | number;
  department?: { name: string; code: string } | null;
};

export type NewDoctor = {
  name: string;
  qualification?: string;
  specialization?: string;
  departmentId?: string;
  contact?: string;
  fee?: number;
};

export type Department = {
  id: string;
  name: string;
  code: string;
  color: string;
  description?: string | null;
};

export type NewDepartment = {
  name: string;
  code: string;
  description?: string;
  color?: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string | null;
  departmentId: string | null;
  appointmentDate: string;
  appointmentTime: string | null;
  status: string;
  notes: string | null;
  patient: { name: string; patientId: string };
  doctor: { name: string } | null;
  department?: { name: string } | null;
};

export type NewAppointment = {
  patientId: string;
  doctorId?: string;
  departmentId?: string;
  appointmentDate: string;
  appointmentTime?: string;
  notes?: string;
  status?: string;
  type?: string;
};

export type UpdateAppointment = Partial<NewAppointment>;

export type Drug = {
  id: string;
  name: string;
  genericName: string | null;
  category: string | null;
  salePrice: string | number;
  stockQuantity: number;
  reorderLevel: number;
};

export type NewDrug = {
  name: string;
  genericName?: string;
  brand?: string;
  category?: string;
  stockQuantity?: number;
  reorderLevel?: number;
  salePrice?: number;
};
