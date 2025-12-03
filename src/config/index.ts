import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const parseList = (value?: string) => !value ? [] : value.split(',').map(s => s.trim())

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: parseList(process.env.CORS_ALLOWED_ORIGINS),
  wp: {
    baseUrl: process.env.WP_BASE_URL || '',
    authType: (process.env.WP_AUTH_TYPE || 'none') as 'none' | 'basic' | 'jwt',
    basicUser: process.env.WP_BASIC_USER || '',
    basicPass: process.env.WP_BASIC_PASS || '',
    jwtToken: process.env.WP_JWT_TOKEN || ''
  }
}
