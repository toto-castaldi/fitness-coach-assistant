import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { LumioCardRenderer } from './LumioCardRenderer'
import { fetchLumioCard, getDifficultyLabel, getDifficultyColor, getLanguageLabel } from '@/lib/lumio'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { LumioCard } from '@/types'

interface LumioCardViewerProps {
  cardUrl: string
  onError?: () => void
  onLoad?: (card: LumioCard) => void
  className?: string
}

/**
 * Fetches and displays a Lumio card with loading and error states.
 * Displays frontmatter metadata (title, difficulty, language, tags).
 */
export function LumioCardViewer({ cardUrl, onError, onLoad, className }: LumioCardViewerProps) {
  const { session } = useAuth()
  const [card, setCard] = useState<LumioCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cardUrl || !session?.access_token) {
      setLoading(false)
      return
    }

    const loadCard = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const loadedCard = await fetchLumioCard(cardUrl, supabaseUrl, session.access_token)
        setCard(loadedCard)
        onLoad?.(loadedCard)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento della scheda'
        setError(errorMessage)
        onError?.()
      } finally {
        setLoading(false)
      }
    }

    loadCard()
  }, [cardUrl, session?.access_token, onError, onLoad])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a href={cardUrl} target="_blank" rel="noopener noreferrer">
              Apri link <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!card) {
    return null
  }

  const { frontmatter, content } = card
  const hasMetadata = frontmatter.title || frontmatter.difficulty || frontmatter.language || frontmatter.tags?.length

  return (
    <div className={className}>
      {/* Frontmatter metadata */}
      {hasMetadata && (
        <div className="mb-4 space-y-2">
          {/* Title from frontmatter */}
          {frontmatter.title && (
            <h2 className="text-xl font-semibold">{frontmatter.title}</h2>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {/* Difficulty badge */}
            {frontmatter.difficulty && (
              <Badge
                variant="outline"
                className={getDifficultyColor(frontmatter.difficulty)}
              >
                {getDifficultyLabel(frontmatter.difficulty)}
              </Badge>
            )}

            {/* Language badge */}
            {frontmatter.language && (
              <Badge variant="outline">
                {getLanguageLabel(frontmatter.language)}
              </Badge>
            )}

            {/* Tags */}
            {frontmatter.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Card content */}
      <LumioCardRenderer content={content} />

      {/* External link */}
      <div className="mt-4 pt-4 border-t">
        <a
          href={cardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          Vedi sorgente <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
