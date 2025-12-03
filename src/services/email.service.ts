import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'
import { query } from '../db'
import logger from '../utils/logger'
import { config } from '../config'

// Rate limit configuration
const MAX_EMAILS_PER_HOUR = 3

class EmailRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmailRateLimitError'
  }
}

// Transporter setup using env variables (secure TLS)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || config.wp.baseUrl,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
  },
  // Mejoras para deliverability
  pool: true, // Usar pool de conexiones para mejor rendimiento
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000, // 1 segundo entre mensajes
  rateLimit: 5 // 5 mensajes por segundo máximo
})

// Ensure table for email logs exists (simple migration). Uses email_logs(email text, type text, sent_at timestamptz)
;(async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        type TEXT NOT NULL,
        sent_at timestamptz NOT NULL DEFAULT NOW()
      )`
    )
  } catch (err) {
    // If pgcrypto extension not available, fall back to UUID generation by client
    logger.warn('Could not ensure email_logs table exists (non-fatal).', { err: (err as any)?.message || err })
  }
})()

async function canSendEmail(email: string): Promise<boolean> {
  // Count emails sent in the last hour for that recipient
  const res = await query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM email_logs WHERE email = $1 AND sent_at >= NOW() - INTERVAL '1 hour'`,
    [email]
  )
  const count = Number(res.rows[0]?.count ?? 0)
  return count < MAX_EMAILS_PER_HOUR
}

async function logEmail(email: string, type: string) {
  await query('INSERT INTO email_logs (email, type) VALUES ($1, $2)', [email, type])
}

async function sendMail(to: string, subject: string, html: string, text?: string) {
  try {
    const ok = await canSendEmail(to)
    if (!ok) throw new EmailRateLimitError('Email rate limit exceeded for recipient')

    // Generar Message-ID único para mejor tracking
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${process.env.SMTP_DOMAIN || 'micrositio.com'}>`

    const mailOptions: SendMailOptions = {
      from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_DOMAIN || 'example.com'}`,
      to,
      subject,
      text: text || undefined,
      html,
      // Headers adicionales para mejor deliverability
      headers: {
        'X-Mailer': 'Micrositio-Secure-System',
        'X-Priority': '1' as const,
        'Importance': 'high' as const,
        'Message-ID': messageId,
        'Reply-To': process.env.SMTP_FROM || process.env.SMTP_USER || '',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'List-Unsubscribe': `<mailto:${process.env.SMTP_USER}?subject=unsubscribe>`,
      },
      // Configuración adicional
      priority: 'high',
      encoding: 'utf-8'
    }

    const info = await transporter.sendMail(mailOptions)

    await logEmail(to, subject)
    logger.info('Email sent', { to, subject, messageId: info?.messageId || messageId })
    return { success: true, info }
  } catch (err: any) {
    if (err instanceof EmailRateLimitError) {
      logger.warn('Email rate limit hit', { to })
      throw err
    }
    logger.error('Error sending email', { to, err: err?.message || err })
    throw new Error('Email delivery failed')
  }
}

// Templates mejorados con mejores prácticas anti-spam
function verificationHtmlTemplate(code: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Verificación</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Código de Verificación</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Hola,
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Has solicitado un código de verificación para acceder a tu cuenta. Usa el siguiente código:
                  </p>
                  <!-- Code Box -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 24px; display: inline-block;">
                          <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    ⏱️ Este código expira en <strong>10 minutos</strong>.
                  </p>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    🔒 Si no solicitaste este código, puedes ignorar este correo de forma segura.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Micrositio Seguro. Todos los derechos reservados.
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    Este es un correo automático, por favor no responder.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function welcomeHtmlTemplate(username: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">¡Bienvenido! 🎉</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 18px; line-height: 1.5;">
                    Hola <strong>${username}</strong>,
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    ¡Gracias por unirte a nuestra plataforma! Estamos emocionados de tenerte con nosotros.
                  </p>
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Tu cuenta ha sido creada exitosamente y ahora puedes acceder a todas nuestras funcionalidades.
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Ir al Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Micrositio Seguro. Todos los derechos reservados.
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    Este es un correo automático, por favor no responder.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function twoFaHtmlTemplate(qrCodeUrl: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Configura tu 2FA</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔐 Autenticación de Dos Factores</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Para configurar la autenticación de dos factores, escanea el siguiente código QR con tu aplicación de autenticación:
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <img src="${qrCodeUrl}" alt="Código QR para 2FA" style="max-width: 300px; border: 4px solid #667eea; border-radius: 8px; padding: 10px; background-color: #ffffff;" />
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    📱 <strong>Aplicaciones recomendadas:</strong>
                  </p>
                  <ul style="margin: 0 0 20px; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                    <li>Google Authenticator</li>
                    <li>Microsoft Authenticator</li>
                    <li>Authy</li>
                  </ul>
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Si necesitas ayuda, no dudes en contactarnos.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Micrositio Seguro. Todos los derechos reservados.
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    Este es un correo automático, por favor no responder.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export async function sendVerificationCode(email: string, code: string) {
  const subject = '🔐 Código de Verificación - Micrositio Seguro'
  const html = verificationHtmlTemplate(code)
  const text = `
Código de Verificación

Hola,

Has solicitado un código de verificación para acceder a tu cuenta.

Tu código es: ${code}

⏱️ Este código expira en 10 minutos.

🔒 Si no solicitaste este código, puedes ignorar este correo de forma segura.

---
© ${new Date().getFullYear()} Micrositio Seguro. Todos los derechos reservados.
Este es un correo automático, por favor no responder.
  `.trim()
  return sendMail(email, subject, html, text)
}

export async function sendWelcomeEmail(email: string, username: string) {
  const subject = '🎉 ¡Bienvenido a Micrositio Seguro!'
  const html = welcomeHtmlTemplate(username)
  const text = `
¡Bienvenido!

Hola ${username},

¡Gracias por unirte a nuestra plataforma! Estamos emocionados de tenerte con nosotros.

Tu cuenta ha sido creada exitosamente y ahora puedes acceder a todas nuestras funcionalidades.

Accede a tu dashboard en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard

---
© ${new Date().getFullYear()} Micrositio Seguro. Todos los derechos reservados.
Este es un correo automático, por favor no responder.
  `.trim()
  return sendMail(email, subject, html, text)
}

export async function send2FASetupInstructions(email: string, qrCodeUrl: string) {
  const subject = '🔐 Configura tu Autenticación de Dos Factores'
  const html = twoFaHtmlTemplate(qrCodeUrl)
  const text = `
Autenticación de Dos Factores

Para configurar la autenticación de dos factores, escanea el código QR que se encuentra en este correo con tu aplicación de autenticación.

📱 Aplicaciones recomendadas:
- Google Authenticator
- Microsoft Authenticator
- Authy

Si necesitas ayuda, no dudes en contactarnos.

---
© ${new Date().getFullYear()} Micrositio Seguro. Todos los derechos reservados.
Este es un correo automático, por favor no responder.
  `.trim()
  return sendMail(email, subject, html, text)
}

// Export sendMail for admin notifications
export { sendMail }

export default {
  sendVerificationCode,
  sendWelcomeEmail,
  send2FASetupInstructions
}
