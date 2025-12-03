import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import requireAuth from '../middleware/requireAuth'
import { proxyGetPosts, proxyGetPage, createPost } from '../controllers/content.controller'

const router = Router()

// Rate limiter per user: 60 requests per minute
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => {
    // @ts-ignore
    return req.user?.id || req.ip
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Apply requireAuth first, then rate limiter
router.get('/posts', requireAuth, userLimiter, proxyGetPosts)
router.get('/page/:slug', requireAuth, userLimiter, proxyGetPage)
// Allow creating posts (protected) — tests will call POST /api/content/posts to check CSRF/auth
router.post('/posts', requireAuth, userLimiter, createPost)

export default router
