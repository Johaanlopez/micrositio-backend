import { Request, Response } from 'express';
import Joi from 'joi';
import { findUserByEmail } from '../models/user.model';
import { generateVerificationCode } from '../services/crypto.service';
import { query } from '../db';
import logger from '../utils/logger';

const schema = Joi.object({
  email: Joi.string().email().required(),
});

const CODE_EXPIRY_MINUTES = 30;

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = await schema.validateAsync(req.body);

    // Buscar usuario
    const user = await findUserByEmail(email);
    
    // Por seguridad, NO revelar si el email existe o no
    if (!user) {
      return res.status(200).json({ 
        message: 'Si el email existe, recibirás un código de recuperación' 
      });
    }

    // Generar código de 6 dígitos
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Guardar en tabla password_reset (crear si no existe)
    await query(
      `INSERT INTO password_reset (user_id, reset_code, expires_at, is_used)
       VALUES ($1, $2, $3, false)
       ON CONFLICT DO NOTHING`,
      [user.id, code, expiresAt]
    );

    // TODO: Enviar código por email usando servicio de email

    logger.info('Password reset code generated', { 
      userId: user.id, 
      email: user.email 
    });

    return res.status(200).json({ 
      message: 'Si el email existe, recibirás un código de recuperación' 
    });

  } catch (err: any) {
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined;
      return res.status(400).json({ error: 'Email inválido', details });
    }

    logger.error('Forgot password error', { err: err?.message || err });
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export default { forgotPassword };