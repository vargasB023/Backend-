import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Entrenador from "../models/entrenador";
import Deportista from "../models/deportista";
import { enviarCorreoRecuperacion } from "../utils/enviarCorreoRecuperacion"; 

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secreto";

router.post("/forgot-password", async (req, res) => {
  try {
    const { email, rol } = req.body;
    if (!email || !rol) {
      return res.status(400).json({ message: "Email y rol son obligatorios" });
    }

    let user: any;
    let userId: number;

    if (rol === "entrenador") {
      user = await Entrenador.findOne({ where: { email } });
      userId = user?.ID_Entrenador;
    } else if (rol === "deportista") {
      user = await Deportista.findOne({ where: { email } });
      userId = user?.ID_Deportista;
    } else {
      return res.status(400).json({ message: "Rol inválido" });
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 🔑 Generar token con id + rol
    const token = jwt.sign({ userId, rol }, JWT_SECRET, { expiresIn: "1h" });

    // 🔗 Crear link de restablecimiento (ahora en español)
    const resetUrl = `${process.env.FRONTEND_URL}/restablecerContraseña/${token}`;


    // 📧 Enviar correo real con nodemailer
    await enviarCorreoRecuperacion(user.email, resetUrl);

    return res.json({ message: "Correo enviado para restablecer contraseña" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // 🔑 Verificar token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const { userId, rol } = decoded;

    // 🔒 Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 📝 Actualizar según rol
    if (rol === "entrenador") {
      await Entrenador.update(
        { contrasena: hashedPassword },
        { where: { ID_Entrenador: userId } }
      );
    } else if (rol === "deportista") {
      await Deportista.update(
        { contrasena: hashedPassword },
        { where: { ID_Deportista: userId } }
      );
    } else {
      return res.status(400).json({ message: "Rol inválido" });
    }

    return res.json({ message: "Contraseña restablecida con éxito" });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
