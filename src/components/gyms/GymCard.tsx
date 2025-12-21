import { Building2, MapPin, Edit2, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(gym)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(gym)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
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
