import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { goToRange } from '../docMarks'
import type { NoteKind } from '../extensions/footnoteNode'

interface NoteEntry {
  noteId: string
  kind: NoteKind
  text: string
  from: number
  to: number
}

function listNotes(editor: Editor): NoteEntry[] {
  const entries: NoteEntry[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'footnoteRef') {
      entries.push({
        noteId: node.attrs.noteId,
        kind: node.attrs.kind,
        text: node.attrs.text,
        from: pos,
        to: pos + node.nodeSize
      })
    }
  })
  return entries
}

interface FootnotesPanelProps {
  editor: Editor
  onClose: () => void
}

export default function FootnotesPanel({ editor, onClose }: FootnotesPanelProps): JSX.Element {
  const [notes, setNotes] = useState(() => listNotes(editor))

  const refresh = (): void => setNotes(listNotes(editor))

  const editNote = (note: NoteEntry): void => {
    const text = window.prompt(`Edit ${note.kind}`, note.text)
    if (text === null) return
    editor.chain().focus().updateNoteText(note.noteId, text).run()
    refresh()
  }

  const deleteNote = (note: NoteEntry): void => {
    editor.chain().focus().deleteRange({ from: note.from, to: note.to }).run()
    refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[440px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Footnotes &amp; Endnotes</h2>

        <div className="max-h-72 overflow-y-auto rounded border border-gray-200">
          {notes.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">
              No footnotes or endnotes yet. Use Insert Footnote / Insert Endnote on the References tab.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notes.map((n, i) => (
                <li key={`${n.noteId}-${n.from}`} className="px-3 py-2 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {n.kind === 'footnote' ? 'Footnote' : 'Endnote'} {i + 1}
                    </span>
                    <span className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => goToRange(editor, n.from, n.to)}
                        className="text-office-word hover:underline"
                      >
                        Go to
                      </button>
                      <button type="button" onClick={() => editNote(n)} className="text-office-word hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteNote(n)} className="text-red-500 hover:underline">
                        Delete
                      </button>
                    </span>
                  </div>
                  <div className="text-gray-600">{n.text}</div>
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
