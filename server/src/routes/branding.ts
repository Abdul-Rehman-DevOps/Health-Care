import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const brandingRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const settings = await prisma.hospitalSettings.findFirst();
    return {
      hospitalName: settings?.hospitalName ?? 'LifeCare Hospital',
      tagline: settings?.tagline ?? 'Caring for Life',
      logoUrl: settings?.logoUrl ?? '/hospital-logo-brand.png',
      contact: settings?.contact ?? null,
      email: settings?.email ?? null,
      address: settings?.address ?? null,
      city: settings?.city ?? null,
    };
  });
};
