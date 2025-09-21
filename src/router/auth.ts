import express from "express";
import crypto from "crypto";
import moment from "moment-timezone";
import bcrypt from "bcryptjs";
import { enviarCorreoRecuperacion } from "../utils/enviarCorreoRecuperacion";
import Entrenador from "../models/entrenador";
import Deportista from "../models/deportista";

const router = express.Router();

// 📩 Solicitar OTP
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("Entré en /forgot-password");
    const { email, rol } = req.body;
    console.log("Email y rol recibidos:", email, rol);

    if (!email || !rol) {
      return res.status(400).json({ message: "Email y rol son obligatorios" });
    }

    let user: any;
    if (rol === "entrenador") {
      user = await Entrenador.findOne({ where: { email } });
    } else if (rol === "deportista") {
      user = await Deportista.findOne({ where: { email } });
    } else {
      return res.status(400).json({ message: "Rol inválido" });
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 🔑 Generar OTP de 6 dígitos
    const otp = crypto.randomInt(100000, 999999).toString();

    // 📅 Expira en 15 minutos (zona Bogotá)
    const nowBogota = moment().tz("America/Bogota");
    const otpExpiry = nowBogota.clone().add(15, "minutes").toDate();

    // Guardar en el usuario
    user.resetCode = otp;
    user.resetCodeExpires = otpExpiry;

    console.log("OTP a guardar:", otp, "Expira en:", otpExpiry);

    await user.save();

    // 📧 Enviar correo con OTP
    await enviarCorreoRecuperacion(user.email, otp);

    return res.json({
      message: "Se envió un código de verificación a tu correo",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

// 🔒 Restablecer contraseña
router.post("/reset-password", async (req, res) => {
  try {
    const { email, rol, otp, nuevaContrasena } = req.body;

    if (!email || !rol || !otp || !nuevaContrasena) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    let user: any;
    if (rol === "entrenador") {
      user = await Entrenador.findOne({ where: { email } });
    } else if (rol === "deportista") {
      user = await Deportista.findOne({ where: { email } });
    } else {
      return res.status(400).json({ message: "Rol inválido" });
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 🔑 Validar OTP
    if (String(user.resetCode) !== String(otp)) {
      return res.status(400).json({ message: "Código inválido" });
    }

    // 📅 Validar expiración
    const nowBogota = moment().tz("America/Bogota");
    if (nowBogota.toDate() > new Date(user.resetCodeExpires)) {
      return res.status(400).json({ message: "Código expirado" });
    }

    // 🔒 Hashear contraseña nueva
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    user.contrasena = hashedPassword;

    // ✨ Limpiar OTP
    user.resetCode = null;
    user.resetCodeExpires = null;

    await user.save();

    return res.json({ message: "Contraseña restablecida con éxito" });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
