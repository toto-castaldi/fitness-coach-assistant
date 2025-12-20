import { Brain } from 'lucide-react'

export function AIPlanner() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Planner</h1>

      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Seleziona un cliente per generare un piano di allenamento personalizzato.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          L'AI analizzerà lo storico delle sessioni e l'obiettivo del cliente.
        </p>
      </div>
    </div>
  )
}
