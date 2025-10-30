import { Request } from 'express';
import { JwtTokenPayload } from '@/auth/entities/jwt-token-payload.entity';

export interface AuthenticatedRequest extends Request {
  user: JwtTokenPayload;
}
