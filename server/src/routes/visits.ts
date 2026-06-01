import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { nextCounterValue } from '../lib/counter.js';
import { nextPatientId } from '../lib/patient-id.js';
import { toNumber } from '../lib/serialize.js';
import {
  normalizePhoneField,
  requiredPakMobile,
} from '../lib/pakistan-inputs.js';
import { sendValidationError } from '../lib/validation.js';
import {
  pakistanDayRange,
  pakistanDayStart,
  pakistanDayEndExclusive,
} from '../lib/pakistan-time.js';

const lineSchema = z.object({
  lineType: z.enum(['drug', 'lab', 'custom']),
  drugId: z.string().uuid().optional().nullable(),
  labTestId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, 'Item name is required'),
  dosage: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative().default(0),
});

const quickPatientSchema = z.object({
  name: z.string().trim().min(1, 'Patient name is required'),
  contact: requiredPakMobile('Phone number'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  age: z.number().int().positive().optional(),
  fatherName: z.string().optional(),
});

const createVisitSchema = z.object({
  patientId: z.string().uuid().optional(),
  newPatient: quickPatientSchema.optional(),
  doctorId: z.string().uuid().optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  bloodPressure: z.string().optional().nullable(),
  temperature: z.number().positive().optional().nullable(),
  bloodSugar: z.number().positive().optional().nullable(),
  pulse: z.number().int().positive().optional().nullable(),
  spo2: z.number().int().min(0).max(100).optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  advice: z.string().optional().nullable(),
  consultationFee: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  isPaid: z.boolean().optional(),
  lines: z.array(lineSchema).default([]),
});

function mapVisit(v: Awaited<ReturnType<typeof loadVisit>>) {
  if (!v) return null;
  return {
    ...v,
    consultationFee: toNumber(v.consultationFee),
    weightKg: v.weightKg != null ? toNumber(v.weightKg) : null,
    temperature: v.temperature != null ? toNumber(v.temperature) : null,
    bloodSugar: v.bloodSugar != null ? toNumber(v.bloodSugar) : null,
    lines: v.lines.map((l) => ({
      ...l,
      unitPrice: toNumber(l.unitPrice),
      amount: toNumber(l.amount),
    })),
    bill: v.bill
      ? {
          ...v.bill,
          subtotal: toNumber(v.bill.subtotal),
          discount: toNumber(v.bill.discount),
          total: toNumber(v.bill.total),
        }
      : null,
    doctor: v.doctor
      ? {
          ...v.doctor,
          fee: toNumber(v.doctor.fee),
        }
      : null,
  };
}

async function loadVisit(id: string) {
  return prisma.visit.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: { include: { department: true } },
      lines: { orderBy: { name: 'asc' } },
      bill: true,
    },
  });
}

export const visitRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const q = req.query as {
      patientId?: string;
      search?: string;
      date?: string;
      from?: string;
      to?: string;
      limit?: string;
    };
    const where: Record<string, unknown> = {};
    let visitDateFilter: { gte?: Date; lt?: Date } | undefined;

    if (q.patientId) where.patientId = q.patientId;

    if (q.date) {
      visitDateFilter = pakistanDayRange(q.date);
    } else {
      if (q.from) {
        visitDateFilter = { ...visitDateFilter, gte: pakistanDayStart(q.from) };
      }
      if (q.to) {
        visitDateFilter = { ...visitDateFilter, lt: pakistanDayEndExclusive(q.to) };
      }
    }
    if (visitDateFilter) where.visitDate = visitDateFilter;

    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [
        { visitNumber: { contains: s, mode: 'insensitive' } },
        { patient: { name: { contains: s, mode: 'insensitive' } } },
        { patient: { patientId: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const take = Math.min(500, Math.max(1, Number(q.limit) || 200));

    const items = await prisma.visit.findMany({
      where,
      orderBy: { visitDate: 'desc' },
      take,
      include: {
        patient: { select: { id: true, name: true, patientId: true, contact: true, gender: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
        bill: { select: { total: true, isPaid: true, billNumber: true } },
      },
    });

    return items.map((v) => ({
      ...v,
      consultationFee: toNumber(v.consultationFee),
      bill: v.bill
        ? { ...v.bill, total: toNumber(v.bill.total) }
        : null,
    }));
  });

  app.get('/patient/:patientId/history', async (req) => {
    const { patientId } = req.params as { patientId: string };
    const items = await prisma.visit.findMany({
      where: { patientId },
      orderBy: { visitDate: 'desc' },
      include: {
        doctor: { select: { name: true } },
        bill: { select: { total: true, billNumber: true, isPaid: true } },
        lines: { select: { id: true, name: true, lineType: true, dosage: true } },
      },
    });
    return items.map((v) => ({
      id: v.id,
      visitNumber: v.visitNumber,
      visitDate: v.visitDate,
      diagnosis: v.diagnosis,
      doctor: v.doctor,
      lineCount: v.lines.length,
      lines: v.lines,
      bill: v.bill ? { ...v.bill, total: toNumber(v.bill.total) } : null,
      consultationFee: toNumber(v.consultationFee),
    }));
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const visit = await loadVisit(id);
    if (!visit) return reply.code(404).send({ error: 'Visit not found' });
    return mapVisit(visit);
  });

  app.post('/', async (req, reply) => {
    const parsed = createVisitSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    const data = parsed.data;
    if (!data.patientId && !data.newPatient) {
      return reply.code(400).send({
        error: 'Select an existing patient or enter new patient details',
        fields: { patientId: 'Patient is required' },
      });
    }

    let patientId = data.patientId;

    if (!patientId && data.newPatient) {
      const np = data.newPatient;
      const patient = await prisma.patient.create({
        data: {
          patientId: await nextPatientId(),
          name: np.name,
          fatherName: np.fatherName?.trim() || 'N/A',
          age: np.age ?? null,
          gender: np.gender ?? null,
          contact: normalizePhoneField(np.contact),
          address: 'N/A',
          allergies: 'OPD registration',
        },
      });
      patientId = patient.id;
    }

    if (!patientId) {
      return reply.code(400).send({ error: 'Patient is required' });
    }

    let consultationFee = data.consultationFee ?? 0;
    if (data.doctorId && consultationFee === 0) {
      const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
      if (doctor) consultationFee = toNumber(doctor.fee);
    }

    const linesWithAmount = data.lines.map((l) => ({
      ...l,
      amount: l.unitPrice * l.quantity,
    }));

    const medicinesTotal = linesWithAmount.reduce((s, l) => s + l.amount, 0);
    const subtotal = consultationFee + medicinesTotal;
    const discount = data.discount ?? 0;
    const total = Math.max(0, subtotal - discount);

    const visitNumber = await nextCounterValue('visit', 'V-');
    const billNumber = await nextCounterValue('bill', 'B-');

    let visit;
    try {
      visit = await prisma.$transaction(async (tx) => {
      for (const l of linesWithAmount) {
        if (l.lineType === 'drug' && l.drugId) {
          const drug = await tx.drug.findUnique({ where: { id: l.drugId } });
          if (!drug) {
            const err = new Error(`Medicine not found: ${l.name}`) as Error & {
              statusCode: number;
              fields: Record<string, string>;
            };
            err.statusCode = 400;
            err.fields = { lines: l.name };
            throw err;
          }
          if (drug.stockQuantity < l.quantity) {
            const err = new Error(
              `Insufficient stock for ${l.name}. Available: ${drug.stockQuantity}, requested: ${l.quantity}`
            ) as Error & { statusCode: number; fields: Record<string, string> };
            err.statusCode = 400;
            err.fields = { lines: l.name };
            throw err;
          }
        }
      }
      const created = await tx.visit.create({
        data: {
          visitNumber,
          patientId,
          doctorId: data.doctorId ?? null,
          weightKg: data.weightKg ?? null,
          bloodPressure: data.bloodPressure?.trim() || null,
          temperature: data.temperature ?? null,
          bloodSugar: data.bloodSugar ?? null,
          pulse: data.pulse ?? null,
          spo2: data.spo2 ?? null,
          diagnosis: data.diagnosis?.trim() || null,
          advice: data.advice?.trim() || null,
          consultationFee,
          lines: {
            create: linesWithAmount.map((l) => ({
              lineType: l.lineType,
              drugId: l.drugId ?? null,
              labTestId: l.labTestId ?? null,
              name: l.name,
              dosage: l.dosage?.trim() || null,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              amount: l.amount,
            })),
          },
          bill: {
            create: {
              billNumber,
              subtotal,
              discount,
              total,
              isPaid: data.isPaid ?? false,
            },
          },
        },
      });

      for (const l of linesWithAmount) {
        if (l.lineType === 'drug' && l.drugId) {
          const updated = await tx.drug.updateMany({
            where: { id: l.drugId, stockQuantity: { gte: l.quantity } },
            data: { stockQuantity: { decrement: l.quantity } },
          });
          if (updated.count === 0) {
            const err = new Error(`Insufficient stock for ${l.name}`) as Error & {
              statusCode: number;
              fields: Record<string, string>;
            };
            err.statusCode = 400;
            err.fields = { lines: l.name };
            throw err;
          }
        }
      }

      return created;
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; fields?: Record<string, string> };
      if (err.statusCode === 400) {
        return reply.code(400).send({
          error: err.message,
          fields: err.fields,
        });
      }
      throw e;
    }

    const full = await loadVisit(visit.id);
    return reply.code(201).send(mapVisit(full));
  });

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.visit.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!existing) return reply.code(404).send({ error: 'Visit not found' });

    await prisma.$transaction(async (tx) => {
      for (const line of existing.lines) {
        if (line.lineType === 'drug' && line.drugId) {
          await tx.drug.update({
            where: { id: line.drugId },
            data: { stockQuantity: { increment: line.quantity } },
          });
        }
      }
      await tx.visit.delete({ where: { id } });
    });

    return { ok: true };
  });

  app.patch('/:id/bill/paid', async (req, reply) => {
    const { id } = req.params as { id: string };
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { bill: true },
    });
    if (!visit?.bill) return reply.code(404).send({ error: 'Bill not found' });
    await prisma.bill.update({
      where: { id: visit.bill.id },
      data: { isPaid: true },
    });
    return { ok: true };
  });
};
