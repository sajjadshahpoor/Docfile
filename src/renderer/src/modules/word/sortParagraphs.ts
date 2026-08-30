import type { Editor } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export type SortDirection = 'asc' | 'desc'

// Sorts the top-level blocks (paragraphs, or list items if the selection is
// inside a list) touching the current selection by their text content —
// Word's Home > Paragraph > Sort (A→Z / Z→A) button.
export function sortSelection(editor: Editor, direction: SortDirection): void {
  const { state, view } = editor
  const { from, to } = state.selection

  // Find the shared parent list (if any) so list items sort as whole items;
  // otherwise fall back to sorting the doc's direct block children.
  const $from = state.doc.resolve(from)
  let listDepth = -1
  for (let d = $from.depth; d > 0; d--) {
    if (['bulletList', 'orderedList'].includes($from.node(d).type.name)) {
      listDepth = d
      break
    }
  }

  const container = listDepth >= 0 ? $from.node(listDepth) : state.doc
  const containerPos = listDepth >= 0 ? $from.before(listDepth) + 1 : 0

  const blocks: { node: ProseMirrorNode; pos: number }[] = []
  container.forEach((node, offset) => {
    const pos = containerPos + offset
    // Only include blocks that intersect the selection, unless the selection
    // is a plain caret (empty) — then sort the whole container.
    const intersects = from === to || (pos < to && pos + node.nodeSize > from)
    if (intersects) blocks.push({ node, pos })
  })

  if (blocks.length < 2) return

  const withText = blocks.map((b) => ({ ...b, text: b.node.textContent.trim().toLowerCase() }))
  const sorted = [...withText].sort((a, b) =>
    direction === 'asc' ? a.text.localeCompare(b.text) : b.text.localeCompare(a.text)
  )

  if (sorted.every((s, i) => s.pos === withText[i].pos)) return // already in order

  const tr = state.tr
  const start = blocks[0].pos
  const end = blocks[blocks.length - 1].pos + blocks[blocks.length - 1].node.nodeSize
  const fragment = sorted.map((s) => s.node)
  tr.replaceWith(start, end, fragment)
  view.dispatch(tr)
  editor.commands.focus()
}
