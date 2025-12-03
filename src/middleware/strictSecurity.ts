import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Register strict security headers and CSP using Helmet.
 *
 * Usage: import { registerStrictSecurity } from './middleware/strictSecurity';
 * registerStrictSecurity(app);
 *
 * Notes:
 * - Adjust CSP directives for third-party scripts/styles if necessary (use nonces or SRI).
 * - Ensure TLS is enabled in production to rely on HSTS.
 */
export function registerStrictSecurity(app: Express) {
  // Basic Helmet defaults
  app.use(helmet());

  // Content Security Policy: allow only same-origin scripts/styles/images/connect
  // Scripts: only 'self' (no inline scripts unless you add nonces or hashes)
  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // keep 'unsafe-inline' only if you need inline styles (e.g., Tailwind preflight)
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    })
  );

  // Prevent clickjacking
  app.use(helmet.frameguard({ action: 'deny' }));

  // Prevent MIME sniffing
  app.use(helmet.noSniff());

  // HSTS - only in production. We still register it but you can disable based on NODE_ENV.
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );

  // Referrer Policy
  app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

  // Permissions-Policy (formerly Feature-Policy) - lock down powerful features.
  // Adjust this per-app if you need to enable anything.
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Deny commonly risky features by default
    // example: camera=(), microphone=(), geolocation=(), interest-cohort=()
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), gyroscope=(), accelerometer=(), magnetometer=(), interest-cohort=()'
    );
    next();
  });

  // Extra: ensure X-Powered-By is removed (helmet does this by default, but be explicit)
  app.disable('x-powered-by');
}

export default registerStrictSecurity;
