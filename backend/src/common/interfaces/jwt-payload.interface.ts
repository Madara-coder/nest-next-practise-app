import { Role } from '../enums/role.enum.js';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: Role;
}
