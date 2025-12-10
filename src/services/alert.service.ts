import nodemailer from 'nodemailer';
import logger from '../logger';

// const SMTP_HOST = process.env.SMTP_HOST;
// const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
// const SMTP_USER = process.env.SMTP_USER;
// const SMTP_PASS = process.env.SMTP_PASS;
const FROM = process.env.ALERT_EMAIL_FROM || 'alerts@example.com';
const TO = process.env.ALERT_EMAIL_TO || '';

if (!TO) {
  logger.warn('alert_service_no_to', { message: 'ALERT_EMAIL_TO is not set; alerts will not be sent' });
}

// Legacy SMTP config (comentado, migrado a SendGrid)
/*
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});
*/

async function sendAlert(subject: string, text: string) {
  if (!TO) {
    logger.warn('alert_disabled', { subject });
    return;
  }
  try {
    // await transporter.sendMail({ from: FROM, to: TO, subject, text }); // Legacy SMTP (comentado)
    // logger.info('alert_sent_via_email', { subject, to: TO });
    // Ejemplo con SendGrid:
    // import { sendMail } from './sendgrid-mail.service';
    // await sendMail(TO, subject, text);
    // logger.info('alert_sent_via_email_sendgrid', { subject, to: TO });
  } catch (err: any) {
    logger.error('alert_send_failed', { error: err?.message });
    throw err;
  }
}

export default { sendAlert };
