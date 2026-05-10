import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/iam/views/SignInView.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/modules/iam/views/SignUpView.vue'),
      meta: { public: true }
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/modules/iam/views/VerifyEmailView.vue'),
      meta: { authRequired: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/HomeView.vue'),
      meta: { authRequired: true, verificationRequired: true }
    },
        {
      path: '/test',
      name: 'home',
      component: HomeView
    },
    // Redirección por defecto
    { path: '/', redirect: '/dashboard' }
  ]
});

// EL GUARDIA (Navigation Guard)
router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  
  const isPublic = to.meta.public;
  const authRequired = to.meta.authRequired;
  const verificationRequired = to.meta.verificationRequired;
  const isAuthenticated = authStore.isAuthenticated;
  const isVerified = authStore.isVerified;

  // 1. Si la ruta requiere auth y no está logueado -> Al Login
  if (authRequired && !isAuthenticated) {
    return { name: 'login' };
  }

  // 2. Si está logueado pero no verificado y la ruta requiere verificación -> A Verificar
  if (isAuthenticated && verificationRequired && !isVerified) {
    return { name: 'verify-email' };
  }

  // 3. Si ya está logueado y verificado, y quiere ir a Login/Register -> Al Dashboard
  if (isPublic && to.name !== 'verify-email' && isAuthenticated && isVerified) {
    return { name: 'dashboard' };
  }
});

export default router;