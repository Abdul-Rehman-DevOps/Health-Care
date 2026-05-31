import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(10),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const departmentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  });

  app.post('/', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.flatten() });
      return;
    }
    try {
      const department = await prisma.department.create({
        data: {
          name: parsed.data.name,
          code: parsed.data.code.toUpperCase(),
          description: parsed.data.description,
          color: parsed.data.color ?? '#0D9488',
        },
      });
      reply.code(201).send(department);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2002') {
        reply.code(409).send({ error: 'Department code already exists' });
        return;
      }
      reply.code(500).send({ error: 'Could not create department' });
    }
  });

  app.patch('/:id', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.flatten() });
      return;
    }
    try {
      const data = {
        ...parsed.data,
        ...(parsed.data.code ? { code: parsed.data.code.toUpperCase() } : {}),
      };
      const department = await prisma.department.update({
        where: { id },
        data,
      });
      return department;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2025') return reply.code(404).send({ error: 'Department not found' });
      if (code === 'P2002') return reply.code(409).send({ error: 'Department code already exists' });
      return reply.code(400).send({ error: 'Could not update department' });
    }
  });

  app.delete(
    '/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        await prisma.$transaction([
          prisma.doctor.updateMany({
            where: { departmentId: id },
            data: { departmentId: null },
          }),
          prisma.appointment.updateMany({
            where: { departmentId: id },
            data: { departmentId: null },
          }),
          prisma.department.update({
            where: { id },
            data: { isActive: false },
          }),
        ]);
        reply.code(204).send();
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === 'P2025') {
          reply.code(404).send({ error: 'Department not found' });
          return;
        }
        reply.code(409).send({ error: 'Cannot delete department' });
      }
    }
  );
};
