import { Hono } from 'hono';
import { validationController } from '../controllers/validation.controller';

const dashboardRoute = new Hono();

// Removed authMiddleware
dashboardRoute.get('/', (c) => validationController.getDashboard(c));

export default dashboardRoute;
