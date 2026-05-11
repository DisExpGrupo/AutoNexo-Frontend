import { defineStore } from 'pinia';
import { authService } from '../services/auth.service';
import type {
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  User,
  VerifyEmailRequest
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
        this.user.isVerified = true;
        this.workshopId = response.user.workshopId;

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        localStorage.setItem('workshopId', JSON.stringify(this.workshopId));
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

    async verify(_data: VerifyEmailRequest) {
      this.loading = true;
      try {
        // Bypass: mark as verified without API call
        if (this.user) {
          this.user.isVerified = true;
          localStorage.setItem('user', JSON.stringify(this.user));
        }
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