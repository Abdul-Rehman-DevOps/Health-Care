import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { toNumber } from '../lib/serialize.js';

export const labTestRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const q = req.query as { search?: string };
    const search = q.search?.trim();
    const items = await prisma.labTest.findMany({
      where: search
        ? {
            isActive: true,
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : { isActive: true },
      orderBy: { name: 'asc' },
      take: 200,
    });
    return items.map((t) => ({
      ...t,
      price: toNumber(t.price),
    }));
  });
};
