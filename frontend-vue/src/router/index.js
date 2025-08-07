import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Views
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import CreateQR from '../views/CreateQR.vue'
import ScanQR from '../views/ScanQR.vue'
import FaceRegistration from '../views/FaceRegistration.vue'
import TeacherSetup from '../views/TeacherSetup.vue'
import SessionDetail from '../views/SessionDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/create-qr',
    name: 'CreateQR',
    component: CreateQR,
    meta: { requiresAuth: true }
  },
  {
    path: '/scan',
    name: 'ScanQR',
    component: ScanQR,
    meta: { requiresAuth: false }
  },
  {
    path: '/face-registration',
    name: 'FaceRegistration',
    component: FaceRegistration,
    meta: { requiresAuth: false }
  },
  {
    path: '/teacher-setup',
    name: 'TeacherSetup',
    component: TeacherSetup,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/session/:sessionId',
    name: 'SessionDetail',
    component: SessionDetail,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If going to login page, just proceed
  if (to.path === '/') {
    next()
    return
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      // Only check auth if not already checked
      if (!authStore.authChecked) {
        try {
          await authStore.checkAuthStatus()
          if (!authStore.isAuthenticated) {
            next('/')
            return
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          next('/')
          return
        }
      } else {
        // Auth already checked and failed, redirect to login
        next('/')
        return
      }
    }
  }
  
  next()
})

export default router 