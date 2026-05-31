import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  validateAppointmentBooking,
  validateExistingAppointmentUpdate,
} from '../lib/appointment-rules.js';
import { normalizeAppointmentTime, parseAppointmentDate } from '../lib/pakistan-time.js';
import { sendValidationError } from '../lib/validation.js';

const schema = z.object({
  patientId: z.string().uuid('Patient is required'),
  doctorId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  appointmentDate: z.string().trim().min(1, 'Appointment date is required'),
  appointmentTime: z.string().trim().min(1, 'Appointment time is required'),
  status: z.string().optional(),
  type: z.string().optional(),
  fee: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const updateSchema = schema.partial().extend({
  appointmentDate: z.string().optional(),
});

export const appointmentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const q = req.query as { date?: string };
    const where = q.date
      ? { appointmentDate: parseAppointmentDate(q.date) }
      : undefined;

    return prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { name: true, patientId: true } },
        doctor: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: [{ appointmentDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  });

  app.post('/', async (req, reply) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    const ruleError = await validateAppointmentBooking({
      appointmentDate: parsed.data.appointmentDate,
      appointmentTime: parsed.data.appointmentTime,
    });
    if (ruleError) {
      return reply.code(400).send({
        error: ruleError.message,
        fields: { [ruleError.field]: ruleError.message },
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...parsed.data,
        appointmentDate: parseAppointmentDate(parsed.data.appointmentDate),
        appointmentTime: normalizeAppointmentTime(parsed.data.appointmentTime),
      },
      include: {
        patient: { select: { name: true, patientId: true } },
        doctor: { select: { name: true } },
      },
    });
    return reply.code(201).send(appointment);
  });

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    const ruleError = await validateExistingAppointmentUpdate(id, parsed.data);
    if (ruleError) {
      return reply.code(400).send({
        error: ruleError.message,
        fields: { [ruleError.field]: ruleError.message },
      });
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.appointmentDate) {
      data.appointmentDate = parseAppointmentDate(parsed.data.appointmentDate);
    }
    if (parsed.data.appointmentTime) {
      data.appointmentTime = normalizeAppointmentTime(parsed.data.appointmentTime);
    }

    try {
      const appointment = await prisma.appointment.update({
        where: { id },
        data,
        include: {
          patient: { select: { name: true, patientId: true } },
          doctor: { select: { name: true } },
          department: { select: { name: true } },
        },
      });
      return appointment;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2025') return reply.code(404).send({ error: 'Appointment not found' });
      return reply.code(400).send({ error: 'Could not update appointment' });
    }
  });

  app.delete(
    '/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        await prisma.appointment.delete({ where: { id } });
        reply.code(204).send();
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === 'P2025') {
          reply.code(404).send({ error: 'Appointment not found' });
          return;
        }
        reply.code(409).send({ error: 'Cannot delete appointment' });
      }
    }
  );
};
