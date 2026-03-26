<template>
  <q-page class="flex flex-center column q-pa-lg">
    <q-card class="q-pa-xl text-center shadow-10" style="max-width: 420px; width: 100%; border-radius: 16px;">

      <!-- Cargando / Verificando -->
      <div v-if="verificando" class="column items-center q-gutter-md">
        <q-spinner-dots color="deep-purple" size="60px" />
        <p class="text-subtitle1">Verificando tu pago...</p>
      </div>

      <!-- Pago Aprobado -->
      <template v-else-if="estadoPago === 'approved'">
        <q-icon name="check_circle" color="positive" size="70px" />
        <div class="text-h5 text-weight-bold q-mt-md">¡Pago Exitoso!</div>
        <p class="text-grey q-mt-sm">Tu membresía está activa por los próximos 30 días.</p>
        <q-btn
          color="deep-purple"
          label="Ir a mi Dashboard"
          icon="dashboard"
          to="/dashboard"
          class="q-mt-md"
          rounded unelevated
        />
      </template>

      <!-- Pago Pendiente -->
      <template v-else-if="estadoPago === 'pending' || estadoPago === 'in_process'">
        <q-icon name="hourglass_empty" color="warning" size="70px" />
        <div class="text-h5 text-weight-bold q-mt-md">Pago en Proceso</div>
        <p class="text-grey q-mt-sm">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
        <q-btn flat color="deep-purple" label="Ir al Dashboard" to="/dashboard" class="q-mt-md" />
      </template>

      <!-- Pago Rechazado / Cancelado -->
      <template v-else>
        <q-icon name="cancel" color="negative" size="70px" />
        <div class="text-h5 text-weight-bold q-mt-md">Pago No Completado</div>
        <p class="text-grey q-mt-sm">El pago fue rechazado o cancelado. Puedes intentarlo de nuevo.</p>
        <q-btn color="deep-purple" label="Reintentar Pago" icon="refresh" to="/pagos" class="q-mt-md" rounded unelevated />
        <q-btn flat color="grey" label="Ir al Dashboard" to="/dashboard" class="q-mt-sm" />
      </template>

    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { verificarEstadoPago } from '../../services/mercadopagoService.js';

const route = useRoute();
const verificando = ref(true);
const estadoPago = ref('');

onMounted(async () => {
  // Mercado Pago devuelve ?payment_id=XXX en la URL al redirigir
  const paymentId = route.query.payment_id;

  if (paymentId) {
    try {
      const result = await verificarEstadoPago(paymentId);
      estadoPago.value = result.status; // 'approved', 'rejected', 'pending', etc.
    } catch {
      // Si falla la verificación, deducimos por la ruta
      estadoPago.value = deducirEstadoPorRuta();
    }
  } else {
    // Sin payment_id, deducimos por la ruta (/pagos/exito, /pagos/fallo, /pagos/pendiente)
    estadoPago.value = deducirEstadoPorRuta();
  }

  verificando.value = false;
});

function deducirEstadoPorRuta() {
  if (route.path.includes('exito'))    return 'approved';
  if (route.path.includes('pendiente')) return 'pending';
  return 'rejected';
}
</script>
