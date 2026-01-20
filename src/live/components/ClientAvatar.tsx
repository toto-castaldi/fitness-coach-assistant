import { cn, getInitials, stringToHue } from '@/shared/lib/utils'
import type { Client } from '@/shared/types'

interface ClientAvatarProps {
  client: Client
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
}

export function ClientAvatar({
  client,
  selected = false,
  size = 'md',
  onClick,
}: ClientAvatarProps) {
  const initials = getInitials(client.first_name, client.last_name)
  const hue = stringToHue(`${client.first_name}${client.last_name}`)

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white transition-all',
        'focus:outline-none',
        sizeClasses[size],
        selected ? 'opacity-100' : 'opacity-40',
        onClick && 'cursor-pointer hover:opacity-80'
      )}
      style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
      disabled={!onClick}
    >
      {initials}
    </button>
  )
}
