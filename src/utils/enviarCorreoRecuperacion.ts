import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const enviarCorreoRecuperacion = async (
  correoDestino: string,
  resetUrlWeb: string,
  resetUrlApp: string
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
          
          <h2 style="color: #1a6f9d; text-align:center;">🔑 Restablecimiento de Contraseña</h2>
          <p style="font-size: 16px; text-align:center;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>GADDER</strong>.
          </p>

          <p style="font-size: 15px; text-align:center;">Selecciona una opción para continuar:</p>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrlWeb}" 
              style="display:inline-block; background-color:#235eb5; color:#fff; text-decoration:none; 
              padding:12px 24px; border-radius:8px; font-weight:bold; margin:5px; font-size:15px;">
              🌐 Restablecer en la Web
            </a>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrlApp}" 
              style="display:inline-block; background-color:#1a6f9d; color:#fff; text-decoration:none; 
              padding:12px 24px; border-radius:8px; font-weight:bold; margin:5px; font-size:15px;">
              📱 Restablecer en la App
            </a>
          </div>

          <p style="font-size: 14px; color: #999; text-align:center;">
            Si no solicitaste este cambio, puedes ignorar este correo.<br>
            El enlace expira en 1 hora por motivos de seguridad.
          </p>

          <p style="font-size: 14px; color: #999; text-align:center;">
            Equipo GADDER 🏐
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"GADDER" <${process.env.CORREO_GADDER}>`,
      to: correoDestino,
      subject: asunto,
      html: mensajeHTML,
    });

    console.log(`📩 Correo de recuperación enviado a ${correoDestino}`);
  } catch (error) {
    console.error("❌ Error al enviar correo de recuperación:", error);
  }
};
