import type { Editor } from '@tiptap/react'
import { findColorTheme, findFontPair, findSpacingPreset, type StyleSet } from './designPresets'

interface BlockRange {
  from: number
  to: number
}

// Marks/attrs applied via setTextSelection+command inside one chain stay a
// single transaction (and one undo step) as long as every step only touches
// marks/attrs — those never change node sizes, so ranges computed up front
// stay valid for the whole chain, matching sortParagraphs.ts's approach of
// building document-wide edits directly rather than one selection at a time.
function collectBlockRanges(editor: Editor, types: string[]): BlockRange[] {
  const ranges: BlockRange[] = []
  editor.state.doc.descendants((node, pos) => {
    if (types.includes(node.type.name) && node.content.size > 0) {
      ranges.push({ from: pos + 1, to: pos + node.nodeSize - 1 })
    }
  })
  return ranges
}

export function applyFontPairById(editor: Editor, fontPairId: string): void {
  const pair = findFontPair(fontPairId)
  const headingRanges = collectBlockRanges(editor, ['heading'])

  let chain = editor.chain().focus().selectAll().setFontFamily(pair.bodyFont)
  headingRanges.forEach(({ from, to }) => {
    chain = chain.setTextSelection({ from, to }).setFontFamily(pair.headingFont)
  })
  chain.setTextSelection(0).run()
}

export function applyAccentColorById(editor: Editor, colorThemeId: string): void {
  const theme = findColorTheme(colorThemeId)
  const headingRanges = collectBlockRanges(editor, ['heading'])
  if (!headingRanges.length) return

  let chain = editor.chain().focus()
  headingRanges.forEach(({ from, to }) => {
    chain = chain.setTextSelection({ from, to }).setColor(theme.accent)
  })
  chain.setTextSelection(0).run()
}

export function applySpacingPresetById(editor: Editor, spacingId: string): void {
  const preset = findSpacingPreset(spacingId)
  editor
    .chain()
    .focus()
    .selectAll()
    .setParagraphSpacing(preset.before, preset.after)
    .setLineHeight(preset.line)
    .setTextSelection(0)
    .run()
}

export function applyStyleSet(editor: Editor, styleSet: StyleSet): void {
  const pair = findFontPair(styleSet.fontPairId)
  const theme = findColorTheme(styleSet.colorThemeId)
  const spacing = findSpacingPreset(styleSet.spacingId)
  const headingRanges = collectBlockRanges(editor, ['heading'])

  let chain = editor
    .chain()
    .focus()
    .selectAll()
    .setFontFamily(pair.bodyFont)
    .setParagraphSpacing(spacing.before, spacing.after)
    .setLineHeight(spacing.line)
  headingRanges.forEach(({ from, to }) => {
    chain = chain.setTextSelection({ from, to }).setFontFamily(pair.headingFont).setColor(theme.accent)
  })
  chain.setTextSelection(0).run()
}
