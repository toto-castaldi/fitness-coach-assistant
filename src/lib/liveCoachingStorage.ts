/**
 * Local storage utility for persisting Live Coaching UI state
 */

const STORAGE_KEY_PREFIX = 'helix_live_coaching_'
const STALE_HOURS = 24

export interface LiveCoachingState {
  selectedDate: string
  liveSessionIds: string[]
  step: 'select-date' | 'live' | 'summary'
  currentClientIndex: number
  startedAt: string // ISO timestamp - for invalidating stale sessions
}

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`
}

/**
 * Save live coaching state to localStorage
 */
export function saveLiveCoachingState(userId: string, state: LiveCoachingState): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save live coaching state:', error)
  }
}

/**
 * Load live coaching state from localStorage
 * Returns null if no state exists or if the state is stale (>24h)
 */
export function loadLiveCoachingState(userId: string): LiveCoachingState | null {
  try {
    const stored = localStorage.getItem(getStorageKey(userId))
    if (!stored) return null

    const state = JSON.parse(stored) as LiveCoachingState

    // Check if state is stale (older than STALE_HOURS)
    const startedAt = new Date(state.startedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > STALE_HOURS) {
      // State is too old, clear it
      clearLiveCoachingState(userId)
      return null
    }

    return state
  } catch (error) {
    console.error('Failed to load live coaching state:', error)
    return null
  }
}

/**
 * Clear live coaching state from localStorage
 */
export function clearLiveCoachingState(userId: string): void {
  try {
    localStorage.removeItem(getStorageKey(userId))
  } catch (error) {
    console.error('Failed to clear live coaching state:', error)
  }
}

/**
 * Check if sessions have any progress (completed/skipped exercises or current_index > 0)
 */
export function sessionsHaveProgress(sessions: Array<{
  current_exercise_index: number
  exercises?: Array<{ completed: boolean; skipped: boolean }>
}>): boolean {
  for (const session of sessions) {
    // Check if current_exercise_index > 0
    if (session.current_exercise_index > 0) {
      return true
    }

    // Check if any exercise is completed or skipped
    if (session.exercises?.some(ex => ex.completed || ex.skipped)) {
      return true
    }
  }
  return false
}
