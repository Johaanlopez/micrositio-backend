# Pruebas de seguridad (Jest)

Esta carpeta contiene una suite de pruebas orientadas a seguridad usando Jest + Supertest para la API del backend.

Qué cubren las pruebas
- Intentos de inyección SQL (endpoints de login y contenido)
- Intentos de XSS en campos de contenido
- Rate limiting (intentos excesivos de login)
- Rechazo de JWT expirados
- Protección CSRF para peticiones que cambian estado
- Rechazo de contraseñas débiles en el registro
- Rechazo de códigos TOTP inválidos para 2FA

Requisitos previos
- Tener Node.js y npm instalados.
- El backend debe exportar la aplicación Express desde `backend/src/app.ts` (por ejemplo `export default app;`) para que las pruebas puedan importarla.
- Configurar variables de entorno para la ejecución de pruebas (por ejemplo `.env.test` o exportarlas en la sesión). Variables importantes:
  - `JWT_SECRET` (usada para firmar/validar tokens en las pruebas)
  - `SMTP_*` si la aplicación inicializa el envío de correos (no es obligatorio para todas las pruebas)

Instalar dependencias de desarrollo (en la carpeta `backend`):

```powershell
cd /d "C:\Users\johan\Desktop\Micrositio\backend"
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest jsonwebtoken @types/jsonwebtoken

# Opcional (si no está instalado):
npm install --save-dev cross-env
```

Configuración de Jest (ejemplo)
- Añade en la raíz del backend un `jest.config.js` con `preset: 'ts-jest'` y `testEnvironment: 'node'`.

Ejecutar las pruebas

```powershell
cd /d "C:\Users\johan\Desktop\Micrositio\backend"
# ejecutar todas las pruebas
npx jest --runInBand

# o mediante un script npm después de agregarlo en package.json
npm run test
```

Notas y supuestos
- Estas pruebas asumen los siguientes endpoints: `/api/auth/login`, `/api/auth/register`, `/api/content/posts` (POST y GET), `/api/auth/verify-2fa`. Si tus rutas son diferentes, actualiza los archivos de prueba.
- Para la prueba de CSRF: el servidor debe implementar protección CSRF (por ejemplo `csurf`). Si el servidor no tiene CSRF habilitado, esa prueba fallará — decide si implementar CSRF o saltarla.
- Para las pruebas de rate-limiting: los límites dependen de tu configuración. La prueba envía 15 intentos; ajusta la variable `attempts` en `rate_limit.test.ts` para que coincida con tus límites.
- Para la prueba de JWT expirado: asegúrate de que `JWT_SECRET` sea el mismo que usa el servidor en el entorno de pruebas.

Dónde configurar la conexión a la base de datos
- El backend carga variables desde un archivo `.env` en la raíz de `backend` (usa `backend/.env.example` como plantilla). Para la conexión a Postgres puedes:
  - Usar `DATABASE_URL` en formato `postgres://user:password@host:port/database`, o
  - Exportar las variables individuales `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

Ejemplo mínimo (en Windows `cmd.exe`) antes de ejecutar los scripts de DB o arrancar la app:

```cmd
cd C:\Users\johan\Desktop\Micrositio\backend
set PGHOST=localhost
set PGPORT=5432
set PGUSER=micrositio_user        # <-- sustituye por tu usuario
set PGPASSWORD=tu_password_segura # <-- sustituye por tu contraseña
set PGDATABASE=micrositio_dev     # <-- sustituye por el nombre de la BD
```

O, usando `DATABASE_URL`:

```cmd
set DATABASE_URL=postgres://micrositio_user:tu_password_segura@localhost:5432/micrositio_dev
```

Ejecutar inicialización y seed (después de configurar las variables):

```cmd
npm run db:init
npm run db:seed
```

Si alguno de estos valores (usuario, contraseña, nombre de BD, host o puerto) debe ser elegido por ti, por favor indícamelos y no usaré nombres genéricos: en caso contrario, te puedo proponer valores por defecto que luego tú reemplazarás en `backend/.env`.

Si quieres, puedo:
- Añadir `jest.config.js` y un script de prueba en `backend/package.json`.
- Parchear `backend/src/app.ts` para exportar la app Express como default si actualmente se exporta de otra forma.
- Mockear dependencias externas (BD, servicios de WP, correo) para que las pruebas sean deterministas en CI.
