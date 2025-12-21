import { Outlet, NavLink } from 'react-router-dom'
import { Home, Users, Building2, Dumbbell, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Fitness Coach</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="p-2 rounded-md hover:bg-accent"
              title="Esci"
            >
              <LogOut className="h-5 w-5" />
            </button>
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
            <Home className="h-5 w-5" />
            <span>Home</span>
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
            to="/exercises"
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
        </div>
      </nav>
    </div>
  )
}
