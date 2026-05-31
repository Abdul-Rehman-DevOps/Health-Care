import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import jwt from '@fastify/jwt';
import { registerAuthHelpers } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { patientRoutes } from './routes/patients.js';
import { doctorRoutes } from './routes/doctors.js';
import { departmentRoutes } from './routes/departments.js';
import { appointmentRoutes } from './routes/appointments.js';
import { drugRoutes } from './routes/drugs.js';
import { settingsRoutes } from './routes/settings.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST ?? '0.0.0.0';
const jwtSecret = process.env.JWT_SECRET ?? 'health-care-jwt-secret-change-in-production';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
});
await app.register(compress);
await app.register(jwt, { secret: jwtSecret });
await registerAuthHelpers(app);

const protectedHook = { preHandler: [app.authenticate] };

app.get('/api/health', async () => ({
  ok: true,
  service: 'health-care-api',
}));

app.register(authRoutes, { prefix: '/api/auth' });
app.register(dashboardRoutes, { prefix: '/api/dashboard', ...protectedHook });
app.register(patientRoutes, { prefix: '/api/patients', ...protectedHook });
app.register(doctorRoutes, { prefix: '/api/doctors', ...protectedHook });
app.register(departmentRoutes, { prefix: '/api/departments', ...protectedHook });
app.register(appointmentRoutes, { prefix: '/api/appointments', ...protectedHook });
app.register(drugRoutes, { prefix: '/api/drugs', ...protectedHook });
app.register(settingsRoutes, { prefix: '/api/settings', ...protectedHook });

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
