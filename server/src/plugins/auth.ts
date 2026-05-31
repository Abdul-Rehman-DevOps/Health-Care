import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export type JwtUser = {
  sub: string;
  username: string;
  role: 'admin' | 'user';
  displayName: string;
};

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function registerAuthHelpers(app: FastifyInstance) {
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify<JwtUser>();
    } catch {
      return reply.code(401).send({ error: 'Please log in' });
    }
  });

  app.decorate('requireAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) await req.jwtVerify<JwtUser>();
    } catch {
      return reply.code(401).send({ error: 'Please log in' });
    }
    const user = req.user as JwtUser;
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin access required' });
    }
  });
}
