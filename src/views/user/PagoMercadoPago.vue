<template>
  <q-page class="flex flex-center column q-pa-lg">
    <q-card class="q-pa-xl shadow-10" style="max-width: 420px; width: 100%; border-radius: 16px;">

      <!-- Cabecera -->
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="auto_awesome" color="deep-purple" size="52px" />
        <div class="text-h5 text-weight-bold q-mt-sm">Activar Membresía</div>
        <div class="text-subtitle2 text-grey q-mt-xs">
          Accede a todas tus lecturas numerológicas durante 30 días
        </div>
      </q-card-section>

      <q-separator inset />

      <!-- Detalle del pago -->
      <q-card-section class="q-pt-sm">
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon name="verified" color="deep-purple" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Membresía Premium</q-item-label>
              <q-item-label caption>30 días de acceso completo</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge color="deep-purple" label="$50.000 COP" class="q-pa-xs" />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="lock" color="positive" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Pago 100% seguro con Mercado Pago</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <!-- Botón de pago -->
      <q-card-actions class="justify-center q-pb-md">
        <q-btn
          color="deep-purple"
          icon="payment"
          label="Pagar con Mercado Pago"
          :loading="cargando"
          :disable="cargando"
          @click="iniciarPago"
          size="lg"
          rounded
          unelevated
          class="full-width"
        />
      </q-card-actions>

      <!-- Error -->
      <q-banner v-if="error" class="bg-negative text-white q-mt-sm" rounded>
        <template v-slot:avatar>
          <q-icon name="warning" />
        </template>
        {{ error }}
      </q-banner>

    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { crearPreferenciaPago } from '../../services/mercadopagoService.js';

const cargando = ref(false);
const error = ref('');

const iniciarPago = async () => {
  cargando.value = true;
  error.value = '';
  try {
    const respuesta = await crearPreferenciaPago(50000, 'Membresía Numerología 30 días');
    if (respuesta.success && respuesta.init_point) {
      // Redirige al checkout de Mercado Pago
      window.location.href = respuesta.init_point;
    } else {
      error.value = 'No se pudo iniciar el pago. Intenta de nuevo.';
    }
  } catch (e) {
    error.value = e?.response?.data?.error || e.message || 'Error de conexión con el servidor.';
  } finally {
    cargando.value = false;
  }
};
</script>
