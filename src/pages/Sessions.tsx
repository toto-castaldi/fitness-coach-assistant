import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Sessions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessioni</h1>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuova Sessione
        </Button>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <p>Nessuna sessione registrata.</p>
        <p className="text-sm">Registra la prima sessione di allenamento.</p>
      </div>
    </div>
  )
}
