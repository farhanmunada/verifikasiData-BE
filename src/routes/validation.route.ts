import { Hono } from 'hono';
import { validationController } from '../controllers/validation.controller';

const validationRoute = new Hono();

validationRoute.get('/identity/:identityNumber', (c) => validationController.checkIdentity(c));
validationRoute.get('/duplicates', (c) => validationController.getDuplicates(c));
validationRoute.post('/:id/clean', (c) => validationController.clean(c));
validationRoute.get('/dashboard', (c) => validationController.getDashboard(c));

export default validationRoute;
