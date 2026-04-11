import { useState } from 'react'
import { Plus, Trash2, ListTodo } from 'lucide-react'
import useTodoStore from '../store/useTodoStore'

export default function Todos() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodoStore()
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    addTodo(text)
    setInput('')
  }

  const pending   = todos.filter(t => !t.completed)
  const completed = todos.filter(t =>  t.completed)

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Todos</h2>
        <p className="text-sm text-gray-500 mt-0.5">Tasks and follow-ups</p>
      </div>

      {/* ── Add form ── */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex items-center gap-1.5 px-4 py-3 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors disabled:opacity-40"
        >
          <Plus size={16} />
          Add
        </button>
      </form>

      {/* ── Empty state ── */}
      {todos.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
          <ListTodo size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nothing to do yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first task above</p>
        </div>
      )}

      {/* ── Pending ── */}
      {pending.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-3">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              To do · {pending.length}
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {pending.map(t => (
              <TodoRow key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}
          </ul>
        </div>
      )}

      {/* ── Completed ── */}
      {completed.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm opacity-70">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Done · {completed.length}
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {completed.map(t => (
              <TodoRow key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function TodoRow({ todo, onToggle, onDelete }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="w-5 h-5 accent-brand-600 cursor-pointer flex-shrink-0 rounded"
      />
      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-colors flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </li>
  )
}
