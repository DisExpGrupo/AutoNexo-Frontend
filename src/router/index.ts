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
          path: 'workshop',
          name: 'my-workshop',
          component: () => import('@/modules/workshop/views/MyWorkshopView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'requests',
          name: 'service-requests-hub',
          component: () => import('@/modules/workshop/views/ServiceRequestsView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'agenda',
          name: 'workshop-agenda',
          component: () => import('@/modules/matching/views/WorkshopAgendaView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'vehicles',
          name: 'vehicles',
          component: () => import('@/modules/vehicles/views/VehiclesView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'vehicles/register',
          name: 'vehicle-registration',
          component: () => import('@/modules/vehicles/views/VehicleRegistrationView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'vehicles/:id',
          name: 'vehicle-detail',
          component: () => import('@/modules/vehicles/views/VehicleDetailView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'service-requests/new',
          name: 'create-service-request',
          component: () => import('@/modules/matching/views/CreateServiceRequestView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'service-requests',
          name: 'car-owner-requests',
          component: () => import('@/modules/matching/views/CarOwnerRequestsView.vue'),
          meta: { verificationRequired: true },
        },
        {
          path: 'service-requests/:id',
          name: 'service-request-detail',
          component: () => import('@/modules/matching/views/ServiceRequestDetailView.vue'),
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
    isVerified &&
    !to.path.startsWith('/workshop/register')
  ) {
    return { name: 'workshop-registration' };
  }

  if (isWorkshopManager && authStore.workshopId !== null && to.path === '/workshop/register') {
    return { name: 'dashboard' };
  }
});

export default router;