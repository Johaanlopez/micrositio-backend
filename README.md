# 🔧 Backend — Micrositio CINTLI Montessori

> **Última actualización:** 7 de noviembre, 2025

Servidor Express con TypeScript para el micrositio CINTLI Montessori. Incluye autenticación completa con 2FA, verificación de email, y medidas de seguridad robustas.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura](#estructura)
- [Rutas API](#rutas-api)
- [Base de Datos](#base-de-datos)
- [Seguridad](#seguridad)
- [Testing](#testing)
- [Deployment](#deployment)

---

## ✨ Características

- ✅ **Autenticación JWT** con access y refresh tokens
- ✅ **2FA (Two-Factor Authentication)** con Google Authenticator
- ✅ **Verificación de email** con códigos de 6 dígitos
- ✅ **Recuperación de contraseña** por email
- ✅ **Rate limiting** para prevenir ataques
- ✅ **CORS configurado** por lista blanca
- ✅ **Helmet.js** para headers de seguridad
- ✅ **Logging estructurado** con Winston
- ✅ **Testing** con Jest y Supertest
- ✅ **TypeScript** con compilación a JavaScript
- ✅ **Validación de datos** con Joi
- ✅ **Emails transaccionales** con Nodemailer

---

## 🛠️ Tecnologías

- **Node.js** v16+
- **Express** 4.x
- **TypeScript** 5.x
- **PostgreSQL** (cliente pg)
- **JWT** (jsonwebtoken)
- **Bcrypt** (hashing de contraseñas)
- **Speakeasy** (TOTP para 2FA)
- **QRCode** (generación de QR)
- **Nodemailer** (envío de emails)
- **Winston** (logging)
- **Helmet** (seguridad)
- **Express Rate Limit** (rate limiting)
- **CORS** (control de acceso)
- **Jest** + **Supertest** (testing)

---

## 🚀 Instalación

```cmd
cd /d C:\Users\johan\Desktop\Micrositio\backend
npm install
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Copia el archivo de ejemplo:

```cmd
copy .env.example .env
notepad .env
```

### 2. Configurar `.env`

```env
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SERVIDOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PORT=5001
NODE_ENV=development

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BASE DE DATOS (PostgreSQL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PGHOST=localhost
PGPORT=5432
PGUSER=micrositio_user
PGPASSWORD=tu_password_segura
PGDATABASE=micrositio_dev

# Alternativa: usar DATABASE_URL
# DATABASE_URL=postgres://micrositio_user:tu_password@localhost:5432/micrositio_dev

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# JWT (JSON Web Tokens)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=tu_secreto_jwt_muy_seguro_de_al_menos_32_caracteres_aqui
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh_tokens_aqui

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EMAIL (SMTP)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password_de_gmail
SMTP_FROM=noreply@cintli-montessori.com

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CORS (Orígenes permitidos)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GOOGLE AUTHENTICATOR (2FA)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTP_ISSUER=CINTLI Montessori
TOTP_WINDOW=1
```

### 3. Generar Secretos JWT

```cmd
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia la salida y úsala para `JWT_SECRET` y `JWT_REFRESH_SECRET` (diferentes).

### 4. Configurar Email (Gmail)

Si usas Gmail:

1. Ir a https://myaccount.google.com/security
2. Habilitar "Verificación en 2 pasos"
3. Ir a "Contraseñas de aplicaciones"
4. Generar contraseña para "Correo"
5. Usar esa contraseña en `SMTP_PASS`

---

## 📜 Scripts Disponibles

```cmd
# Desarrollo (con hot-reload)
npm run dev

# Compilar TypeScript a JavaScript
npm run build

# Producción (requiere build primero)
npm start

# Tests unitarios e integración
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Inicializar base de datos (crear tablas)
npm run db:init

# Insertar datos de ejemplo
npm run db:seed

# Limpiar base de datos
npm run db:clean
```

---

## 📁 Estructura

```
backend/
├── src/                          # Código fuente TypeScript
│   ├── controllers/             # Lógica de negocio
│   │   ├── auth.controller.ts
│   │   ├── login.controller.ts
│   │   ├── register.controller.ts
│   │   ├── setup2fa.controller.ts
│   │   ├── verify2fa.controller.ts
│   │   ├── verify.controller.ts
│   │   ├── send-email-code.controller.ts
│   │   ├── me.controller.ts
│   │   ├── refresh.controller.ts
│   │   ├── logout.controller.ts
│   │   ├── forgot.password.controller.ts
│   │   └── reset.password.controller.ts
│   ├── models/                  # Modelos de datos
│   │   ├── user.model.ts
│   │   ├── session.model.ts
│   │   ├── emailVerification.model.ts
│   │   └── passwordReset.model.ts
│   ├── routes/                  # Definición de rutas
│   │   ├── index.ts            # Router principal
│   │   ├── auth.routes.ts
│   │   └── content.routes.ts
│   ├── middleware/              # Middlewares
│   │   ├── auth.middleware.ts   # Autenticación JWT
│   │   ├── error.middleware.ts  # Manejo de errores
│   │   ├── security.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── services/                # Servicios
│   │   ├── jwt.service.ts       # Generación/validación JWT
│   │   ├── email.service.ts     # Envío de emails
│   │   ├── crypto.service.ts    # Generación de códigos
│   │   └── totp.service.ts      # TOTP para 2FA
│   ├── db/                      # Base de datos
│   │   ├── index.ts            # Pool de conexiones
│   │   └── migrations/         # Migraciones SQL
│   ├── scripts/                 # Scripts de utilidad
│   │   ├── init-db.ts          # Inicializar BD
│   │   └── seed-db.ts          # Semillas
│   ├── logger/                  # Logging
│   │   └── index.ts
│   ├── types/                   # Tipos TypeScript
│   │   └── express.d.ts
│   ├── utils/                   # Utilidades
│   │   └── logger.ts
│   ├── app.ts                   # Configuración Express
│   └── server.ts                # Punto de entrada
│
├── dist/                        # Código compilado (JavaScript)
│   └── ... (misma estructura que src/)
│
├── test/                        # Tests
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── login-flow.test.ts
│   │   └── email-verification.test.ts
│   └── unit/
│       ├── jwt.service.test.ts
│       └── crypto.service.test.ts
│
├── logs/                        # Archivos de log
│   ├── combined.log
│   └── error.log
│
├── scripts/                     # Scripts Node.js
│   ├── get-latest-code.js      # Obtener código de verificación
│   ├── create-admin-db.js      # Crear BD como admin
│   └── run-seed.js             # Ejecutar seed
│
├── .env                         # Variables de entorno (NO en git)
├── .env.example                 # Ejemplo de variables
├── .gitignore
├── jest.config.js              # Configuración de Jest
├── tsconfig.json               # Configuración TypeScript
├── tsconfig.test.json          # TypeScript para tests
├── package.json
└── README.md                   # Este archivo
```

---

## 🛣️ Rutas API

Todas las rutas están montadas bajo el prefijo `/api`.

### Rutas de Autenticación (`/api/auth`)

#### Públicas (no requieren token)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Registro de usuario | `{ matricula, email, username, tutorName, phone, password, confirmPassword, acceptTerms }` |
| `POST` | `/api/auth/login` | Login | `{ emailOrUsername, password }` |
| `POST` | `/api/auth/verify-email` | Verificar email | `{ email, code }` |
| `POST` | `/api/auth/send-email-code` | Reenviar código | `{ userId }` |
| `POST` | `/api/auth/setup-2fa` | Obtener QR 2FA | `{ userId }` o header `Authorization` |
| `POST` | `/api/auth/verify-2fa` | Verificar TOTP | `{ tempToken, totpCode }` o `{ userId, totpCode }` |
| `POST` | `/api/auth/refresh` | Refrescar token | Cookie httpOnly |
| `POST` | `/api/auth/logout` | Cerrar sesión | Cookie httpOnly |
| `POST` | `/api/auth/forgot-password` | Solicitar reset | `{ email }` |
| `POST` | `/api/auth/reset-password` | Resetear password | `{ email, code, newPassword }` |

#### Protegidas (requieren header `Authorization: Bearer {token}`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Datos del usuario actual |

### Rutas de Contenido (`/api/content`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/content/posts` | Listar posts (proxy a WordPress) |
| `GET` | `/api/content/page/:slug` | Obtener página (proxy a WordPress) |

---

## 🗄️ Base de Datos

### Tablas

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  tutor_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  totp_secret TEXT,                    -- Secreto TOTP para 2FA
  backup_codes TEXT[],                 -- Códigos de respaldo
  is_active BOOLEAN DEFAULT FALSE,     -- Activado después de verificar email
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `sessions`
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,                 -- Refresh token
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `email_verifications`
```sql
CREATE TABLE email_verifications (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,       -- Expira en 30 minutos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `password_resets`
```sql
CREATE TABLE password_resets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,       -- Expira en 30 minutos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Comandos de BD

```cmd
# Inicializar (crear tablas)
npm run db:init

# Insertar datos de prueba
npm run db:seed

# Limpiar todas las tablas
npm run db:clean
```

---

## 🔒 Seguridad

### Medidas Implementadas

#### 1. **Contraseñas**
- Hash con bcrypt (10 rounds)
- Validación de complejidad mínima
- Nunca se almacenan en texto plano

#### 2. **JWT Tokens**
- Access token: 15 minutos de vida
- Refresh token: 7 días (httpOnly cookie)
- Firmados con HS256
- Secretos separados para access y refresh

#### 3. **2FA (TOTP)**
- Algoritmo SHA-1
- Ventana de 30 segundos
- 10 códigos de respaldo por usuario
- QR code generado dinámicamente

#### 4. **Rate Limiting**
- 100 requests por 15 minutos por IP
- Aplicado a rutas de autenticación
- Headers informativos en respuesta

#### 5. **CORS**
- Lista blanca de orígenes permitidos
- Credenciales habilitadas (`credentials: true`)
- Configurado en `CORS_ALLOWED_ORIGINS`

#### 6. **Headers de Seguridad (Helmet)**
- `X-DNS-Prefetch-Control`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-Download-Options: noopen`
- `X-XSS-Protection`

#### 7. **Validación de Datos**
- Joi schemas en todos los endpoints
- Sanitización de inputs
- Validación de tipos

#### 8. **Códigos de Verificación**
- 6 dígitos numéricos
- Generados con crypto.randomInt (seguro)
- Expiran en 30 minutos
- Un solo uso (se eliminan después de validar)

---

## 🧪 Testing

### Ejecutar Tests

```cmd
# Todos los tests
npm test

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# Solo tests de integración
npm test -- test/integration

# Solo tests unitarios
npm test -- test/unit
```

### Cobertura Actual

| Tipo | Cobertura |
|------|-----------|
| **Statements** | ~80% |
| **Branches** | ~75% |
| **Functions** | ~78% |
| **Lines** | ~80% |

### Tests Incluidos

**Integración:**
- ✅ Flujo completo de registro
- ✅ Flujo completo de login con 2FA
- ✅ Verificación de email
- ✅ Setup y verificación de 2FA
- ✅ Refresh de tokens
- ✅ Logout
- ✅ Recuperación de contraseña

**Unitarios:**
- ✅ Servicios JWT
- ✅ Servicios de crypto
- ✅ Generación de TOTP
- ✅ Validación de códigos

---

## 🚢 Deployment

### Build para Producción

```cmd
# 1. Compilar TypeScript
npm run build

# 2. Verificar que dist/ se generó
dir dist

# 3. Configurar variables de entorno de producción
# Editar .env con valores de producción

# 4. Ejecutar en producción
npm start
```

### Variables de Entorno Críticas (Producción)

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgres://user:pass@host:5432/dbname
JWT_SECRET=<secreto-fuerte-produccion>
JWT_REFRESH_SECRET=<otro-secreto-fuerte>
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
CORS_ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
```

### Plataformas Recomendadas

- **Railway.app** (fácil, PostgreSQL incluido)
- **Render.com** (free tier disponible)
- **Heroku** (clásico, PostgreSQL add-on)
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**
- **Google Cloud Run**

---

## 📊 Logging

Los logs se guardan en `logs/`:

- `combined.log` - Todos los logs
- `error.log` - Solo errores

**Ver logs recientes:**
```cmd
type logs\combined.log | more
type logs\error.log | more
```

**Niveles de log:**
- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `http` - Requests HTTP
- `debug` - Debugging (solo en desarrollo)

---

## 🛠️ Scripts de Utilidad

### Obtener Último Código de Verificación

```cmd
node scripts\get-latest-code.js
```

Útil para desarrollo cuando necesitas el código de email sin configurar SMTP.

### Crear Usuario de Prueba

```cmd
node scripts\create-test-user.js
```

Crea un usuario con 2FA ya configurado para testing rápido.

---

## 🔧 Troubleshooting

### Error: `ECONNREFUSED 127.0.0.1:5432`

**Causa:** PostgreSQL no está corriendo

**Solución:**
```cmd
REM Verificar servicio
sc query postgresql-x64-14

REM Iniciar servicio
net start postgresql-x64-14
```

---

### Error: `JWT_SECRET is not defined`

**Causa:** Falta variable de entorno

**Solución:**
Verificar que `.env` existe y tiene `JWT_SECRET` configurado.

---

### Error: `relation "users" does not exist`

**Causa:** Tablas no creadas

**Solución:**
```cmd
npm run db:init
```

---

### Logs muestran "Invalid SMTP credentials"

**Causa:** Credenciales SMTP incorrectas

**Solución:**
- Verificar `SMTP_USER` y `SMTP_PASS` en `.env`
- Para Gmail, usar "App Password" no la contraseña normal

---

## 📚 Más Información

Ver también:
- `/README.md` - Documentación general del proyecto
- `/VERIFICACION_FLUJO_COMPLETO.md` - Análisis de flujos
- `/ESPECIFICACIONES_IMAGENES.md` - Especificaciones de imágenes
- `test/` - Ejemplos de uso en tests

---

## 📝 Changelog

### v1.0.0 (7 de noviembre, 2025)

- ✅ Sistema completo de autenticación
- ✅ 2FA con Google Authenticator
- ✅ Verificación de email
- ✅ Recuperación de contraseña
- ✅ Rate limiting configurado
- ✅ CORS con lista blanca
- ✅ Logging estructurado
- ✅ Tests de integración y unitarios
- ✅ Documentación completa

---

**Estado:** 🟢 Producción Ready

**Puerto por defecto:** 5001

**Desarrollado para CINTLI Montessori** 🎓
