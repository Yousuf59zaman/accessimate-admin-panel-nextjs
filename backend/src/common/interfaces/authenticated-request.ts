import type { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  loginId: string;
  type: 'ADMIN' | 'CITIZEN';
  isDemo: boolean;
  roles: string[];
  permissions: string[];
};

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  requestId?: string;
}
