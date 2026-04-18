import { useState, useRef, useEffect } from 'react'
import { Trash2, ListTodo } from 'lucide-react'
import useTodoStore from '../store/useTodoStore'

function TodoRow({ todo, onToggle, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleDelete = () => {
    if (confirming) {
      clearTimeout(timer.current)
      onDelete()
    } else {
      setConfirming(true)
      timer.current = setTimeout(() => setConfirming(false), 2500)
    }
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-3 border-b border-ob-border/40 last:border-b-0">
      {/* Custom checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={`w-4 h-4 rounded flex-shrink-0 border transition-colors flex items-center justify-center ${
          todo.completed
            ? 'bg-ob-green/20 border-ob-green/50'
            : 'border-ob-border hover:border-ob-muted'
        }`}
      >
        {todo.completed && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <span className={`flex-1 text-sm transition-colors ${
        todo.completed
          ? 'line-through text-ob-dim'
          : 'text-ob-text'
      }`}>
        {todo.text}
      </span>

      <button
        onClick={handleDelete}
        className={`transition-all rounded-lg flex-shrink-0 ${
          confirming
            ? 'px-2 py-1 text-[10px] font-mono font-bold text-ob-red bg-ob-red/10 border border-ob-red/30'
            : 'p-1.5 text-ob-dim/0 group-hover:text-ob-dim hover:text-ob-red'
        }`}
      >
        {confirming ? 'Sure?' : <Trash2 size={13} />}
      </button>
    </li>
  )
}

export default function Todos() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodoStore()
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    addTodo(text)
    setInput('')
    inputRef.current?.focus()
  }

  const pending   = todos.filter(t => !t.completed)
  const completed = todos.filter(t =>  t.completed)

  return (
    <div className="max-w-xl">

      {/* ── Header ── */}
      <div className="mb-5">
        <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.18em] mb-1">Tasks</p>
        <h1 className="text-2xl font-syne font-bold text-ob-text">Todos</h1>
      </div>

      {/* ── Command-line input ── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-0 mb-5 bg-ob-surface border border-ob-border rounded-xl overflow-hidden focus-within:border-ob-amber/40 transition-colors"
      >
        <span className="px-4 text-ob-amber font-mono text-sm select-none flex-shrink-0">›</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a task and press Enter…"
          className="flex-1 bg-transparent py-3 pr-4 text-sm text-ob-text placeholder:text-ob-dim focus:outline-none font-mono"
        />
        {input.trim() && (
          <button
            type="submit"
            className="px-4 py-3 text-[10px] font-mono text-ob-amber hover:text-ob-amber/70 border-l border-ob-border transition-colors flex-shrink-0"
          >
            ADD
          </button>
        )}
      </form>

      {/* ── Empty state ── */}
      {todos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-ob-surface border border-ob-border rounded-2xl">
          <ListTodo size={32} className="text-ob-border mb-3" />
          <p className="text-ob-muted font-medium text-sm">Nothing to do yet</p>
          <p className="text-ob-dim text-xs mt-1 font-mono">Type a task above and press Enter</p>
        </div>
      )}

      {/* ── Pending ── */}
      {pending.length > 0 && (
        <div className="bg-ob-surface border border-ob-border rounded-2xl overflow-hidden mb-3">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-ob-border">
            <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em]">To do</p>
            <span className="text-[10px] font-mono text-ob-dim tabular-nums">{pending.length}</span>
          </div>
          <ul>
            {pending.map(t => (
              <TodoRow key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}
          </ul>
        </div>
      )}

      {/* ── Completed ── */}
      {completed.length > 0 && (
        <div className="bg-ob-surface border border-ob-border rounded-2xl overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-ob-border">
            <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em]">Done</p>
            <span className="text-[10px] font-mono text-ob-green tabular-nums">{completed.length}</span>
          </div>
          <ul>
            {completed.map(t => (
              <TodoRow key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
