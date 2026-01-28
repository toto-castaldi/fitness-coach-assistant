import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { ClientAvatar } from './ClientAvatar'
import { cn } from '@/shared/lib/utils'
import { Check, SkipForward, Users, X } from 'lucide-react'
import type { Client, ExerciseWithDetails } from '@/shared/types'

interface Participant {
  sessionExerciseId: string
  client: Client
  completed: boolean
  skipped: boolean
}

interface GroupExerciseCardProps {
  exerciseId: string
  exerciseName: string
  exercise: ExerciseWithDetails
  participants: Participant[]
  allCompleted: boolean
  someCompleted: boolean
  onCompleteAll: () => void
  onSkipParticipant: (sessionExerciseId: string, clientName: string) => void
}

export function GroupExerciseCard({
  exerciseName,
  exercise,
  participants,
  allCompleted,
  someCompleted: _someCompleted,
  onCompleteAll,
  onSkipParticipant,
}: GroupExerciseCardProps) {
  // Sort participants: pending first, then completed, then skipped
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.completed === b.completed && a.skipped === b.skipped) return 0
    if (!a.completed && !a.skipped) return -1
    if (!b.completed && !b.skipped) return 1
    if (a.completed && !b.completed) return -1
    return 1
  })

  const pendingCount = participants.filter(p => !p.completed && !p.skipped).length
  const completedCount = participants.filter(p => p.completed).length
  const skippedCount = participants.filter(p => p.skipped).length

  return (
    <Card className={cn(
      'transition-all w-full',
      allCompleted ? 'bg-emerald-900/30 border-emerald-600 border-2' : 'bg-gray-800 border-gray-700'
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{exerciseName}</h3>
              <Badge className="bg-violet-600">
                <Users className="w-3 h-3 mr-1" />
                {participants.length}
              </Badge>
            </div>
            {exercise.description && (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{exercise.description}</p>
            )}
          </div>

          {/* Complete All Button */}
          {!allCompleted && (
            <Button
              onClick={onCompleteAll}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white ml-4"
            >
              <Check className="w-5 h-5 mr-2" />
              Completa tutti
            </Button>
          )}
          {allCompleted && (
            <Badge className="bg-emerald-600 p-2">
              <Check className="w-5 h-5" />
            </Badge>
          )}
        </div>

        {/* Status summary */}
        <div className="flex gap-4 text-sm mb-3">
          {pendingCount > 0 && (
            <span className="text-gray-400">{pendingCount} in attesa</span>
          )}
          {completedCount > 0 && (
            <span className="text-emerald-400">{completedCount} completati</span>
          )}
          {skippedCount > 0 && (
            <span className="text-amber-400">{skippedCount} saltati</span>
          )}
        </div>

        {/* Participants */}
        <div className="flex flex-wrap gap-3">
          {sortedParticipants.map((participant) => (
            <div
              key={participant.sessionExerciseId}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg',
                participant.completed && 'bg-emerald-900/30',
                participant.skipped && 'bg-amber-900/30',
                !participant.completed && !participant.skipped && 'bg-gray-700'
              )}
            >
              <ClientAvatar
                client={participant.client}
                size="sm"
                selected={true}
              />
              <span className="text-sm text-white">
                {participant.client.first_name}
              </span>

              {participant.completed && (
                <Badge className="bg-emerald-600 p-1">
                  <Check className="w-3 h-3" />
                </Badge>
              )}

              {participant.skipped && (
                <Badge className="bg-amber-600 p-1">
                  <SkipForward className="w-3 h-3" />
                </Badge>
              )}

              {/* Skip button for pending participants */}
              {!participant.completed && !participant.skipped && (
                <Button
                  onClick={() => onSkipParticipant(
                    participant.sessionExerciseId,
                    participant.client.first_name
                  )}
                  size="sm"
                  variant="ghost"
                  className="p-1 h-auto text-amber-400 hover:text-amber-300 hover:bg-amber-900/30"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
