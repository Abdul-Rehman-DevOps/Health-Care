import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { nextPatientId } from '../lib/patient-id.js';
import { isValidCnic } from '../lib/pakistan-inputs.js';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function pakMobileDigits(raw: string): string {
  let d = digitsOnly(raw);
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return d;
}

function formatCnicStored(raw: string): string {
  const d = digitsOnly(raw).slice(0, 13);
  if (d.length !== 13) return raw.trim();
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

function formatPhoneStored(raw: string): string {
  const d = pakMobileDigits(raw).slice(0, 10);
  if (d.length !== 10) return raw.trim();
  return `+92 ${d.slice(0, 3)}-${d.slice(3)}`;
}

const createSchema = z.object({
  name: z.string().min(1),
  fatherName: z.string().optional(),
  age: z.number().int().positive().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  contact: z
    .string()
    .optional()
    .refine((v) => {
      if (!v?.trim()) return true;
      const d = pakMobileDigits(v);
      return d.length === 10 && d.startsWith('3');
    }, 'Contact must be a valid Pakistani mobile (+92 3XX-XXXXXXX)'),
  emergencyContact: z
    .string()
    .optional()
    .refine((v) => {
      if (!v?.trim()) return true;
      const d = pakMobileDigits(v);
      return d.length === 10 && d.startsWith('3');
    }, 'Emergency contact must be a valid Pakistani mobile (+92 3XX-XXXXXXX)'),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  cnic: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || isValidCnic(v), {
      message: `CNIC must be exactly 13 numbers only (e.g. 12345-6789123-4)`,
    }),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

function normalizePatientInput(data: z.infer<typeof createSchema>) {
  return normalizePatientFields(data) as z.infer<typeof createSchema>;
}

function normalizePatientFields(data: Partial<z.infer<typeof createSchema>>) {
  const out = { ...data };
  if (data.cnic?.trim()) out.cnic = formatCnicStored(data.cnic);
  if (data.contact?.trim()) out.contact = formatPhoneStored(data.contact);
  if (data.emergencyContact?.trim()) {
    out.emergencyContact = formatPhoneStored(data.emergencyContact);
  }
  return out;
}

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
      data: { ...normalizePatientInput(parsed.data), patientId },
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
        data: normalizePatientFields(parsed.data),
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
