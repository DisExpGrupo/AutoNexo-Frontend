export enum UserRole {
  CAR_OWNER = 'CAR_OWNER',
  WORKSHOP_OWNER = 'WORKSHOP_OWNER',
  WORKSHOP_STAFF = 'WORKSHOP_STAFF',
  ADMIN = 'ROLE_ADMIN'
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isVerified: boolean;
  active: boolean;
  roles: UserRole[];
  workshopId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  requestedRole: UserRole;
  invitationCode?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}