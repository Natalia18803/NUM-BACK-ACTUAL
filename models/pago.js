import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    monto: {
        type: Number,
        required: true,
        min: 0
    },
    fecha_pago: {
        type: Date,
        default: Date.now
    },
    fecha_vencimiento: {
        type: Date,
        required: true
    },
    metodo: {
        type: String,
        enum: ['tarjeta', 'efectivo', 'transferencia'],
        required: true
    },
    // Campos opcionales de Mercado Pago
    mp_payment_id:    { type: String, default: '' },
    mp_preference_id: { type: String, default: '' },
    mp_status:        { type: String, default: '' }
});

export default mongoose.model('Pago', pagoSchema);
