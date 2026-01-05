import { FolderGit2, Lock, RefreshCw, FileText, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CardActions } from '@/components/shared'
import { SyncStatusBadge } from './SyncStatusBadge'
import type { LumioRepository } from '@/types'

/**
 * Format the last commit date for display
 */
function formatCommitDate(dateString: string | null): string | null {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

/**
 * Format delta stats for display
 */
function formatSyncDelta(repo: LumioRepository): string | null {
  const { last_sync_added, last_sync_updated, last_sync_removed, last_sync_unchanged } = repo

  // If all stats are 0 or undefined, no delta to show
  if (!last_sync_added && !last_sync_updated && !last_sync_removed && !last_sync_unchanged) {
    return null
  }

  // If everything is unchanged
  if (!last_sync_added && !last_sync_updated && !last_sync_removed && last_sync_unchanged) {
    return 'Nessuna modifica'
  }

  const parts: string[] = []
  if (last_sync_added && last_sync_added > 0) {
    parts.push(`${last_sync_added} aggiunt${last_sync_added === 1 ? 'a' : 'e'}`)
  }
  if (last_sync_updated && last_sync_updated > 0) {
    parts.push(`${last_sync_updated} modificat${last_sync_updated === 1 ? 'a' : 'e'}`)
  }
  if (last_sync_removed && last_sync_removed > 0) {
    parts.push(`${last_sync_removed} rimoss${last_sync_removed === 1 ? 'a' : 'e'}`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Nessuna modifica'
}

interface RepositoryCardProps {
  repository: LumioRepository
  onEdit: (repository: LumioRepository) => void
  onDelete: (repository: LumioRepository) => void
  onSync: (repository: LumioRepository) => void
  onViewCards: (repository: LumioRepository) => void
  isSyncing?: boolean
}

export function RepositoryCard({
  repository,
  onEdit,
  onDelete,
  onSync,
  onViewCards,
  isSyncing,
}: RepositoryCardProps) {
  const githubUrl = `https://github.com/${repository.github_owner}/${repository.github_repo}`
  const isPrivate = !!repository.access_token

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <FolderGit2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{repository.name}</h3>
                {isPrivate && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary truncate block"
              >
                {repository.github_owner}/{repository.github_repo}
              </a>
            </div>
          </div>
          <CardActions
            onEdit={() => onEdit(repository)}
            onDelete={() => onDelete(repository)}
          />
        </div>

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => onViewCards(repository)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            disabled={repository.cards_count === 0}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className={repository.cards_count > 0 ? 'underline underline-offset-2' : ''}>
              {repository.cards_count} carte
            </span>
          </button>
          <SyncStatusBadge
            status={repository.sync_status}
            lastSyncAt={repository.last_sync_at}
          />
        </div>

        {/* Last commit date from GitHub */}
        {repository.last_commit_at && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Ultimo aggiornamento repo: {formatCommitDate(repository.last_commit_at)}</span>
          </div>
        )}

        {/* Delta sync stats */}
        {repository.last_sync_at && formatSyncDelta(repository) && (
          <div className="mt-1 text-xs text-muted-foreground">
            {formatSyncDelta(repository)}
          </div>
        )}

        {repository.sync_status === 'error' && repository.sync_error && (
          <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive break-words">
            {repository.sync_error}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSync(repository)}
            disabled={isSyncing || repository.sync_status === 'syncing'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizza
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
