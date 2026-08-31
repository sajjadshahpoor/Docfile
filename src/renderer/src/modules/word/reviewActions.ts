import type { Editor } from '@tiptap/react'
import { listChanges, type ChangeEntry } from './docMarks'

// Word's Accept/Reject/Next/Previous buttons all act on "the change at (or
// after) the cursor" — this finds that entry the same way each caller needs.
export function changeAtOrAfter(editor: Editor, pos: number): ChangeEntry | undefined {
  const changes = listChanges(editor)
  return changes.find((c) => pos >= c.from && pos <= c.to) ?? changes.find((c) => c.from >= pos)
}

function deleteRange(editor: Editor, from: number, to: number): void {
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.delete(from, to)
      return true
    })
    .run()
}

export function acceptChange(editor: Editor, entry: ChangeEntry): void {
  if (entry.type === 'delete') {
    deleteRange(editor, entry.from, entry.to)
  } else {
    editor.chain().focus().setTextSelection({ from: entry.from, to: entry.to }).unsetMark('trackInsert').run()
  }
}

export function rejectChange(editor: Editor, entry: ChangeEntry): void {
  if (entry.type === 'insert') {
    deleteRange(editor, entry.from, entry.to)
  } else {
    editor.chain().focus().setTextSelection({ from: entry.from, to: entry.to }).unsetMark('trackDelete').run()
  }
}

export function goToNextChange(editor: Editor): void {
  const { to } = editor.state.selection
  const changes = listChanges(editor)
  const next = changes.find((c) => c.from > to) ?? changes[0]
  if (next) editor.chain().focus().setTextSelection({ from: next.from, to: next.to }).scrollIntoView().run()
}

export function goToPreviousChange(editor: Editor): void {
  const { from } = editor.state.selection
  const changes = listChanges(editor)
  const previous = [...changes].reverse().find((c) => c.to < from) ?? changes[changes.length - 1]
  if (previous) editor.chain().focus().setTextSelection({ from: previous.from, to: previous.to }).scrollIntoView().run()
}
