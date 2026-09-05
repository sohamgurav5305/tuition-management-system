import { Request, Response } from 'express';
import { realtimeHub } from '../utils/eventEmitter';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

export class EventController {
  public static stream(req: Request, res: Response): void {
    // SSE requires these specific headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx/proxies
    res.flushHeaders?.();

    // Optionally extract user from token if passed as query param (EventSource does not support custom headers natively)
    const token = req.query.token as string;
    let userId: string | undefined;
    let role: string | undefined;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        userId = decoded.userId || decoded.id;
        role = decoded.role;
      } catch {
        // Token invalid, still allow connection as guest/general
      }
    }

    const clientId = uuidv4();
    const unregister = realtimeHub.registerClient({
      id: clientId,
      res,
      userId,
      role,
    });

    req.on('close', () => {
      unregister();
      res.end();
    });
  }
}
