import { sendMail } from './email.service'
import logger from '../utils/logger'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'

/**
 * Send notification to admin when a user successfully registers
 */
export async function notifyAdminNewRegistration(userData: {
  email: string
  username: string
  matricula: string
}) {
  try {
    const subject = '✅ Nuevo registro exitoso - Micrositio'
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4fb52e; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">✅ Nuevo Usuario Registrado</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h3 style="color: #333;">Detalles del registro:</h3>
          
          <table style="width: 100%; background-color: white; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555;">Matrícula:</td>
              <td style="padding: 12px;">${userData.matricula}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 12px;">${userData.email}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #555;">Usuario:</td>
              <td style="padding: 12px;">${userData.username}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #4fb52e;">
            <p style="margin: 0; color: #2e7d32;">
              ℹ️ Este usuario completó el registro y debe verificar su email para activar su cuenta.
            </p>
          </div>
        </div>
        
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">Micrositio Seguro - Notificación Automática</p>
          <p style="margin: 5px 0 0 0;">Fecha: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
        </div>
      </div>
    `
    
    const text = `
NUEVO REGISTRO EXITOSO

Matrícula: ${userData.matricula}
Email: ${userData.email}
Usuario: ${userData.username}

Fecha: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
    `
    
    await sendMail(ADMIN_EMAIL, subject, html, text)
    logger.info('Admin notified of new registration', { email: userData.email })
  } catch (err: any) {
    logger.error('Failed to notify admin of registration', { 
      error: err?.message || err,
      userData: userData.email 
    })
    // Don't throw - notification failure shouldn't block registration
  }
}

/**
 * Send alert to admin when someone tries to register without authorization
 */
export async function notifyAdminUnauthorizedAttempt(attemptData: {
  email: string
  matricula: string
  username?: string
  ipAddress?: string
  timestamp: Date
}) {
  try {
    const subject = '⚠️ INTENTO DE REGISTRO NO AUTORIZADO - Micrositio'
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #e84b44; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">⚠️ Intento de Registro No Autorizado</h2>
        </div>
        
        <div style="padding: 20px; background-color: #fff3cd;">
          <p style="color: #856404; font-weight: bold; margin-top: 0;">
            ⚡ Alguien intentó registrarse con datos que NO están en la lista de usuarios autorizados.
          </p>
          
          <h3 style="color: #333;">Datos proporcionados:</h3>
          
          <table style="width: 100%; background-color: white; border-collapse: collapse; border: 1px solid #ddd;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555; background-color: #f8f9fa;">Matrícula:</td>
              <td style="padding: 12px; color: #e84b44; font-weight: bold;">${attemptData.matricula}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555; background-color: #f8f9fa;">Email:</td>
              <td style="padding: 12px; color: #e84b44; font-weight: bold;">${attemptData.email}</td>
            </tr>
            ${attemptData.username ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555; background-color: #f8f9fa;">Usuario deseado:</td>
              <td style="padding: 12px;">${attemptData.username}</td>
            </tr>
            ` : ''}
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555; background-color: #f8f9fa;">IP Address:</td>
              <td style="padding: 12px; font-family: monospace;">${attemptData.ipAddress || 'No disponible'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #555; background-color: #f8f9fa;">Fecha/Hora:</td>
              <td style="padding: 12px;">${attemptData.timestamp.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
            <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold;">
              🔍 Posibles acciones:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Si es un usuario legítimo, agrégalo a la tabla <code>authorized_users</code></li>
              <li>Si es sospechoso, monitorea intentos desde esta IP</li>
              <li>Revisa si los datos coinciden parcialmente con algún registro autorizado</li>
            </ul>
          </div>
          
          <div style="margin-top: 15px; padding: 15px; background-color: #f8d7da; border-left: 4px solid #e84b44;">
            <p style="margin: 0; color: #721c24;">
              ⚠️ <strong>Acción requerida:</strong> Verifica si este usuario debe ser agregado a la lista de autorizados.
            </p>
          </div>
        </div>
        
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px; background-color: #f5f5f5;">
          <p style="margin: 0;">Micrositio Seguro - Sistema de Alertas de Seguridad</p>
          <p style="margin: 5px 0 0 0;">Esta es una notificación automática</p>
        </div>
      </div>
    `
    
    const text = `
⚠️ INTENTO DE REGISTRO NO AUTORIZADO

Alguien intentó registrarse con datos que NO están autorizados:

DATOS PROPORCIONADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Matrícula:    ${attemptData.matricula}
Email:        ${attemptData.email}
${attemptData.username ? `Usuario:      ${attemptData.username}` : ''}
IP Address:   ${attemptData.ipAddress || 'No disponible'}
Fecha/Hora:   ${attemptData.timestamp.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCIÓN REQUERIDA:
Si es un usuario legítimo, agrégalo a authorized_users en la base de datos.

Micrositio Seguro - Sistema de Alertas
    `
    
    await sendMail(ADMIN_EMAIL, subject, html, text)
    logger.info('Admin notified of unauthorized attempt', { 
      email: attemptData.email,
      matricula: attemptData.matricula 
    })
  } catch (err: any) {
    logger.error('Failed to notify admin of unauthorized attempt', { 
      error: err?.message || err 
    })
    // Don't throw - notification failure shouldn't block the error response
  }
}

/**
 * Send notification when user tries to register but already has an account
 */
export async function notifyAdminDuplicateAttempt(attemptData: {
  email: string
  matricula: string
  existingUsername: string
  ipAddress?: string
  timestamp: Date
}) {
  try {
    const subject = 'ℹ️ Intento de registro duplicado - Micrositio'
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3570da; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">ℹ️ Intento de Registro Duplicado</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f5f5f5;">
          <p style="color: #333; margin-top: 0;">
            Un usuario que ya tiene cuenta intentó registrarse nuevamente.
          </p>
          
          <h3 style="color: #333;">Información:</h3>
          
          <table style="width: 100%; background-color: white; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 12px;">${attemptData.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555;">Matrícula:</td>
              <td style="padding: 12px;">${attemptData.matricula}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555;">Usuario existente:</td>
              <td style="padding: 12px; color: #3570da; font-weight: bold;">${attemptData.existingUsername}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; color: #555;">IP Address:</td>
              <td style="padding: 12px;">${attemptData.ipAddress || 'No disponible'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #555;">Fecha/Hora:</td>
              <td style="padding: 12px;">${attemptData.timestamp.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #d1ecf1; border-left: 4px solid #3570da;">
            <p style="margin: 0; color: #0c5460;">
              ℹ️ El sistema rechazó el registro y redirigió al usuario a la página de inicio de sesión.
            </p>
          </div>
        </div>
        
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">Micrositio Seguro - Notificación Informativa</p>
        </div>
      </div>
    `
    
    const text = `
INTENTO DE REGISTRO DUPLICADO

Un usuario que ya tiene cuenta intentó registrarse:

Email:     ${attemptData.email}
Matrícula: ${attemptData.matricula}
Usuario:   ${attemptData.existingUsername}
IP:        ${attemptData.ipAddress || 'No disponible'}
Fecha:     ${attemptData.timestamp.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}

El sistema redirigió al usuario a la página de inicio de sesión.
    `
    
    await sendMail(ADMIN_EMAIL, subject, html, text)
    logger.info('Admin notified of duplicate registration attempt', { email: attemptData.email })
  } catch (err: any) {
    logger.error('Failed to notify admin of duplicate attempt', { error: err?.message || err })
  }
}

export default {
  notifyAdminNewRegistration,
  notifyAdminUnauthorizedAttempt,
  notifyAdminDuplicateAttempt
}
