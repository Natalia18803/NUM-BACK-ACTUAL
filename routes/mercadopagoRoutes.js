import express from 'express';
const router = express.Router();

import {
  crearPreferencia,
  recibirNotificacion,
  verificarPago
} from '../controllers/mercadopagoControllers.js';
import { validarJWT } from '../middlewares/validar-jwt.js';

// Webhook: sin JWT (lo llama Mercado Pago, no el usuario)
router.post('/webhook', recibirNotificacion);
router.get('/webhook',  recibirNotificacion);

// Estas rutas requieren usuario autenticado
router.post('/create-preference', validarJWT, crearPreferencia);
router.get('/verify-payment',     validarJWT, verificarPago);

export default router;
