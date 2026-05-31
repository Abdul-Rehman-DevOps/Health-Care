import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { nextPatientId } from '../lib/patient-id.js';

const createSchema = z.object({
  name: z.string().min(1),
  fatherName: z.string().optional(),
  age: z.number().int().positive().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  contact: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  cnic: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

export const patientRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const q = req.query as { search?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 25));
    const skip = (page - 1) * limit;
    const search = q.search?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { patientId: { contains: search, mode: 'insensitive' as const } },
            { contact: { contains: search, mode: 'insensitive' as const } },
            { cnic: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return reply.code(404).send({ error: 'Patient not found' });
    return patient;
  });

  app.post('/', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const patientId = await nextPatientId();
    const patient = await prisma.patient.create({
      data: { ...parsed.data, patientId },
    });
    return reply.code(201).send(patient);
  });

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    try {
      const patient = await prisma.patient.update({
        where: { id },
        data: parsed.data,
      });
      return patient;
    } catch {
      return reply.code(404).send({ error: 'Patient not found' });
    }
  });

  app.delete(
    '/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        await prisma.$transaction([
          prisma.appointment.deleteMany({ where: { patientId: id } }),
          prisma.patient.delete({ where: { id } }),
        ]);
        reply.code(204).send();
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === 'P2025') {
          reply.code(404).send({ error: 'Patient not found' });
          return;
        }
        reply.code(409).send({
          error: 'Cannot delete this patient. Remove linked records first.',
        });
      }
    }
  );
};
