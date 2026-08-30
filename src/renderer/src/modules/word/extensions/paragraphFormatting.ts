import { Extension } from '@tiptap/core'

// Extends paragraph/heading node attrs with the paragraph-level formatting Word
// exposes on the Home/Layout ribbon: line spacing, indent level, and space
// before/after. Rendered as inline styles in the editor and mapped to real docx
// Paragraph.spacing / Paragraph.indent on export.

const INDENT_STEP_PX = 36 // ~0.375in per level on screen
const PT_TO_PX = 1.333

export interface ParagraphFormattingOptions {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphFormatting: {
      setLineHeight: (value: string) => ReturnType
      unsetLineHeight: () => ReturnType
      setIndentLevel: (level: number) => ReturnType
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
      setParagraphSpacing: (before: number | null, after: number | null) => ReturnType
    }
  }
}

export const ParagraphFormatting = Extension.create<ParagraphFormattingOptions>({
  name: 'paragraphFormatting',

  addOptions() {
    return {
      types: ['paragraph', 'heading']
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            }
          },
          indentLevel: {
            default: 0,
            parseHTML: (element) => {
              const margin = parseInt(element.style.marginLeft || '0', 10)
              return margin > 0 ? Math.round(margin / INDENT_STEP_PX) : 0
            },
            renderHTML: (attributes) => {
              const level = Number(attributes.indentLevel ?? 0)
              if (!level) return {}
              return { style: `margin-left: ${level * INDENT_STEP_PX}px` }
            }
          },
          spacingBefore: {
            default: null,
            parseHTML: () => null,
            renderHTML: (attributes) => {
              if (!attributes.spacingBefore) return {}
              return { style: `margin-top: ${Number(attributes.spacingBefore) * PT_TO_PX}px` }
            }
          },
          spacingAfter: {
            default: null,
            parseHTML: () => null,
            renderHTML: (attributes) => {
              if (!attributes.spacingAfter) return {}
              return { style: `margin-bottom: ${Number(attributes.spacingAfter) * PT_TO_PX}px` }
            }
          }
        }
      }
    ]
  },

  addCommands() {
    return {
      setLineHeight:
        (value) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { lineHeight: value })
          )
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { lineHeight: null })
          )
        },
      setIndentLevel:
        (level) =>
        ({ commands }) => {
          const clamped = Math.max(0, Math.min(8, level))
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { indentLevel: clamped })
          )
        },
      increaseIndent:
        () =>
        ({ editor, commands }) => {
          const current = Number(editor.getAttributes('paragraph').indentLevel ?? editor.getAttributes('heading').indentLevel ?? 0)
          const clamped = Math.max(0, Math.min(8, current + 1))
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { indentLevel: clamped })
          )
        },
      decreaseIndent:
        () =>
        ({ editor, commands }) => {
          const current = Number(editor.getAttributes('paragraph').indentLevel ?? editor.getAttributes('heading').indentLevel ?? 0)
          const clamped = Math.max(0, Math.min(8, current - 1))
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { indentLevel: clamped })
          )
        },
      setParagraphSpacing:
        (before, after) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, {
              ...(before !== null ? { spacingBefore: before } : {}),
              ...(after !== null ? { spacingAfter: after } : {})
            })
          )
        }
    }
  }
})
