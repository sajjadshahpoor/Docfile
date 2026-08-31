import { useState } from 'react'
import { newSource, type Source, type SourceType } from '../citations'

interface ManageSourcesDialogProps {
  sources: Source[]
  onSourcesChange: (sources: Source[]) => void
  onClose: () => void
}

export default function ManageSourcesDialog({ sources, onSourcesChange, onClose }: ManageSourcesDialogProps): JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = sources.find((s) => s.id === editingId) ?? null

  const addSource = (): void => {
    const source = newSource()
    onSourcesChange([...sources, source])
    setEditingId(source.id)
  }

  const updateEditing = (patch: Partial<Source>): void => {
    if (!editing) return
    onSourcesChange(sources.map((s) => (s.id === editing.id ? { ...s, ...patch } : s)))
  }

  const deleteSource = (id: string): void => {
    onSourcesChange(sources.filter((s) => s.id !== id))
    if (editingId === id) setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="flex w-[560px] gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-56 flex-shrink-0 flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Manage Sources</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded px-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto rounded border border-gray-200">
            {sources.length === 0 ? (
              <div className="p-3 text-xs text-gray-400">No sources yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sources.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setEditingId(s.id)}
                      className={`block w-full truncate px-2 py-1.5 text-left text-sm ${
                        editingId === s.id ? 'bg-office-word/10 text-office-word' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {s.title || s.author || 'Untitled source'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={addSource}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            + Add New Source…
          </button>
        </div>

        <div className="flex-1 border-l border-gray-100 pl-4">
          {!editing ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Select a source to edit, or add a new one.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Type of Source</label>
                <select
                  value={editing.type}
                  onChange={(e) => updateEditing({ type: e.target.value as SourceType })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="book">Book</option>
                  <option value="website">Website</option>
                  <option value="article">Journal Article</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Author</label>
                <input
                  type="text"
                  value={editing.author}
                  onChange={(e) => updateEditing({ author: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Title</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => updateEditing({ title: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Year</label>
                  <input
                    type="text"
                    value={editing.year}
                    onChange={(e) => updateEditing({ year: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Publisher</label>
                  <input
                    type="text"
                    value={editing.publisher}
                    onChange={(e) => updateEditing({ publisher: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              {editing.type === 'website' && (
                <div>
                  <label className="mb-1 block text-xs text-gray-500">URL</label>
                  <input
                    type="text"
                    value={editing.url}
                    onChange={(e) => updateEditing({ url: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => deleteSource(editing.id)}
                className="text-sm text-red-500 hover:underline"
              >
                Delete this source
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
