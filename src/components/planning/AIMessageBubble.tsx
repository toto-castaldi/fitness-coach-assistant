import { User, Bot } from 'lucide-react'
import type { AIMessage } from '@/types'

interface AIMessageBubbleProps {
  message: AIMessage
}

export function AIMessageBubble({ message }: AIMessageBubbleProps) {
  const isUser = message.role === 'user'

  // Format message content - handle code blocks and training_plan blocks
  const formatContent = (content: string) => {
    // Remove training_plan code blocks from display (they're shown in PlanPreview)
    const cleanContent = content.replace(/```training_plan[\s\S]*?```/g, '').trim()

    // Split by regular code blocks
    const parts = cleanContent.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const code = part.slice(3, -3).replace(/^\w+\n/, '') // Remove language identifier
        return (
          <pre
            key={index}
            className="bg-muted/50 rounded-md p-2 text-sm overflow-x-auto my-2 font-mono"
          >
            {code}
          </pre>
        )
      }
      // Regular text - preserve line breaks
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      )
    })
  }

  return (
    <div
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={`flex-1 max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <div className="text-sm">{formatContent(message.content)}</div>
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
