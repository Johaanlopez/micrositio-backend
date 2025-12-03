
declare global {
  namespace Express {
    interface Request {
      logFailedLogin?: (details: { reason?: string; emailOrUsername?: string }) => void;
      user?: any;
    }
  }
}

