import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../store/auth.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/connect',
      name: 'connect',
      component: () => import('../views/ConnectView.vue')
    },
    {
      path: '/dev-login',
      name: 'dev-login',
      component: () => import('../views/DevLoginView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bills',
      name: 'bills',
      component: () => import('../views/BillsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
      meta: { requiresAuth: true, requiresMainUser: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, requiresMainUser: true }
    },
    {
      path: '/calculator',
      name: 'calculator',
      component: () => import('../views/BillingCalculatorView.vue'),
      meta: { requiresAuth: true, requiresMainUser: true }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/AnalyticsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const { isAuthenticated, isMainUser, loadProfile } = useAuth();
  
  if (to.meta.requiresAuth) {
    if (!isAuthenticated.value) {
      next('/login');
      return;
    }
    
    // Load profile if not loaded
    if (!useAuth().user.value) {
      loadProfile().then(() => {
        checkAccess();
      }).catch(() => {
        next('/login');
      });
    } else {
      checkAccess();
    }
  } else {
    // If already logged in, redirect to dashboard
    if (isAuthenticated.value && (to.path === '/login' || to.path === '/register' || to.path === '/connect')) {
      next('/dashboard');
    } else {
      next();
    }
  }
  
  function checkAccess() {
    if (to.meta.requiresMainUser && !isMainUser.value) {
      next('/dashboard');
    } else {
      next();
    }
  }
});

export default router;
