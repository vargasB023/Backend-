
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const enviarCorreoRecuperacion = async (
  correoDestino: string,
  resetUrl: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.CORREO_GADDER,
        pass: process.env.CORREO_PASSWORD,
      },
    });

    const asunto = "Restablece tu contraseña en GADDER";
    const mensajeHTML = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f9fafb; color: #222;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #1a6f9d;">🔑 Restablecimiento de Contraseña</h2>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>GADDER</strong>.</p>
          
          <p>Haz clic en el siguiente botón para continuar con el proceso:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1a6f9d; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Restablecer Contraseña</a>
          </div>

          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>

          <p style="font-size: 14px; color: #999;">Este enlace expira en 1 hora por motivos de seguridad.</p>
          <p style="font-size: 14px; color: #999;">Equipo GADDER 🏐</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"GADDER" <${process.env.CORREO_GADDER}>`,
      to: correoDestino,
      subject: asunto,
      html: mensajeHTML,
    });

    console.log(`Correo de recuperación enviado a ${correoDestino}`);
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
  }
};