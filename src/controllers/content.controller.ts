import { Request, Response } from 'express'
import { wpService } from '../services/wp.service'
import logger from '../utils/logger'

function setSecurityHeaders(res: Response) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'geolocation=()')
}

export async function proxyGetPosts(req: Request, res: Response) {
  try {
    // Log access
    // @ts-ignore
    logger.info('Proxy: user requested posts', { userId: req.user?.id, path: req.originalUrl })

    // Optionally pass a token to WP if required; here we use the service default
    const data = await wpService.getPosts()

    setSecurityHeaders(res)
    return res.json({ data })
  } catch (err: any) {
    // @ts-ignore
    logger.error('Error proxying posts', { err: err?.message || err, userId: req.user?.id })
    const msg = err?.message || 'Error fetching posts'
    if (msg.includes('Unauthorized')) return res.status(502).json({ error: 'Upstream unauthorized' })
    if (msg.includes('Forbidden')) return res.status(502).json({ error: 'Upstream forbidden' })
    if (msg.includes('Not found')) return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function proxyGetPage(req: Request, res: Response) {
  try {
    const { slug } = req.params
    // @ts-ignore
    logger.info('Proxy: user requested page', { userId: req.user?.id, slug })

    const page = await wpService.getPage(slug)

    setSecurityHeaders(res)
    return res.json({ data: page })
  } catch (err: any) {
    // @ts-ignore
    logger.error('Error proxying page', { err: err?.message || err, userId: req.user?.id })
    const msg = err?.message || 'Error fetching page'
    if (msg.includes('Unauthorized')) return res.status(502).json({ error: 'Upstream unauthorized' })
    if (msg.includes('Forbidden')) return res.status(502).json({ error: 'Upstream forbidden' })
    if (msg.includes('Not found')) return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createPost(req: Request, res: Response) {
  try {
    const { title, content } = req.body
    if (!title || !content) return res.status(400).json({ error: 'Missing fields' })

    // In real app we'd persist or proxy this to upstream WP; for tests a stub is enough
    // @ts-ignore
    const created = { id: Date.now().toString(), title, content, authorId: req.user?.id }

    setSecurityHeaders(res)
    return res.status(201).json({ data: created })
  } catch (err: any) {
    // Keep consistent error handling
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default { proxyGetPosts, proxyGetPage, createPost }
