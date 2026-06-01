import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendValidationError } from '../lib/validation.js';

const schema = z.object({
  hospitalName: z.string().trim().min(1, 'Hospital name is required').optional(),
  contact: z.string().optional(),
  email: z
    .union([z.string().email('Enter a valid email address'), z.literal('')])
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  tagline: z.string().optional(),
  currency: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
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
    if (!parsed.success) return sendValidationError(reply, parsed.error);

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
