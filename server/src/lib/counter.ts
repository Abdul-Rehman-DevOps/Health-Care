import { prisma } from './prisma.js';

export async function nextCounterValue(name: string, prefix: string): Promise<string> {
  const counter = await prisma.systemCounter.upsert({
    where: { name },
    create: { name, value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}${counter.value}`;
}
