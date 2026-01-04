import type { LumioCard } from '@/types'

/**
 * Fetch a Lumio card from an external URL via Edge Function proxy
 */
export async function fetchLumioCard(
  cardUrl: string,
  supabaseUrl: string,
  accessToken: string
): Promise<LumioCard> {
  const response = await fetch(`${supabaseUrl}/functions/v1/lumio-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ cardUrl }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `Failed to fetch card: ${response.status}`)
  }

  return response.json()
}

/**
 * Validate if a URL is a valid Lumio card URL
 * Currently supports GitHub raw URLs
 */
export function isValidCardUrl(url: string): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)

    // Must be HTTPS
    if (parsed.protocol !== 'https:') return false

    // Must end with .md
    if (!parsed.pathname.endsWith('.md')) return false

    // Supported hosts
    const supportedHosts = [
      'raw.githubusercontent.com',
      'github.com',
      'gitlab.com',
      'bitbucket.org',
    ]

    return supportedHosts.some(host => parsed.hostname.includes(host))
  } catch {
    return false
  }
}

/**
 * Convert a GitHub blob URL to raw URL
 * Example: https://github.com/user/repo/blob/main/file.md
 *       -> https://raw.githubusercontent.com/user/repo/main/file.md
 */
export function normalizeCardUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // Convert GitHub blob URLs to raw
    if (parsed.hostname === 'github.com' && parsed.pathname.includes('/blob/')) {
      const path = parsed.pathname.replace('/blob/', '/')
      return `https://raw.githubusercontent.com${path}`
    }

    return url
  } catch {
    return url
  }
}

/**
 * Get difficulty label from numeric value
 */
export function getDifficultyLabel(difficulty: number | undefined): string {
  switch (difficulty) {
    case 1: return 'Principiante'
    case 2: return 'Facile'
    case 3: return 'Intermedio'
    case 4: return 'Avanzato'
    case 5: return 'Esperto'
    default: return ''
  }
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty: number | undefined): string {
  switch (difficulty) {
    case 1: return 'bg-green-100 text-green-800'
    case 2: return 'bg-lime-100 text-lime-800'
    case 3: return 'bg-yellow-100 text-yellow-800'
    case 4: return 'bg-orange-100 text-orange-800'
    case 5: return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get language display name from ISO code
 */
export function getLanguageLabel(language: string | undefined): string {
  const languages: Record<string, string> = {
    it: 'Italiano',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
  }
  return language ? languages[language] || language.toUpperCase() : ''
}
