import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verifyPassword } from '../lib/password.js';
import type { JwtUser } from '../plugins/auth.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Username and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username.toLowerCase() },
    });

    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return reply.code(401).send({ error: 'Invalid username or password' });
    }

    const payload: JwtUser = {
      sub: user.id,
      username: user.username,
      role: user.role as 'admin' | 'user',
      displayName: user.displayName,
    };

    const token = app.jwt.sign(payload, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (req) => {
    return req.user;
  });
};
