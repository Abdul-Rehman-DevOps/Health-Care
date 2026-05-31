import { prisma } from './prisma.js';
import {
  formatAppointmentDate,
  isPastAppointment,
  normalizeAppointmentTime,
  parseAppointmentDate,
} from './pakistan-time.js';

export type AppointmentRuleFailure = {
  message: string;
  field: 'appointmentDate' | 'appointmentTime';
};

export async function findAppointmentConflict(params: {
  appointmentDate: Date;
  appointmentTime: string;
  excludeId?: string;
}) {
  return prisma.appointment.findFirst({
    where: {
      appointmentDate: params.appointmentDate,
      appointmentTime: normalizeAppointmentTime(params.appointmentTime),
      status: { not: 'Cancelled' },
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    include: {
      patient: { select: { name: true, patientId: true } },
    },
  });
}

export async function validateAppointmentBooking(params: {
  appointmentDate: string;
  appointmentTime?: string | null;
  excludeId?: string;
}): Promise<AppointmentRuleFailure | null> {
  const dateStr = params.appointmentDate.trim();
  const timeStr = params.appointmentTime?.trim();

  if (!timeStr) {
    return {
      field: 'appointmentTime',
      message: 'Appointment time is required',
    };
  }

  if (isPastAppointment(dateStr, timeStr)) {
    return {
      field: 'appointmentTime',
      message: 'Cannot book an appointment in the past (Pakistan time)',
    };
  }

  const conflict = await findAppointmentConflict({
    appointmentDate: parseAppointmentDate(dateStr),
    appointmentTime: timeStr,
    excludeId: params.excludeId,
  });

  if (conflict) {
    return {
      field: 'appointmentTime',
      message: `Another patient (${conflict.patient.name}) already has an appointment at this time`,
    };
  }

  return null;
}

export async function validateExistingAppointmentUpdate(
  id: string,
  data: {
    appointmentDate?: string;
    appointmentTime?: string | null;
  }
): Promise<AppointmentRuleFailure | null> {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) return null;

  const dateStr = data.appointmentDate?.trim() ?? formatAppointmentDate(existing.appointmentDate);
  const timeChanged = data.appointmentTime !== undefined;
  const dateChanged = data.appointmentDate !== undefined;
  const timeStr = timeChanged
    ? data.appointmentTime?.trim() ?? ''
    : existing.appointmentTime?.trim() ?? '';

  if (!timeStr) {
    return {
      field: 'appointmentTime',
      message: 'Appointment time is required',
    };
  }

  if ((timeChanged || dateChanged) && isPastAppointment(dateStr, timeStr)) {
    return {
      field: 'appointmentTime',
      message: 'Cannot book an appointment in the past (Pakistan time)',
    };
  }

  if (timeChanged || dateChanged) {
    const conflict = await findAppointmentConflict({
      appointmentDate: parseAppointmentDate(dateStr),
      appointmentTime: timeStr,
      excludeId: id,
    });

    if (conflict) {
      return {
        field: 'appointmentTime',
        message: `Another patient (${conflict.patient.name}) already has an appointment at this time`,
      };
    }
  }

  return null;
}
