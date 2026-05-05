import { useAuthStore } from '../store/authStore'
import { getCurrentUser } from '../services/authService'

export async function requireAuth() {
  let user = useAuthStore.getState().user
  if (!user) {
    user = await getCurrentUser()
  }
  if (!user) {
    // We could throw a redirect, but AuthGuard handles it.
    // For now, we'll just return null or throw.
    // Let's wait for auth state if it's loading?
  }
  return user
}
