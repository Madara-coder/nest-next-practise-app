import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Rate limits per client IP, and per IP + email on routes that take an email
 * (sign in / register). Many real users can share one IP (an office, or the
 * Next.js server itself), so throttling sign-in by IP alone would let one
 * person lock everyone else out.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const body = req.body as { email?: unknown } | undefined;
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const ip = req.ip ?? 'unknown';
    return Promise.resolve(email ? `${ip}:${email}` : ip);
  }
}
