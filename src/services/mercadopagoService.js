import { postData, getData } from './apiClient.js';

/**
 * Crea una preferencia de pago en Mercado Pago.
 * Devuelve { success, init_point, preference_id }
 * El apiClient.js ya envía automáticamente el x-token del usuario.
 */
export const crearPreferenciaPago = async (monto, titulo) => {
  return await postData('/api/mercadopago/create-preference', { monto, titulo });
};

/**
 * Verifica el estado de un pago después de que el usuario regresa de MP.
 * @param {string} paymentId - Viene en la query string ?payment_id=XXX
 * Devuelve { success, status, status_detail, amount, payer }
 */
export const verificarEstadoPago = async (paymentId) => {
  return await getData('/api/mercadopago/verify-payment', { payment_id: paymentId });
};
