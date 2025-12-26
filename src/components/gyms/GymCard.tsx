import { Building2, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CardActions } from '@/components/shared'
import type { Gym } from '@/types'

interface GymCardProps {
  gym: Gym
  onEdit: (gym: Gym) => void
  onDelete: (gym: Gym) => void
}

export function GymCard({ gym, onEdit, onDelete }: GymCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="rounded-full bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{gym.name}</h3>
              {gym.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{gym.address}</span>
                </div>
              )}
            </div>
          </div>
          <CardActions
            onEdit={() => onEdit(gym)}
            onDelete={() => onDelete(gym)}
          />
        </div>
        {gym.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {gym.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
