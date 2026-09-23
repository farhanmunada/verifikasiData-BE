import { Hono } from 'hono';
import { authController } from '../controllers/auth.controller';

const authRoute = new Hono();

// authRoute.post('/login', (c) => authController.login(c));

authRoute.get('/me', (c) => authController.me(c));

export default authRoute;
