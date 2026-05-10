import http from '@/lib/apiClient';
import type { 
  SignInRequest, 
  SignUpRequest, 
  VerifyEmailRequest, 
  AuthResponse 
} from '../models/auth.model';

const BASE_URL = '/v1/users';

export const authService = {
  /**
   * Registra un nuevo usuario (Car Owner o Workshop Owner)
   */
  async signUp(data: SignUpRequest): Promise<string> {
    const response = await http.post<string>(`${BASE_URL}/signup`, data);
    return response.data;
  },

  /**
   * Inicia sesión y obtiene el JWT + Datos del usuario
   */
  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>(`${BASE_URL}/signin`, data);
    return response.data;
  },

  /**
   * Verifica el email usando el token UUID enviado por correo.
   * Nota: El interceptor adjuntará el Bearer Token automáticamente.
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<string> {
    const response = await http.post<string>(`${BASE_URL}/verify-email`, data);
    return response.data;
  }
};