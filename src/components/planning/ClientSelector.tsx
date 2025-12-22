import { User, Calendar, Target, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Client } from '@/types'

interface ClientSelectorProps {
  clients: Client[]
  onSelect: (client: Client) => void
  loading?: boolean
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

export function ClientSelector({ clients, onSelect, loading }: ClientSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nessun cliente trovato</p>
        <p className="text-sm">Aggiungi prima un cliente</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => {
        const displayAge = client.birth_date
          ? calculateAge(client.birth_date)
          : client.age_years

        return (
          <Card
            key={client.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelect(client)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {client.first_name} {client.last_name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {displayAge && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {displayAge} anni
                        </span>
                      )}
                      {client.current_goal && (
                        <span className="flex items-center gap-1 truncate">
                          <Target className="h-3 w-3" />
                          <span className="truncate">{client.current_goal}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
