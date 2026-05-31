import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { optionalPakMobile, normalizePhoneField } from '../lib/pakistan-inputs.js';

const schema = z.object({
  name: z.string().min(1),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  contact: optionalPakMobile('Contact'),
  email: z.string().optional(),
  fee: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

type DoctorBody = z.infer<typeof schema>;

function toCreateData(data: DoctorBody): Prisma.DoctorUncheckedCreateInput {
  return {
    name: data.name,
    qualification: data.qualification,
    specialization: data.specialization,
    departmentId: data.departmentId ?? undefined,
    contact: normalizePhoneField(data.contact),
    email: data.email,
    fee: data.fee,
    isActive: data.isActive,
  };
}

function toUpdateData(data: Partial<DoctorBody>): Prisma.DoctorUncheckedUpdateInput {
  const out: Prisma.DoctorUncheckedUpdateInput = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.qualification !== undefined) out.qualification = data.qualification;
  if (data.specialization !== undefined) out.specialization = data.specialization;
  if (data.departmentId !== undefined) out.departmentId = data.departmentId;
  if (data.contact !== undefined) out.contact = normalizePhoneField(data.contact);
  if (data.email !== undefined) out.email = data.email;
  if (data.fee !== undefined) out.fee = data.fee;
  if (data.isActive !== undefined) out.isActive = data.isActive;
  return out;
}

export const doctorRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return prisma.doctor.findMany({
      include: { department: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  });

  app.post('/', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const doctor = await prisma.doctor.create({ data: toCreateData(parsed.data) });
    return reply.code(201).send(doctor);
  });

  app.patch('/:id', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    try {
      const doctor = await prisma.doctor.update({
        where: { id },
        data: toUpdateData(parsed.data),
        include: { department: { select: { name: true, code: true } } },
      });
      return doctor;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2025') return reply.code(404).send({ error: 'Doctor not found' });
      return reply.code(400).send({ error: 'Could not update doctor' });
    }
  });

  app.delete(
    '/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        await prisma.$transaction([
          prisma.appointment.updateMany({
            where: { doctorId: id },
            data: { doctorId: null },
          }),
          prisma.doctor.delete({ where: { id } }),
        ]);
        reply.code(204).send();
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === 'P2025') {
          reply.code(404).send({ error: 'Doctor not found' });
          return;
        }
        reply.code(409).send({ error: 'Cannot delete this doctor.' });
      }
    }
  );
};
