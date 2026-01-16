import { useMemo } from 'react'
import { AlertTriangle, FolderGit2 } from 'lucide-react'
import { LumioCardRenderer } from '@/components/markdown/LumioCardRenderer'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getDifficultyLabel, getDifficultyColor, getLanguageLabel } from '@/lib/lumio'
import { resolveImagePaths } from '@/lib/lumio-images'
import type { LumioLocalCardWithRepository } from '@/types'

interface LumioLocalCardViewerProps {
  card: LumioLocalCardWithRepository
  className?: string
}

function getDisplayTitle(card: LumioLocalCardWithRepository): string {
  if (card.title) return card.title
  const parts = card.file_path.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace(/\.md$/, '')
}

export function LumioLocalCardViewer({ card, className }: LumioLocalCardViewerProps) {
  const title = getDisplayTitle(card)
  const frontmatter = card.frontmatter || {}
  const tags = frontmatter.tags || []
  const difficulty = frontmatter.difficulty as number | undefined
  const language = frontmatter.language as string | undefined
  const isUnavailable = !card.source_available

  const hasMetadata = title || difficulty || language || tags.length > 0

  // Resolve image paths to storage URLs
  const processedContent = useMemo(() => {
    if (!card.repository) return card.content
    return resolveImagePaths(
      card.content,
      card.file_path,
      card.repository.user_id,
      card.repository.id
    )
  }, [card.content, card.file_path, card.repository])

  return (
    <div className={className}>
      {/* Unavailable warning */}
      {isUnavailable && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Questa carta non è più disponibile nel repository sorgente. Il contenuto mostrato potrebbe non essere aggiornato.
          </AlertDescription>
        </Alert>
      )}

      {/* Frontmatter metadata */}
      {hasMetadata && (
        <div className="mb-4 space-y-2">
          {/* Title */}
          <h2 className="text-xl font-semibold">{title}</h2>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {/* Repository badge */}
            {card.repository && (
              <Badge variant="outline" className="gap-1">
                <FolderGit2 className="h-3 w-3" />
                {card.repository.name}
              </Badge>
            )}

            {/* Difficulty badge */}
            {difficulty && (
              <Badge
                variant="outline"
                className={getDifficultyColor(difficulty)}
              >
                {getDifficultyLabel(difficulty)}
              </Badge>
            )}

            {/* Language badge */}
            {language && (
              <Badge variant="outline">
                {getLanguageLabel(language)}
              </Badge>
            )}

            {/* Tags */}
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Card content */}
      <LumioCardRenderer content={processedContent} />

      {/* Source info */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          {card.repository && (
            <>
              Repository: {card.repository.github_owner}/{card.repository.github_repo}
              <span className="mx-2">•</span>
            </>
          )}
          File: {card.file_path}
        </p>
      </div>
    </div>
  )
}
