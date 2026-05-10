import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import MainLayout from '@/shared/layouts/MainLayout.vue';
import { UserRole } from '@/modules/iam/models/auth.model';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/iam/views/SignInView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/modules/iam/views/SignUpView.vue'),
      meta: { public: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/modules/iam/views/VerifyEmailView.vue'),
      meta: { authRequired: true },
    },
    {
      path: '/',
      component: MainLayout,
      meta: { authRequired: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'workshop/register',
          name: 'workshop-registration',
          component: () => import('@/modules/workshop/views/WorkshopRegistrationView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'test',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  const isPublic = to.meta.public;
  const authRequired = to.meta.authRequired;
  const verificationRequired = to.matched.some((r) => r.meta.verificationRequired);
  const isAuthenticated = authStore.isAuthenticated;
  const isVerified = authStore.isVerified;
  const isWorkshopManager = authStore.userRole === UserRole.WORKSHOP_MANAGER;

  if (authRequired && !isAuthenticated) {
    return { name: 'login' };
  }

  if (isAuthenticated && verificationRequired && !isVerified) {
    return { name: 'verify-email' };
  }

  if (isPublic && to.name !== 'verify-email' && isAuthenticated && isVerified) {
    return { name: 'dashboard' };
  }

  if (
    isWorkshopManager &&
    authStore.workshopId === null &&
    !to.path.startsWith('/workshop/register')
  ) {
    return { name: 'workshop-registration' };
  }
});

export default router;