import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { nextPatientId } from '../lib/patient-id.js';
import {
  isValidCnic,
  normalizeEmergencyContactField,
  normalizePhoneField,
  optionalPhoneOrName,
  requiredPakMobile,
} from '../lib/pakistan-inputs.js';
import { sendValidationError } from '../lib/validation.js';

function formatCnicStored(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 13);
  if (d.length !== 13) return raw.trim();
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required'),
  fatherName: z.string().trim().min(1, 'Guardian name is required'),
  age: z
    .number({
      required_error: 'Age is required',
      invalid_type_error: 'Age is required',
    })
    .int('Age must be a whole number')
    .positive('Age must be greater than 0'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  contact: requiredPakMobile('Contact'),
  emergencyContact: optionalPhoneOrName('Emergency contact'),
  address: z.string().trim().min(1, 'Address is required'),
  bloodGroup: z.string().optional(),
  cnic: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || isValidCnic(v), {
      message: 'CNIC must be exactly 13 numbers only (e.g. 12345-6789123-4)',
    }),
  allergies: z.string().trim().min(1, 'Illness / condition is required'),
  notes: z.string().optional(),
});

function normalizePatientFields(data: Partial<z.infer<typeof createSchema>>) {
  const out = { ...data };
  if (data.cnic?.trim()) out.cnic = formatCnicStored(data.cnic);
  if (data.contact?.trim()) out.contact = normalizePhoneField(data.contact);
  if (data.emergencyContact?.trim()) {
    out.emergencyContact = normalizeEmergencyContactField(data.emergencyContact);
  }
  return out;
}

function normalizePatientInput(data: z.infer<typeof createSchema>) {
  return normalizePatientFields(data) as z.infer<typeof createSchema>;
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
      return sendValidationError(reply, parsed.error);
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
      return sendValidationError(reply, parsed.error);
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
