import type { Editor } from '@tiptap/react'
import type { TocEntry, TofEntry } from './extensions/referenceBlocks'
import { listBookmarks } from './docMarks'

export function buildTocEntries(editor: Editor): TocEntry[] {
  const entries: TocEntry[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'heading') {
      const level = Number(node.attrs.level ?? 1)
      if (level <= 3) {
        entries.push({ text: node.textContent || '(Empty heading)', level, headingId: '' })
      }
    }
  })
  return entries
}

const CAPTION_LABELS = ['Figure', 'Table', 'Equation'] as const
export type CaptionLabel = (typeof CAPTION_LABELS)[number]

export interface CaptionEntry {
  label: CaptionLabel
  number: number
  text: string
  from: number
  to: number
}

// Captions are just paragraphs flagged with a captionLabel attr (see
// paragraphFormatting.ts) — this walks the doc counting them per label in
// document order to get each one's number, the same way Word renumbers
// captions as you insert/delete/reorder them.
export function listCaptions(editor: Editor): CaptionEntry[] {
  const counts: Record<string, number> = {}
  const entries: CaptionEntry[] = []
  editor.state.doc.descendants((node, pos) => {
    const label = node.attrs?.captionLabel as CaptionLabel | undefined
    if (!label || !CAPTION_LABELS.includes(label)) return
    counts[label] = (counts[label] ?? 0) + 1
    entries.push({
      label,
      number: counts[label],
      text: node.textContent,
      from: pos,
      to: pos + node.nodeSize
    })
  })
  return entries
}

export function nextCaptionNumber(editor: Editor, label: CaptionLabel): number {
  return listCaptions(editor).filter((c) => c.label === label).length + 1
}

export function buildTofEntries(editor: Editor, label: CaptionLabel): TofEntry[] {
  return listCaptions(editor)
    .filter((c) => c.label === label)
    .map((c) => ({ text: c.text, captionId: `${c.label}-${c.number}` }))
}

export interface CrossRefTarget {
  kind: 'heading' | 'bookmark' | 'caption'
  label: string
  from: number
  to: number
}

// The full list of things Cross-reference can point at, matching Word's own
// "Reference type" dropdown (Heading / Bookmark / Figure / Table / Equation).
export function listCrossReferenceTargets(editor: Editor): CrossRefTarget[] {
  const targets: CrossRefTarget[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      targets.push({ kind: 'heading', label: node.textContent || '(Empty heading)', from: pos, to: pos + node.nodeSize })
    }
  })
  listBookmarks(editor).forEach((b) => targets.push({ kind: 'bookmark', label: b.name, from: b.from, to: b.to }))
  listCaptions(editor).forEach((c) =>
    targets.push({ kind: 'caption', label: `${c.label} ${c.number}: ${c.text}`, from: c.from, to: c.to })
  )
  return targets
}
