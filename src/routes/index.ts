import { Router } from 'express'
import healthRoutes from './health.routes'
import authRoutes from './auth.routes'
import contentRoutes from './content.routes'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/content', contentRoutes)

export default router
