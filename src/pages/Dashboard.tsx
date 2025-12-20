import { Link } from 'react-router-dom'
import { Users, Calendar, Brain } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4">
        <Link
          to="/clients"
          className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
        >
          <div className="rounded-full bg-primary/10 p-3">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Clienti</h2>
            <p className="text-sm text-muted-foreground">
              Gestisci i tuoi clienti e i loro obiettivi
            </p>
          </div>
        </Link>

        <Link
          to="/sessions"
          className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
        >
          <div className="rounded-full bg-primary/10 p-3">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Sessioni</h2>
            <p className="text-sm text-muted-foreground">
              Registra gli allenamenti dei tuoi clienti
            </p>
          </div>
        </Link>

        <Link
          to="/ai-planner"
          className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
        >
          <div className="rounded-full bg-primary/10 p-3">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">AI Planner</h2>
            <p className="text-sm text-muted-foreground">
              Genera piani di allenamento con l'AI
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
