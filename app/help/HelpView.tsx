'use client'

import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Search, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react'
import { HELP_ARTICLES, CATEGORIES, type HelpArticle } from './articles'

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-semibold text-foreground mb-4 mt-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-foreground mb-3 mt-8 pb-2 border-b border-border">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-foreground mb-2 mt-5">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-muted-foreground leading-relaxed">{children}</li>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <code className="block bg-muted/60 text-foreground text-xs font-mono p-4 rounded-lg overflow-x-auto">
                {children}
              </code>
            )
          }
          return (
            <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="bg-muted/60 rounded-lg mb-4 overflow-x-auto">{children}</pre>
        ),
        strong: ({ children }) => (
          <strong className="text-foreground font-semibold">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="border-border my-6" />,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-border pl-4 my-4 text-sm text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
        th: ({ children }) => (
          <th className="text-left px-3 py-2 text-xs font-semibold text-foreground border border-border">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-muted-foreground border border-border">{children}</td>
        ),
        tr: ({ children }) => <tr className="even:bg-muted/20">{children}</tr>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export function HelpView() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(HELP_ARTICLES[0]?.id ?? null)
  const [mobileShowArticle, setMobileShowArticle] = useState(false)

  const filteredArticles = useMemo(() => {
    if (!query.trim()) return HELP_ARTICLES
    const q = query.toLowerCase()
    return HELP_ARTICLES.filter(
      (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
    )
  }, [query])

  const articlesByCategory = useMemo(() => {
    const map: Record<string, HelpArticle[]> = {}
    for (const article of filteredArticles) {
      if (!map[article.category]) map[article.category] = []
      map[article.category].push(article)
    }
    return map
  }, [filteredArticles])

  const selectedArticle = HELP_ARTICLES.find((a) => a.id === selectedId) ?? null

  function selectArticle(id: string) {
    setSelectedId(id)
    setMobileShowArticle(true)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Help Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you need to know about using IGTP
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search help articles…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setMobileShowArticle(false)
          }}
          className="w-full h-10 pl-9 pr-4 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Main layout */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Sidebar */}
        <aside
          className={`${
            mobileShowArticle ? 'hidden' : 'flex'
          } md:flex flex-col w-full md:w-60 shrink-0 bg-card border border-border rounded-xl overflow-hidden`}
        >
          <div className="overflow-y-auto flex-1 py-3">
            {CATEGORIES.filter((cat) => articlesByCategory[cat]?.length).map((category) => (
              <div key={category} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {category}
                </p>
                {articlesByCategory[category]?.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => selectArticle(article.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 rounded-lg mx-1 transition-colors ${
                      selectedId === article.id
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    <span className="leading-snug">{article.title}</span>
                    {selectedId === article.id && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    )}
                  </button>
                ))}
              </div>
            ))}
            {filteredArticles.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No articles match your search.
              </p>
            )}
          </div>
        </aside>

        {/* Article content */}
        <main
          className={`${
            !mobileShowArticle && 'hidden'
          } md:flex flex-col flex-1 bg-card border border-border rounded-xl overflow-hidden`}
        >
          {/* Mobile back button */}
          <div className="md:hidden border-b border-border px-4 py-3">
            <button
              onClick={() => setMobileShowArticle(false)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All articles
            </button>
          </div>

          {selectedArticle ? (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <MarkdownContent content={selectedArticle.content} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                Select an article from the sidebar to read it here.
              </p>
            </div>
          )}
        </main>

        {/* Placeholder when no article selected on desktop */}
        {!selectedArticle && (
          <main className="hidden md:flex flex-1 bg-card border border-border rounded-xl items-center justify-center text-center px-6">
            <div>
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Select an article from the sidebar to read it here.
              </p>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
