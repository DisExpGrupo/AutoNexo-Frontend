export enum UserRole {
  CAR_OWNER = 'CAR_OWNER',
  WORKSHOP_MANAGER = 'WORKSHOP_MANAGER',
  WORKSHOP_EMPLOYEE = 'WORKSHOP_EMPLOYEE',
  ADMIN = 'ADMIN',
}

export enum ErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  errorCode: ErrorCode
  message: string
  path: string
}

export interface MessageResponse {
  message: string
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


