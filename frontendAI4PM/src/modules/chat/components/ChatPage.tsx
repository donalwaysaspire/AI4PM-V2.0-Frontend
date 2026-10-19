import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import {
  Send, Loader2, ChevronDown, Check, Search,
  FileText, FileSpreadsheet, Lightbulb, BookOpen,
  CheckCircle, AlertCircle, Sparkles,
} from 'lucide-react'
import { cn, formatDateTime } from '@/utils'
import { usersApi } from '@/services/api/users.api'
import { chatApi } from '@/services/api/chat.api'
import type { ChatResponse, ChatSource } from '@/services/api/chat.api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  timestamp: Date
  meta?:     ChatResponse   // only for assistant messages
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EXT_ICON: Record<string, string> = {
  pdf:  'text-red-500',
  docx: 'text-blue-500',
  xlsx: 'text-green-500',
  csv:  'text-teal-500',
  txt:  'text-surface-500',
}
function getExt(name: string) { return name.split('.').pop()?.toLowerCase() ?? '' }
function SourceIcon({ filename }: { filename: string }) {
  const ext = getExt(filename)
  const cls = EXT_ICON[ext] ?? 'text-surface-500'
  const Icon = ['xlsx', 'csv'].includes(ext) ? FileSpreadsheet : FileText
  return <Icon size={13} className={cls} />
}

// ─── Project Dropdown ─────────────────────────────────────────────────────────
function ProjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => usersApi.getProjects().then((r) => r.data.projects),
  })

  const options  = (projectsData ?? []).map((p) => p.project_name)
  const filtered = options.filter((p) => p.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen((p) => !p); setSearch('') }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all',
          value
            ? 'border-primary-200 bg-primary-50 text-primary-700 font-medium'
            : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300'
        )}>
        {isLoading ? <Loader2 size={13} className="animate-spin" /> : null}
        <span>{value || 'Select project…'}</span>
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 left-0 w-56 bg-white border border-surface-200 rounded-xl shadow-card-md overflow-hidden">
            <div className="p-2 border-b border-surface-100">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400" />
                <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-6 pr-2 py-1.5 text-xs border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && <p className="px-3 py-2 text-xs text-surface-400">No projects</p>}
              {filtered.map((p) => (
                <button key={p} type="button" onClick={() => { onChange(p); setOpen(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-50 transition-colors text-left">
                  <span className={value === p ? 'text-primary-700 font-medium' : 'text-surface-700'}>{p}</span>
                  {value === p && <Check size={13} className="text-primary-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sources panel ────────────────────────────────────────────────────────────
function SourcesPanel({ sources }: { sources: ChatSource[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!sources.length) return null

  return (
    <div className="mt-3 border border-surface-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-50 hover:bg-surface-100 transition-colors text-xs text-surface-500"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <BookOpen size={12} /> {sources.length} source{sources.length !== 1 ? 's' : ''} referenced
        </span>
        <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="divide-y divide-surface-100">
          {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white">
              <SourceIcon filename={s.filename} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-surface-700 truncate">{s.filename}</p>
                <p className="text-xs text-surface-400">{s.artefact_type}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Recommendations panel ────────────────────────────────────────────────────
function RecommendationsPanel({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-2">
        <Lightbulb size={12} /> Recommendations
      </p>
      <ul className="space-y-1">
        {items.map((r, i) => (
          <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
            <CheckCircle size={11} className="text-amber-500 mt-0.5 flex-shrink-0" /> {r}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Innovation prompt ────────────────────────────────────────────────────────
function InnovationPrompt({ prompt }: { prompt: string }) {
  return (
    <div className="mt-3 bg-purple-50 border border-purple-100 rounded-xl p-3">
      <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5 mb-1">
        <Sparkles size={12} /> Innovation Prompt
      </p>
      <p className="text-xs text-purple-800">{prompt}</p>
    </div>
  )
}


function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
        isUser ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-500'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[75%]', isUser && 'items-end flex flex-col')}>
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-primary-600 text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-white border border-surface-100 text-surface-800 shadow-sm rounded-tl-sm'
        )}>
          {isUser ? msg.content : (
            <ReactMarkdown
              components={{
                p:          ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                ul:         ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                ol:         ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                li:         ({ children }) => <li className="pl-0.5">{children}</li>,
                strong:     ({ children }) => <strong className="font-semibold">{children}</strong>,
                em:         ({ children }) => <em>{children}</em>,
                h1:         ({ children }) => <p className="font-bold text-base mt-2 mb-1">{children}</p>,
                h2:         ({ children }) => <p className="font-bold text-sm mt-2 mb-0.5">{children}</p>,
                h3:         ({ children }) => <p className="font-semibold text-sm mt-1.5 mb-0.5">{children}</p>,
                code:       ({ children }) => <code className="bg-surface-100 text-primary-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                pre:        ({ children }) => <pre className="bg-surface-900 text-surface-100 text-xs rounded-xl p-3 overflow-x-auto my-2 font-mono">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary-300 pl-3 text-surface-500 italic my-1">{children}</blockquote>,
                hr:         () => <hr className="border-surface-200 my-2" />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Meta panels — only for assistant */}
        {!isUser && msg.meta && (
          <div className="w-full">
            <SourcesPanel sources={msg.meta.sources} />
            <RecommendationsPanel items={msg.meta.recommendations} />
            {msg.meta.innovation_prompt && <InnovationPrompt prompt={msg.meta.innovation_prompt} />}
            <div className="flex items-center gap-2 mt-2 px-1">
              {msg.meta.grounded
                ? <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={11} /> Grounded</span>
                : <span className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle size={11} /> Not grounded</span>
              }
              <span className="text-xs text-surface-400">· {msg.meta.context_used} chunks used</span>
            </div>
          </div>
        )}

        <span className="text-xs text-surface-400 mt-1 px-1">
          {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [project,  setProject]  = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const send = useCallback(async () => {
    if (!input.trim() || loading) return
    if (!project) { return }

    const userMsg: Message = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const { data } = await chatApi.send({ message: userMsg.content, project_name: project })
      setMessages((prev) => [...prev, {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   data.response,
        timestamp: new Date(data.generated_at),
        meta:      data,
      }])
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   err?.response?.data?.detail ?? 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, project])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const [clearing, setClearing] = useState(false)

  const clearChat = async () => {
    try {
      setClearing(true)
      await chatApi.clearHistory()
      setMessages([])
    } catch {
      // Clear locally even if API fails
      setMessages([])
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-surface-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-semibold text-surface-900">ValuGPT Chat</h2>
            <p className="text-xs text-surface-400">Ask questions about your project artefacts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ProjectSelect value={project} onChange={(p) => { setProject(p); clearChat() }} />
          {messages.length > 0 && (
            <button onClick={clearChat} disabled={clearing}
              className="text-xs text-surface-400 hover:text-surface-700 transition-colors flex items-center gap-1 disabled:opacity-50">
              {clearing && <Loader2 size={11} className="animate-spin" />}
              Clear chat
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-surface-50">
        {!project && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-20">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Sparkles size={28} className="text-primary-500" />
            </div>
            <div>
              <p className="font-semibold text-surface-700 text-lg">Ask ValuGPT</p>
              <p className="text-sm text-surface-400 mt-1 max-w-xs">Select a project from the dropdown above, then ask any question about your artefacts</p>
            </div>
          </div>
        )}

        {project && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-20">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Sparkles size={22} className="text-primary-500" />
            </div>
            <div>
              <p className="font-medium text-surface-700">Ask anything about <span className="text-primary-600">{project}</span></p>
              <p className="text-xs text-surface-400 mt-1">Tip: Press Enter to send, Shift+Enter for new line</p>
            </div>
          </div>
        )}

        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-500 flex-shrink-0 mt-0.5">AI</div>
            <div className="bg-white border border-surface-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-surface-100 px-6 py-4 bg-white flex-shrink-0">
        {!project && (
          <p className="text-xs text-amber-500 text-center mb-2 flex items-center justify-center gap-1">
            <AlertCircle size={12} /> Select a project above before asking a question
          </p>
        )}
        <div className={cn(
          'flex gap-3 items-end rounded-2xl border px-4 py-3 transition-all',
          project ? 'border-surface-200 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100' : 'border-surface-100 bg-surface-50'
        )}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={!project || loading}
            placeholder={project ? `Ask about ${project}…` : 'Select a project first…'}
            className="flex-1 resize-none bg-transparent text-sm text-surface-800 placeholder-surface-400 focus:outline-none disabled:cursor-not-allowed"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading || !project}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>

    </div>
  )
}