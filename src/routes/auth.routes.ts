import { Router } from 'express';
import { register } from '../controllers/auth.controller';
import { login } from '../controllers/login.controller';
import { verifyEmailCode } from '../controllers/verify.controller';
import { setup2FA } from '../controllers/setup2fa.controller';
import { verify2FA } from '../controllers/verify2fa.controller';
import { sendEmailCode } from '../controllers/send-email-code.controller';
import { refresh } from '../controllers/refresh.controller';
import { logout } from '../controllers/logout.controller';
import { me } from '../controllers/me.controller';
import { forgotPassword } from '../controllers/forgot.password.controller';
import { resetPassword } from '../controllers/reset.password.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmailCode);
router.post('/send-email-code', sendEmailCode);
router.post('/setup-2fa', setup2FA);
router.post('/verify-2fa', verify2FA);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas (requieren token válido)
router.get('/me', authenticateToken, me);

export default router;