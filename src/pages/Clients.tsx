import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Clients() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clienti</h1>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <p>Nessun cliente ancora.</p>
        <p className="text-sm">Aggiungi il tuo primo cliente per iniziare.</p>
      </div>
    </div>
  )
}
