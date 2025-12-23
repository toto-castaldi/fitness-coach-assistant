import { useNavigate } from 'react-router-dom'
import { User, Calendar, Edit2, Trash2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Client } from '@/types'

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const navigate = useNavigate()
  const displayAge = client.birth_date
    ? calculateAge(client.birth_date)
    : client.age_years

  const handleCardClick = () => {
    navigate(`/clients/${client.id}`)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(client)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(client)
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditClick}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
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
