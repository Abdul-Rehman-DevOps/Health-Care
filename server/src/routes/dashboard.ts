import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stats', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      patients,
      doctors,
      appointmentsToday,
      drugs,
      lowStock,
      settings,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
          status: { not: 'Cancelled' },
        },
      }),
      prisma.drug.count({ where: { isActive: true } }),
      prisma.drug.count({
        where: { isActive: true, stockQuantity: { lte: 10 } },
      }),
      prisma.hospitalSettings.findFirst(),
    ]);

    return {
      patients,
      doctors,
      appointmentsToday,
      drugs,
      lowStock,
      hospitalName: settings?.hospitalName ?? 'Health Care',
    };
  });
};
