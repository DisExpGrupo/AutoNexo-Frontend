import { defineStore } from 'pinia';
import { authService } from '../services/auth.service';
import { parseApiError } from '@/lib/apiError';
import type {
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  User,
  ErrorResponse,
} from '../models/auth.model';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null as string | null,
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    workshopId: JSON.parse(localStorage.getItem('workshopId') || 'null') as number | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isVerified: (state) => state.user?.isVerified || false,
    userRole: (state) => state.user?.roles?.[0] || null,
  },

  actions: {
    async login(credentials: SignInRequest) {
      this.loading = true;
      this.error = null;
      try {
        const response: AuthResponse = await authService.signIn(credentials);

        this.token = response.token;
        this.user = response.user;
        this.workshopId = response.user.workshopId;

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('workshopId', JSON.stringify(this.workshopId));
      } catch (err: unknown) {
        const parsed = parseApiError(err) as ErrorResponse;
        this.error = parsed.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async register(data: SignUpRequest) {
      this.loading = true;
      this.error = null;
      try {
        await authService.signUp(data);
      } catch (err: unknown) {
        const parsed = parseApiError(err) as ErrorResponse;
        this.error = parsed.errorCode;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setWorkshopId(id: number | null) {
      this.workshopId = id;
      localStorage.setItem('workshopId', JSON.stringify(id));
    },

    logout() {
      this.token = null;
      this.user = null;
      this.workshopId = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('workshopId');
    }
  }
});