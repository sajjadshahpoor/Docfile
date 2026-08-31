import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { listComments, goToRange, removeMarkRange } from '../docMarks'

interface CommentsPanelProps {
  editor: Editor
  onClose: () => void
}

export default function CommentsPanel({ editor, onClose }: CommentsPanelProps): JSX.Element {
  const [comments, setComments] = useState(() => listComments(editor))

  const refresh = (): void => setComments(listComments(editor))

  const deleteComment = (from: number, to: number): void => {
    removeMarkRange(editor, 'comment', from, to)
    refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[420px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Comments</h2>

        <div className="max-h-72 overflow-y-auto rounded border border-gray-200">
          {comments.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">
              No comments yet. Select text and use Insert &gt; Comment to add one.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {comments.map((c) => (
                <li key={`${c.commentId}-${c.from}`} className="px-3 py-2 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-gray-800">{c.author}</span>
                    <span className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => goToRange(editor, c.from, c.to)}
                        className="text-office-word hover:underline"
                      >
                        Go to
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteComment(c.from, c.to)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                  <div className="text-gray-600">{c.text}</div>
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
