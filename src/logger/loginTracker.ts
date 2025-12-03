import logger, { logInfo, logWarn, logError } from './index';
import AlertService from '../services/alert.service';

type Attempt = { ts: number };

// Track failed attempts by key (username or ip). For now track by username then ip.
const failedMap = new Map<string, Attempt[]>();

const THRESHOLD = Number(process.env.ALERT_FAILED_LOGINS_THRESHOLD || 10);
const WINDOW_MIN = Number(process.env.ALERT_FAILED_LOGINS_WINDOW_MIN || 60); // minutes

function nowTs() { return Date.now(); }

function prune(list: Attempt[]) {
  const cutoff = nowTs() - WINDOW_MIN * 60 * 1000;
  while (list.length && list[0].ts < cutoff) list.shift();
}

export async function recordLoginAttempt(opts: { username?: string; ip?: string; success: boolean; reason?: string }) {
  const { username, ip, success, reason } = opts;
  const key = username ? `u:${username}` : `ip:${ip || 'unknown'}`;

  // Log attempt (do not include password or tokens)
  if (success) {
    logInfo('login_success', { username: username ? mask(username) : undefined, ip });
  } else {
    logWarn('login_failed', { username: username ? mask(username) : undefined, ip, reason });
    // track
    const arr = failedMap.get(key) || [];
    arr.push({ ts: nowTs() });
    // keep list sorted by ts ascending
    failedMap.set(key, arr);
    prune(arr);

    if (arr.length >= THRESHOLD) {
      // send alert and clear list to avoid duplicate alerts
      try {
        const subject = `Security alert: ${arr.length} failed login attempts for ${username || ip}`;
        const body = `Detected ${arr.length} failed login attempts within last ${WINDOW_MIN} minutes for ${username || ip} (threshold ${THRESHOLD}).\nPlease review logs and consider temporary lockout or investigation.`;
        await AlertService.sendAlert(subject, body);
        logInfo('alert_sent', { username: username ? mask(username) : undefined, ip, count: arr.length });
      } catch (e) {
        logError('alert_error', { error: (e as Error).message });
      }
      // reset
      failedMap.set(key, []);
    }
  }
}

function mask(s: string) {
  if (!s) return s;
  if (s.length <= 2) return '*'.repeat(s.length);
  return s[0] + '*'.repeat(Math.max(1, s.length - 2)) + s[s.length - 1];
}

export function logProtectedAccess(opts: { userId?: string | number; path: string; method: string; ip?: string }) {
  const { userId, path, method, ip } = opts;
  logInfo('protected_access', { userId, path, method, ip });
}

export function log2FAChange(opts: { userId: string | number; action: 'setup' | 'disable' | 'backup-codes-generated'; ip?: string }) {
  const { userId, action, ip } = opts;
  logInfo('2fa_change', { userId, action, ip });
}

export default { recordLoginAttempt, logProtectedAccess, log2FAChange };
