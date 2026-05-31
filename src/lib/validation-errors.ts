import {
  findLocalAppointmentConflict,
  getPakistanDateString,
  isPastAppointment,
  normalizeAppointmentTime,
} from './pakistan-time';

export type ApiValidationFields = Record<string, string>;

export class ApiValidationError extends Error {
  fields?: ApiValidationFields;

  constructor(message: string, fields?: ApiValidationFields) {
    super(message);
    this.name = 'ApiValidationError';
    this.fields = fields;
  }
}

function formatZodFlatten(error: unknown): { message: string; fields: ApiValidationFields } {
  const fields: ApiValidationFields = {};
  if (!error || typeof error !== 'object') {
    return { message: 'Please check the form and try again.', fields };
  }

  const flat = error as {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };

  for (const [key, msgs] of Object.entries(flat.fieldErrors ?? {})) {
    if (msgs?.[0]) fields[key] = msgs[0];
  }

  const parts = [...(flat.formErrors ?? []), ...Object.values(fields)];
  return {
    message: parts.join('. ') || 'Please check the form and try again.',
    fields,
  };
}

export function parseApiErrorBody(body: unknown): ApiValidationError {
  if (!body || typeof body !== 'object') {
    return new ApiValidationError('Request failed');
  }

  const payload = body as {
    error?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
    fields?: ApiValidationFields;
  };

  if (typeof payload.error === 'string') {
    return new ApiValidationError(payload.error, payload.fields);
  }

  if (payload.error && typeof payload.error === 'object') {
    const formatted = formatZodFlatten(payload.error);
    return new ApiValidationError(formatted.message, formatted.fields);
  }

  return new ApiValidationError('Request failed');
}

export function getValidationFields(error: unknown): ApiValidationFields | undefined {
  if (error instanceof ApiValidationError) return error.fields;
  return undefined;
}

export function mergeValidationErrors(
  local: ApiValidationFields,
  error: unknown
): ApiValidationFields {
  return { ...local, ...(getValidationFields(error) ?? {}) };
}

export function requiredField(value: string | undefined, label: string): string | undefined {
  return value?.trim() ? undefined : `${label} is required`;
}

export type PatientFormErrors = Partial<
  Record<
    | 'name'
    | 'fatherName'
    | 'age'
    | 'contact'
    | 'emergencyContact'
    | 'address'
    | 'allergies'
    | 'cnic',
    string
  >
>;

export function validatePatientForm(form: {
  name?: string;
  fatherName?: string;
  age?: number;
  contact?: string;
  emergencyContact?: string;
  address?: string;
  allergies?: string;
  cnic?: string;
}): PatientFormErrors {
  const errors: PatientFormErrors = {};

  if (!form.name?.trim()) errors.name = 'Full name is required';
  if (!form.fatherName?.trim()) errors.fatherName = 'Guardian name is required';
  if (form.age == null || Number.isNaN(form.age) || form.age <= 0) {
    errors.age = 'Age is required';
  }
  if (!form.contact?.trim()) errors.contact = 'Contact is required';
  if (!form.address?.trim()) errors.address = 'Address is required';
  if (!form.allergies?.trim()) errors.allergies = 'Illness / condition is required';

  return errors;
}

export function validateAppointmentForm(params: {
  patientId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  existingAppointments?: Array<{
    id: string;
    appointmentTime?: string | null;
    status: string;
    patient: { name: string };
  }>;
  excludeId?: string | null;
  originalTime?: string | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.excludeId && !params.patientId) errors.patientId = 'Patient is required';
  if (!params.appointmentDate?.trim()) {
    errors.appointmentDate = 'Appointment date is required';
  }
  if (!params.appointmentTime?.trim()) {
    errors.appointmentTime = 'Appointment time is required';
  }

  if (
    params.appointmentDate &&
    params.appointmentTime &&
    !errors.appointmentDate &&
    !errors.appointmentTime
  ) {
    const timeUnchanged =
      !!params.excludeId &&
      !!params.originalTime &&
      !!params.appointmentTime &&
      normalizeAppointmentTime(params.originalTime) ===
        normalizeAppointmentTime(params.appointmentTime);

    if (params.appointmentDate < getPakistanDateString()) {
      errors.appointmentDate = 'Cannot book an appointment in the past (Pakistan time)';
    } else if (
      !timeUnchanged &&
      isPastAppointment(params.appointmentDate, params.appointmentTime)
    ) {
      errors.appointmentTime = 'Cannot book an appointment in the past (Pakistan time)';
    } else if (params.existingAppointments && (!params.excludeId || !timeUnchanged)) {
      const conflict = findLocalAppointmentConflict(
        params.existingAppointments,
        params.appointmentTime,
        params.excludeId
      );
      if (conflict) {
        errors.appointmentTime = `Another patient (${conflict.patient.name}) already has an appointment at this time`;
      }
    }
  }

  return errors;
}
