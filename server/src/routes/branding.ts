import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const brandingRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const settings = await prisma.hospitalSettings.findFirst();
    return {
      hospitalName: settings?.hospitalName ?? 'Health Care',
      tagline: settings?.tagline ?? 'Hospital Management System',
    };
  });
};
