import { Request, Response } from 'express';
import Joi from 'joi';
import { findUserByEmail } from '../models/user.model';
import { hashPassword } from '../services/crypto.service';
import { query } from '../db';
import logger from '../utils/logger';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

const schema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().pattern(passwordPattern).required(),
});

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, code, newPassword } = await schema.validateAsync(req.body);

    // Buscar usuario
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Email o código inválido' });
    }

    // Verificar código
    const result = await query(
      `SELECT * FROM password_reset 
       WHERE user_id = $1 
       AND reset_code = $2 
       AND is_used = false 
       AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [user.id, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const resetRecord = result.rows[0];

    // Hash de la nueva contraseña
    const password_hash = await hashPassword(newPassword);

    // Actualizar contraseña del usuario
    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [password_hash, user.id]
    );

    // Marcar código como usado
    await query(
      `UPDATE password_reset SET is_used = true WHERE id = $1`,
      [resetRecord.id]
    );

    logger.info('Password reset successful', { userId: user.id, email: user.email });

    return res.status(200).json({ message: 'Contraseña actualizada exitosamente' });

  } catch (err: any) {
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined;
      return res.status(400).json({ error: 'Datos inválidos', details });
    }

    logger.error('Reset password error', { err: err?.message || err });
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export default { resetPassword };
