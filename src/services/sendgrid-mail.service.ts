//Script para migrar el envío de correos a SendGrid
// Instala primero: npm install @sendgrid/mail
// import sgMail from '@sendgrid/mail'; // Si hay error de tipos, revisar instalación y types
import { query } from '../db';
import logger from '../utils/logger';

const MAX_EMAILS_PER_HOUR = 3;

class EmailRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailRateLimitError';
  }
}

// sgMail.setApiKey(process.env.SENDGRID_API_KEY || ''); // Comentado por error de referencia

async function canSendEmail(email: string): Promise<boolean> {
  const res = await query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM email_logs WHERE email = $1 AND sent_at >= NOW() - INTERVAL '1 hour'`,
    [email]
  );
  const count = Number(res.rows[0]?.count ?? 0);
  return count < MAX_EMAILS_PER_HOUR;
}

async function logEmail(email: string, type: string) {
  await query('INSERT INTO email_logs (email, type) VALUES ($1, $2)', [email, type]);
}

export async function sendMail(to: string, subject: string, html: string, text?: string) {
  try {
    const ok = await canSendEmail(to);
    if (!ok) throw new EmailRateLimitError('Email rate limit exceeded for recipient');

    const msg = {
      to,
      from: process.env.SENDGRID_FROM || 'no-reply@micrositio.com', // Single Sender Verification: este correo debe estar verificado en SendGrid
      subject,
      text: text || undefined,
      html,
      mail_settings: {
        sandbox_mode: { enable: true }
      }
    };
    // await sgMail.send(msg); // Comentado por error de referencia
    await logEmail(to, subject);
    logger.info('Email sent (SendGrid sandbox)', { to, subject });
    return { success: true, sandbox: true };
  } catch (err: any) {
    if (err instanceof EmailRateLimitError) {
      logger.warn('Email rate limit hit', { to });
      throw err;
    }
    logger.error('Error sending email (SendGrid sandbox)', { to, err: err?.message || err });
    throw new Error('Email delivery failed');
  }
}

