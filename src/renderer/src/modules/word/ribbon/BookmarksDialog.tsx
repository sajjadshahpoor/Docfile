import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { listBookmarks, goToRange, removeMarkRange } from '../docMarks'

interface BookmarksDialogProps {
  editor: Editor
  onClose: () => void
}

export default function BookmarksDialog({ editor, onClose }: BookmarksDialogProps): JSX.Element {
  const [name, setName] = useState('')
  const [bookmarks, setBookmarks] = useState(() => listBookmarks(editor))
  const hasSelection = !editor.state.selection.empty

  const refresh = (): void => setBookmarks(listBookmarks(editor))

  const addBookmark = (): void => {
    const trimmed = name.trim().replace(/\s+/g, '_')
    if (!trimmed || !hasSelection) return
    editor.chain().focus().setMark('bookmark', { name: trimmed }).run()
    setName('')
    refresh()
  }

  const deleteBookmark = (from: number, to: number): void => {
    removeMarkRange(editor, 'bookmark', from, to)
    refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[380px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Bookmark</h2>

        <label className="mb-1 block text-xs text-gray-500">Bookmark name</label>
        <div className="mb-1 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Select text, then name it"
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={!hasSelection || !name.trim()}
            onClick={addBookmark}
            className="rounded-md bg-office-word px-3 py-1.5 text-sm font-medium text-white hover:bg-office-word/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </div>
        {!hasSelection && (
          <div className="mb-3 text-xs text-amber-600">Select some text first to bookmark it.</div>
        )}

        <div className="mt-4 max-h-56 overflow-y-auto rounded border border-gray-200">
          {bookmarks.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">No bookmarks in this document yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {bookmarks.map((b) => (
                <li key={`${b.name}-${b.from}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate text-gray-800">{b.name}</span>
                  <span className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => goToRange(editor, b.from, b.to)}
                      className="text-office-word hover:underline"
                    >
                      Go to
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBookmark(b.from, b.to)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
