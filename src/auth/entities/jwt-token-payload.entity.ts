import { UserRole } from '@/db/schema/index';

export class JwtTokenPayload {
  sub!: number; // User ID
  username!: string; // Username of the user
  role!: UserRole; // User role, e.g., 'admin', 'user'
  departmentId: number;
}
