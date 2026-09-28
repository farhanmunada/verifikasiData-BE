import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env';

import { successResponse, errorResponse } from './utils/response';

import validationRoute from './routes/validation.route';
import dashboardRoute from './routes/dashboard.route';

import { swaggerUI } from '@hono/swagger-ui';
import swaggerData from './swagger.json';

const app = new Hono();

// Swagger Documentation
app.get('/swagger.json', (c) => c.json(swaggerData));
app.get('/swagger', swaggerUI({ url: '/swagger.json' }));

// Enable CORS
app.use(
  '*',
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User'],
  })
);

// Mount API Routes
app.route('/api/validation', validationRoute);
app.route('/api/dashboard', dashboardRoute);

// Root & Health check endpoints
app.get('/', (c) => {
  return successResponse(
    c,
    'Sistem Validasi dan Cleansing Duplikasi Nomor Identitas API',
    {
      version: '1.0.0',
      runtime: 'Bun',
      framework: 'Hono',
    }
  );
});

app.get('/health', (c) => {
  return successResponse(c, 'Service is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Global 404 Handler
app.notFound((c) => {
  return errorResponse(c, `Endpoint '${c.req.path}' tidak ditemukan.`, 'NOT_FOUND', undefined, 404);
});

// Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  return errorResponse(
    c,
    err.message || 'Terjadi kesalahan pada server.',
    'INTERNAL_SERVER_ERROR',
    undefined,
    500
  );
});



console.log(`Server starting on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
