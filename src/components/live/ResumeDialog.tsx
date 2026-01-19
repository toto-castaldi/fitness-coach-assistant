import { Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ResumeDialogProps {
  open: boolean
  clientCount: number
  completedExercises: number
  onResume: () => void
  onRestart: () => void
}

export function ResumeDialog({
  open,
  clientCount,
  completedExercises,
  onResume,
  onRestart,
}: ResumeDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Sessione in corso</CardTitle>
          <CardDescription>
            Hai una sessione live con {clientCount} {clientCount === 1 ? 'cliente' : 'clienti'} e{' '}
            {completedExercises} {completedExercises === 1 ? 'esercizio completato' : 'esercizi completati'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={onResume}>
            <Play className="h-4 w-4 mr-2" />
            Riprendi
          </Button>
          <Button variant="outline" className="w-full" onClick={onRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Ricomincia da capo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
