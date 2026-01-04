import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'

interface LumioCardRendererProps {
  content: string
  className?: string
}

/**
 * Renders Lumio card markdown with support for:
 * - GitHub Flavored Markdown (tables, strikethrough, etc.)
 * - LaTeX math formulas ($...$ and $$...$$)
 * - Styled tables for mobile
 * - Lazy-loaded images
 */
export function LumioCardRenderer({ content, className }: LumioCardRendererProps) {
  return (
    <div className={cn('lumio-card-content prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom table wrapper for horizontal scroll on mobile
          table: ({ children }) => (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="min-w-full">{children}</table>
            </div>
          ),
          // Styled table header
          th: ({ children }) => (
            <th className="bg-muted/50 px-3 py-2 text-left text-sm font-medium">
              {children}
            </th>
          ),
          // Styled table cell
          td: ({ children }) => (
            <td className="border-t px-3 py-2 text-sm">{children}</td>
          ),
          // Lazy-loaded images with styling
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              loading="lazy"
              className="rounded-lg max-w-full h-auto"
            />
          ),
          // Styled code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('block', className)} {...props}>
                {children}
              </code>
            )
          },
          // Styled pre blocks
          pre: ({ children }) => (
            <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
              {children}
            </pre>
          ),
          // Styled blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Styled headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>
          ),
          // Styled lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>
          ),
          // Styled paragraphs
          p: ({ children }) => (
            <p className="my-3 leading-relaxed">{children}</p>
          ),
          // Styled links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
