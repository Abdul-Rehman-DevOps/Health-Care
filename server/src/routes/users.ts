import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';
import { sendValidationError } from '../lib/validation.js';
import type { JwtUser } from '../plugins/auth.js';

const resetPasswordSchema = z.object({
  password: z.string().trim().min(4, 'Password must be at least 4 characters'),
});

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only use letters, numbers, dots, dashes, and underscores'),
  password: z.string().trim().min(4, 'Password must be at least 4 characters'),
  displayName: z.string().trim().min(1, 'Display name is required'),
  role: z.enum(['admin', 'user'], { errorMap: () => ({ message: 'Role is required' }) }),
});

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.requireAdmin] }, async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
    });
  });

  app.post('/', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    try {
      const user = await prisma.user.create({
        data: {
          username: parsed.data.username.toLowerCase(),
          passwordHash: hashPassword(parsed.data.password),
          displayName: parsed.data.displayName,
          role: parsed.data.role,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
        },
      });
      return reply.code(201).send(user);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2002') {
        return reply.code(409).send({
          error: 'Username already exists',
          fields: { username: 'Username already exists' },
        });
      }
      return reply.code(400).send({ error: 'Could not create user' });
    }
  });

  app.delete('/:id', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const current = req.user as JwtUser;

    if (current.sub === id) {
      return reply.code(400).send({ error: 'You cannot delete your own account' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }

    if (target.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return reply.code(400).send({ error: 'Cannot delete the last admin account' });
      }
    }

    try {
      await prisma.user.delete({ where: { id } });
      return reply.code(204).send();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2025') return reply.code(404).send({ error: 'User not found' });
      return reply.code(400).send({ error: 'Could not delete user' });
    }
  });

  app.patch('/:id/password', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    try {
      await prisma.user.update({
        where: { id },
        data: { passwordHash: hashPassword(parsed.data.password) },
      });
      return { ok: true, message: 'Password updated successfully' };
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2025') return reply.code(404).send({ error: 'User not found' });
      return reply.code(400).send({ error: 'Could not reset password' });
    }
  });
};
