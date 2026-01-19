import { Search, X, TagsIcon, FileQuestion } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ExerciseFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  allTags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  showNoTags?: boolean
  onToggleNoTags?: () => void
  showNoInfo?: boolean
  onToggleNoInfo?: () => void
  searchPlaceholder?: string
  autoFocus?: boolean
}

export function ExerciseFilterBar({
  searchQuery,
  onSearchChange,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  showNoTags = false,
  onToggleNoTags,
  showNoInfo = false,
  onToggleNoInfo,
  searchPlaceholder = 'Cerca esercizi...',
  autoFocus = false,
}: ExerciseFilterBarProps) {
  const hasFilters = searchQuery.trim() || selectedTags.length > 0 || showNoTags || showNoInfo

  const handleClearAll = () => {
    onSearchChange('')
    onClearTags()
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          autoFocus={autoFocus}
        />
      </div>

      {(allTags.length > 0 || hasFilters || onToggleNoTags || onToggleNoInfo) && (
        <div className="flex flex-wrap gap-2">
          {hasFilters && (
            <Button
              variant="destructive"
              size="sm"
              className="h-6 text-xs"
              onClick={handleClearAll}
            >
              <X className="h-3 w-3 mr-1" />
              Rimuovi filtri
            </Button>
          )}
          {onToggleNoTags && (
            <Badge
              variant={showNoTags ? 'default' : 'outline'}
              className="cursor-pointer gap-1"
              onClick={onToggleNoTags}
            >
              <TagsIcon className="h-3 w-3" />
              Senza tag
            </Badge>
          )}
          {onToggleNoInfo && (
            <Badge
              variant={showNoInfo ? 'default' : 'outline'}
              className="cursor-pointer gap-1"
              onClick={onToggleNoInfo}
            >
              <FileQuestion className="h-3 w-3" />
              Senza Lumio
            </Badge>
          )}
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onToggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
