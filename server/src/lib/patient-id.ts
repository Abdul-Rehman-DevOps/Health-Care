import { prisma } from './prisma.js';

export async function nextPatientId(): Promise<string> {
  const counter = await prisma.systemCounter.upsert({
    where: { name: 'patient' },
    create: { name: 'patient', value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `HC-${counter.value}`;
}
