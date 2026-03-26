import Usuario from '../models/usuario.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Helper para enviar email usando Brevo
const enviarEmailBrevo = async (destinatario, asunto, htmlContent) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Numerología ✨",
          email: process.env.EMAIL_USER,
        },
        to: [{ email: destinatario }],
        subject: asunto,
        htmlContent: htmlContent,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error enviando email con Brevo:", error?.response?.data || error.message);
  }
};

// Helper para generar el Token (Asegúrate de tener JWT_SECRET en tu .env)
const generarToken = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET || 'secreto-temporal', {
        expiresIn: '30d'
    });
};

// --- RUTAS DE AUTENTICACIÓN ---

export const registro = async (req, res) => {
    try {
        const { nombre, email, password, fecha_nacimiento } = req.body;

        const existeUsuario = await Usuario.findOne({ email });
        if (existeUsuario) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const usuario = new Usuario({ nombre, email, password, fecha_nacimiento });
        await usuario.save();

        // Enviar correo de bienvenida
        const htmlContent = `
            <h2>¡Bienvenido/a a la Matriz de Numerología, ${nombre}! ✨</h2>
            <p>Estamos muy felices de tenerte con nosotros. Has creado tu cuenta exitosamente.</p>
            <p>Ingresa a la plataforma para conocer tu número de vida y descubrir lo que los astros tienen para ti.</p>
            <br/>
            <p>Saludos,</p>
            <p>El equipo de Numerología</p>
        `;
        // No bloqueamos la respuesta, se envía asíncrono en background
        enviarEmailBrevo(email, "¡Bienvenido a la Matriz de Numerología! ✨", htmlContent);

        const token = generarToken(usuario._id, usuario.rol);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            usuario: { id: usuario._id, nombre, email, rol: usuario.rol }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => { try { const { email, password, rol: rolReclamado } = req.body; const usuario = await Usuario.findOne({ email });

        if (!usuario || !(await usuario.compararPassword(password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Validación estricta del rol seleccionado en el front vs la DB
        if (rolReclamado && usuario.rol !== rolReclamado) {
            return res.status(403).json({ 
                error: `Acceso denegado. No tienes permisos de '${rolReclamado}'.` 
            });
        }

        const token = generarToken(usuario._id, usuario.rol);
        res.json({
            message: 'Login exitoso',
            token,
            usuario: { 
                id: usuario._id, 
                nombre: usuario.nombre, 
                email: usuario.email,
                rol: usuario.rol 
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- RUTAS DE GESTIÓN (CRUD) ---

export const getAllUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password'); // No enviamos el password por seguridad
        res.json({ usuarios });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUsuarioById = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-password');
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUsuario = async (req, res) => {
    try {
        const { nombre, email, fecha_nacimiento } = req.body;
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.params.id, 
            { nombre, email, fecha_nacimiento },
            { new: true }
        );
        res.json({ message: 'Usuario actualizado', usuario: usuarioActualizado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateEstadoUsuario = async (req, res) => {
    try {
        const { estado } = req.body;
        await Usuario.findByIdAndUpdate(req.params.id, { estado });
        res.json({ message: 'Estado actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUsuario = async (req, res) => {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


