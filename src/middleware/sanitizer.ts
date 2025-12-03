import { Request, Response, NextFunction } from 'express'

// Simple sanitizer: escapes characters that could be used for XSS in string inputs
// This is intentionally conservative and aimed at request-level sanitization.
// For rich HTML inputs you should use a proper sanitizer library and white-listing.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeObject)
  const out: any = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = escapeHtml(v)
    else if (typeof v === 'object') out[k] = sanitizeObject(v)
    else out[k] = v
  }
  return out
}

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.body) req.body = sanitizeObject(req.body)
    if (req.query) req.query = sanitizeObject(req.query)
    if (req.params) req.params = sanitizeObject(req.params)
  } catch (err) {
    // Never crash the app due to sanitization
    console.warn('Sanitizer error', err)
  }
  next()
}

export default sanitizeInputs
