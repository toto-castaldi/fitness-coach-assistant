import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { useLiveCoaching } from '@/shared/hooks/useLiveCoaching'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { cn, getInitials, stringToHue } from '@/shared/lib/utils'
import { LogOut, Calendar, Play } from 'lucide-react'

export function TabletDateSelect() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { sessions, loading, fetchSessionsForDate } = useLiveCoaching()

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (selectedDate) {
      fetchSessionsForDate(selectedDate)
    }
  }, [selectedDate, fetchSessionsForDate])

  const handleStartSession = () => {
    if (sessions.length > 0) {
      navigate('/live', { state: { date: selectedDate } })
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Helix Live" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">Helix Live</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">{user?.email}</span>
          <Button variant="ghost" size="icon-lg" onClick={handleLogout}>
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Date Selector */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-semibold">Seleziona Data</h2>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-16 text-xl bg-gray-700 border-gray-600 text-center"
              />
            </CardContent>
          </Card>

          {/* Sessions Preview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">
                Sessioni ({sessions.length})
              </h2>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-lg">
                  Nessuna sessione per questa data
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sessions.map((session) => {
                    const client = session.client
                    if (!client) return null

                    const initials = getInitials(client.first_name, client.last_name)
                    const hue = stringToHue(`${client.first_name}${client.last_name}`)
                    const isCompleted = session.status === 'completed'

                    return (
                      <div
                        key={session.id}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg',
                          isCompleted ? 'bg-emerald-900/30 border border-emerald-600' : 'bg-gray-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white'
                          )}
                          style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
                        >
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-center">
                          {client.first_name} {client.last_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {session.exercises?.length || 0} esercizi
                        </span>
                        {isCompleted && (
                          <span className="text-xs text-emerald-400 font-medium">
                            Completata
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button
            onClick={handleStartSession}
            disabled={sessions.length === 0 || loading}
            size="xl"
            className="w-full h-20 text-2xl"
          >
            <Play className="w-8 h-8 mr-4" />
            Inizia Sessione
          </Button>
        </div>
      </main>
    </div>
  )
}
