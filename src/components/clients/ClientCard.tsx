import { useNavigate } from 'react-router-dom'
import { User, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CardActions } from '@/components/shared'
import { calculateAge } from '@/lib/utils'
import type { Client } from '@/types'

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const navigate = useNavigate()
  const displayAge = client.birth_date
    ? calculateAge(client.birth_date)
    : client.age_years

  const handleCardClick = () => {
    navigate(`/clients/${client.id}`)
  }

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="rounded-full bg-primary/10 p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {client.first_name} {client.last_name}
              </h3>
              {displayAge && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{displayAge} anni</span>
                </div>
              )}
              {client.current_goal && (
                <p className="text-sm text-primary mt-1 line-clamp-1">
                  {client.current_goal}
                </p>
              )}
            </div>
          </div>
          <CardActions
            onEdit={() => onEdit(client)}
            onDelete={() => onDelete(client)}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardActions>
        </div>
        {client.physical_notes && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {client.physical_notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
