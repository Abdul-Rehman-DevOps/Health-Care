import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const schema = z.object({
  name: z.string().min(1),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  contact: z.string().optional(),
  email: z.string().optional(),
  fee: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const doctorRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return prisma.doctor.findMany({
      include: { department: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  });

  app.post('/', async (req, reply) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const doctor = await prisma.doctor.create({ data: parsed.data });
    return reply.code(201).send(doctor);
  });

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    try {
      const doctor = await prisma.doctor.update({
        where: { id },
        data: parsed.data,
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
