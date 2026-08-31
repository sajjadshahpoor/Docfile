import type { Editor } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { ParagraphPatch } from './docxRoundTripImport'

// Splices the bookmark/comment/tracked-change content docxRoundTripImport.ts
// recovered from the raw OOXML back into the paragraphs mammoth already
// imported — matched by plain text (mammoth's own output for a paragraph
// with tracked deletions excludes the deleted text, same as what
// docxRoundTripImport.ts computes as visibleText, so the two line up).
// Matching is forward-only and bounded to a small lookahead so a stray
// mismatch can't cause paragraphs to get patched out of order.
export function applyParagraphPatches(editor: Editor, patches: ParagraphPatch[]): void {
  if (!patches.length) return
  const { state, view, schema } = editor
  const marks = schema.marks

  const blocks: { node: ProseMirrorNode; pos: number }[] = []
  state.doc.forEach((node, offset) => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      blocks.push({ node, pos: offset })
    }
  })

  const tr = state.tr
  let searchFrom = 0
  const LOOKAHEAD = 8

  for (const patch of patches) {
    let matchIndex = -1
    for (let i = searchFrom; i < Math.min(blocks.length, searchFrom + LOOKAHEAD); i++) {
      if (blocks[i].node.textContent === patch.visibleText) {
        matchIndex = i
        break
      }
    }
    if (matchIndex === -1) continue
    searchFrom = matchIndex + 1

    const block = blocks[matchIndex]
    const fragmentNodes = patch.content
      .filter((n) => n.text)
      .map((n) =>
        schema.text(
          n.text as string,
          (n.marks ?? []).flatMap((m) => {
            const markType = marks[m.type]
            return markType ? [markType.create(m.attrs)] : []
          })
        )
      )
    if (!fragmentNodes.length) continue

    const from = tr.mapping.map(block.pos + 1)
    const to = tr.mapping.map(block.pos + block.node.nodeSize - 1)
    tr.replaceWith(from, to, fragmentNodes)
  }

  if (tr.docChanged) {
    tr.setMeta('addToHistory', false)
    view.dispatch(tr)
  }
}
