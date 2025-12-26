interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  )
}
