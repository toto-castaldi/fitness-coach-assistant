import type { SessionWithDetails } from '@/shared/types'
import { ClientAvatar } from './ClientAvatar'
import { cn } from '@/shared/lib/utils'

interface ClientStripBarProps {
  sessions: SessionWithDetails[]
  selectedIndex: number
  onSelectClient: (index: number) => void
}

export function ClientStripBar({
  sessions,
  selectedIndex,
  onSelectClient,
}: ClientStripBarProps) {
  return (
    <div className="flex items-center gap-3 flex-1 overflow-x-auto py-2">
      {sessions.map((session, index) => {
        const client = session.client
        if (!client) return null

        const exerciseCount = session.exercises?.length || 0
        const completedCount =
          session.exercises?.filter((e) => e.completed || e.skipped).length || 0
        const progress =
          exerciseCount > 0 ? Math.round((completedCount / exerciseCount) * 100) : 0
        const isSessionCompleted = session.status === 'completed'

        return (
          <div
            key={session.id}
            className="flex flex-col items-center gap-1 px-2"
          >
            <ClientAvatar
              client={client}
              selected={index === selectedIndex}
              size="md"
              onClick={() => onSelectClient(index)}
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {client.first_name.charAt(0)}.{client.last_name.charAt(0)}.
            </span>
            {/* Progress bar - emerald when session completed */}
            <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  isSessionCompleted ? 'bg-emerald-500' : 'bg-primary'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
