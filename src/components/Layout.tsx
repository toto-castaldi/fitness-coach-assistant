import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Users, Dumbbell, CalendarDays, Building2, LogOut, Settings, User, Info } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'

export function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSettings = () => {
    setShowMenu(false)
    navigate('/settings')
  }

  const handleSignOut = () => {
    setShowMenu(false)
    signOut()
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Fitness Coach Assitant</h1>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
            >
              <span className="text-xs text-muted-foreground hidden sm:inline max-w-32 truncate">
                {user?.email}
              </span>
              <div className="rounded-full bg-primary/10 p-1.5">
                <User className="h-4 w-4 text-primary" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-50">
                <div className="p-2 border-b">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                >
                  <Settings className="h-4 w-4" />
                  Impostazioni
                </button>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border-t">
                  <Info className="h-4 w-4" />
                  <span>Versione {APP_VERSION}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Esci
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom navigation - mobile */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="flex items-center justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Dumbbell className="h-5 w-5" />
            <span>Esercizi</span>
          </NavLink>
          <NavLink
            to="/gyms"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Building2 className="h-5 w-5" />
            <span>Palestre</span>
          </NavLink>
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Users className="h-5 w-5" />
            <span>Clienti</span>
          </NavLink>
          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <CalendarDays className="h-5 w-5" />
            <span>Sessioni</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
