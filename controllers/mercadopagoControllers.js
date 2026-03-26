import mercadopago from 'mercadopago';
import Pago from '../models/pago.js';
import Usuario from '../models/usuario.js';

// Configura el SDK al cargar el módulo
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:3000';

// ─────────────────────────────────────────────────
// POST /api/mercadopago/create-preference
// Crea la preferencia y devuelve el link de pago
// ─────────────────────────────────────────────────
export const crearPreferencia = async (req, res) => {
  try {
    // El usuarioId viene del JWT validado por validarJWT (middleware existente)
    const usuarioId = req.usuario.id;
    const { monto = 50000, titulo = 'Membresía Numerología (30 días)' } = req.body;

    const preference = await mercadopago.preferences.create({
      items: [{
        title: titulo,
        quantity: 1,
        unit_price: Number(monto),
        currency_id: 'COP'
      }],
      back_urls: {
        success:  `${FRONTEND_URL}/pagos/exito`,
        failure:  `${FRONTEND_URL}/pagos/fallo`,
        pending:  `${FRONTEND_URL}/pagos/pendiente`
      },
      auto_return: 'approved',
      // external_reference sirve para identificar al usuario en el webhook
      external_reference: String(usuarioId),
      notification_url: `${BACKEND_URL}/api/mercadopago/webhook`
    });

    res.json({
      success: true,
      // En PRUEBAS usa sandbox_init_point; en PRODUCCIÓN cambia a init_point
      init_point: preference.body.sandbox_init_point,
      preference_id: preference.body.id
    });
  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────
// POST /api/mercadopago/webhook  (sin JWT)
// GET  /api/mercadopago/webhook
// Recibe notificaciones automáticas de Mercado Pago
// ─────────────────────────────────────────────────
export const recibirNotificacion = async (req, res) => {
  try {
    const { topic, resource, type, data } = req.query;
    const esPayment = topic === 'payment' || type === 'payment';

    if (esPayment) {
      const paymentId = data?.id || resource?.split('/').pop();

      if (paymentId) {
        const payment = await mercadopago.payment.findById(paymentId);
        const paymentData = payment.body;

        if (paymentData && paymentData.status === 'approved') {
          await procesarPagoAprobado(paymentData);
        }
      }
    }

    // SIEMPRE responder 200 para que MP no reintente
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook MP:', error);
    res.status(200).send('OK'); // Igualmente 200 para evitar reintentos
  }
};

// ─────────────────────────────────────────────────
// GET /api/mercadopago/verify-payment?payment_id=XXX
// El frontend lo llama cuando el usuario regresa del checkout
// ─────────────────────────────────────────────────
export const verificarPago = async (req, res) => {
  try {
    const { payment_id } = req.query;
    if (!payment_id) {
      return res.status(400).json({ error: 'payment_id es requerido' });
    }

    const payment = await mercadopago.payment.findById(payment_id);
    const paymentData = payment.body;

    res.json({
      success: true,
      status:        paymentData.status,         // 'approved', 'rejected', 'pending'
      status_detail: paymentData.status_detail,
      amount:        paymentData.transaction_amount,
      payer:         paymentData.payer?.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────
// Función interna: procesa un pago aprobado
// (llamada desde el webhook, NO es endpoint)
// ─────────────────────────────────────────────────
async function procesarPagoAprobado(paymentData) {
  const usuarioId = paymentData.external_reference;
  const monto     = paymentData.transaction_amount;

  // Calcular vencimiento: 30 días desde hoy
  const fecha_vencimiento = new Date();
  fecha_vencimiento.setDate(fecha_vencimiento.getDate() + 30);

  // Mapear el tipo de pago de MP al enum del modelo existente
  const metodoPago = paymentData.payment_type_id === 'credit_card'  ? 'tarjeta'
                   : paymentData.payment_type_id === 'bank_transfer' ? 'transferencia'
                   : 'efectivo';

  await Pago.create({
    usuario_id:      usuarioId,
    monto,
    metodo:          metodoPago,
    fecha_vencimiento,
    mp_payment_id:    String(paymentData.id),
    mp_preference_id: paymentData.preference_id || '',
    mp_status:        paymentData.status
  });

  // Activar membresía del usuario
  await Usuario.findByIdAndUpdate(usuarioId, { estado: 'activo' });
  console.log(`✅ MP - Pago aprobado: Usuario ${usuarioId}, Monto: ${monto} COP`);
}
