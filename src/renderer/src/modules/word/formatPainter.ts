import type { Editor } from '@tiptap/react'
import type { Mark } from '@tiptap/pm/model'

export interface CapturedFormatting {
  marks: Mark[]
}

// Reads the marks (bold, color, font, highlight, etc.) at the caret/selection so
// they can be re-applied elsewhere — the basis of the Format Painter tool.
export function captureFormatting(editor: Editor): CapturedFormatting {
  const { from } = editor.state.selection
  const marks = editor.state.doc.resolve(from).marks()
  return { marks: [...marks] }
}

export function applyFormatting(editor: Editor, captured: CapturedFormatting, from: number, to: number): void {
  if (from === to) return
  const { state, view } = editor
  const tr = state.tr

  // Clear whatever marks are already in the target range, then apply the
  // captured ones — matches Format Painter replacing (not merging with) the
  // destination's existing character formatting.
  tr.removeMark(from, to)
  for (const mark of captured.marks) {
    tr.addMark(from, to, mark)
  }
  view.dispatch(tr)
  editor.commands.focus()
}
