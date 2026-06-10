import http from '@/lib/apiClient';
import type { 
  SignInRequest, 
  SignUpRequest, 
  AuthResponse,
  MessageResponse
} from '../models/auth.model';

const BASE_URL = '/v1/users';

export const authService = {
  async signUp(data: SignUpRequest): Promise<MessageResponse> {
    const response = await http.post<MessageResponse>(`${BASE_URL}/signup`, data);
    return response.data;
  },

  /**
   * Inicia sesión y obtiene el JWT + Datos del usuario
   */
  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>(`${BASE_URL}/signin`, data);
    return response.data;
  },

  };