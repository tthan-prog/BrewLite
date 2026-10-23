export type Role = 'CUSTOMER' | 'STAFF';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}
