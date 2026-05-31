import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendValidationError } from '../lib/validation.js';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Drug name is required'),
  genericName: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
});

const stockSchema = z.object({
  stockQuantity: z
    .number({
      required_error: 'Stock quantity is required',
      invalid_type_error: 'Stock quantity is required',
    })
    .int('Stock quantity must be a whole number')
    .nonnegative('Stock quantity cannot be negative'),
});

export const drugRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const q = req.query as { search?: string };
    const search = q.search?.trim();
    return prisma.drug.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : { isActive: true },
      orderBy: { name: 'asc' },
      take: 200,
    });
  });

  app.post('/', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    const drug = await prisma.drug.create({ data: parsed.data });
    return reply.code(201).send(drug);
  });

  app.patch('/:id/stock', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = stockSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    try {
      const drug = await prisma.drug.update({
        where: { id },
        data: { stockQuantity: parsed.data.stockQuantity },
      });
      return drug;
    } catch {
      return reply.code(404).send({ error: 'Drug not found' });
    }
  });

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    try {
      const drug = await prisma.drug.update({ where: { id }, data: parsed.data });
      return drug;
    } catch {
      return reply.code(404).send({ error: 'Drug not found' });
    }
  });

  app.delete(
    '/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        await prisma.drug.update({
          where: { id },
          data: { isActive: false },
        });
        reply.code(204).send();
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === 'P2025') {
          reply.code(404).send({ error: 'Drug not found' });
          return;
        }
        reply.code(409).send({ error: 'Cannot remove drug' });
      }
    }
  );
};
