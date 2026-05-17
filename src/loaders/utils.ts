import { useAuthStore } from '../store/authStore'
import { getCurrentUser } from '../services/authService'

export async function getAuthUser() {
  const state = useAuthStore.getState()
  if (state.user) return state.user
  
  // Try to get from firebase directly
  const user = await getCurrentUser()
  return user
}
