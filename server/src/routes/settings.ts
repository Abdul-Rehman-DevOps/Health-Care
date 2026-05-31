import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const schema = z.object({
  hospitalName: z.string().min(1).optional(),
  contact: z.string().optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  tagline: z.string().optional(),
  currency: z.string().optional(),
});

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    let settings = await prisma.hospitalSettings.findFirst();
    if (!settings) {
      settings = await prisma.hospitalSettings.create({
        data: { hospitalName: 'Health Care' },
      });
    }
    return settings;
  });

  app.patch('/', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const existing = await prisma.hospitalSettings.findFirst();
    if (!existing) {
      const created = await prisma.hospitalSettings.create({
        data: { hospitalName: 'Health Care', ...parsed.data },
      });
      return created;
    }

    return prisma.hospitalSettings.update({
      where: { id: existing.id },
      data: parsed.data,
    });
  });
};
