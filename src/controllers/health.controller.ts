import { Request, Response } from 'express'

export const health = (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() })
}
