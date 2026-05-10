import { defineStore } from 'pinia';
import { authService } from '../services/auth.service';
import type { 
  AuthResponse, 
  SignInRequest, 
  SignUpRequest, 
  User, 
  VerifyEmailRequest 
} from '../models/auth.model';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null as string | null,
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isVerified: (state) => state.user?.isVerified || false,
    userRole: (state) => state.user?.roles[0] || null,
  },

  actions: {
    async login(credentials: SignInRequest) {
      this.loading = true;
      this.error = null;
      try {
        const response: AuthResponse = await authService.signIn(credentials);
        
        // Guardar en el estado
        this.token = response.token;
        this.user = response.user;

        // Persistir en localStorage (necesario para el Wiring que hicimos)
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      } catch (err: unknown) {
        const error = err as any;
        this.error = error.response?.data?.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async register(data: SignUpRequest) {
      this.loading = true;
      try {
        await authService.signUp(data);
      } finally {
        this.loading = false;
      }
    },

    async verify(data: VerifyEmailRequest) {
      this.loading = true;
      try {
        await authService.verifyEmail(data);
        // Actualizamos el estado local tras verificar con éxito
        if (this.user) {
          this.user.isVerified = true;
          localStorage.setItem('user', JSON.stringify(this.user));
        }
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  }
});