import { Calendar, User, Building2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardActions } from '@/components/shared'
import { formatDate } from '@/lib/utils'
import type { SessionWithDetails } from '@/types'

interface SessionCardProps {
  session: SessionWithDetails
  onEdit: (session: SessionWithDetails) => void
  onDelete: (session: SessionWithDetails) => void
  onView: (session: SessionWithDetails) => void
}

export function SessionCard({ session, onEdit, onDelete, onView }: SessionCardProps) {
  const exerciseCount = session.exercises?.length || 0

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onView(session)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {session.client?.first_name} {session.client?.last_name}
              </span>
              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                {session.status === 'completed' ? 'Completata' : 'Pianificata'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(session.session_date, 'short')}</span>
            </div>

            {session.gym && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>{session.gym.name}</span>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {exerciseCount} {exerciseCount === 1 ? 'esercizio' : 'esercizi'}
            </div>
          </div>

          <CardActions
            onEdit={() => onEdit(session)}
            onDelete={() => onDelete(session)}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardActions>
        </div>
      </CardContent>
    </Card>
  )
}
