import { Extension } from '@tiptap/core'

// Extends paragraph/heading node attrs with the paragraph-level formatting Word
// exposes on the Home/Layout ribbon: line spacing, indentation, and space
// before/after. Rendered as inline styles in the editor and mapped to real docx
// Paragraph.spacing / Paragraph.indent on export.

const PX_PER_INCH = 96
const INDENT_STEP_INCHES = 0.5 // Word's own Increase/Decrease Indent step
const PT_TO_PX = 1.333

export interface ParagraphFormattingOptions {
  types: string[]
}

export type ParagraphBorder = 'none' | 'bottom' | 'top' | 'all'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphFormatting: {
      setLineHeight: (value: string) => ReturnType
      unsetLineHeight: () => ReturnType
      setIndentLeft: (inches: number) => ReturnType
      setIndentRight: (inches: number) => ReturnType
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
      setParagraphSpacing: (before: number | null, after: number | null) => ReturnType
      setShading: (color: string | null) => ReturnType
      setParagraphBorder: (border: ParagraphBorder) => ReturnType
      setFirstLineIndent: (inches: number | null) => ReturnType
      setCaptionLabel: (label: string | null) => ReturnType
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
          indentLeft: {
            default: 0,
            parseHTML: (element) => {
              const margin = parseFloat(element.style.marginLeft || '0')
              return Number.isFinite(margin) && margin > 0 ? margin / PX_PER_INCH : 0
            },
            renderHTML: (attributes) => {
              const inches = Number(attributes.indentLeft ?? 0)
              if (!inches) return {}
              return { style: `margin-left: ${inches * PX_PER_INCH}px` }
            }
          },
          indentRight: {
            default: 0,
            parseHTML: (element) => {
              const margin = parseFloat(element.style.marginRight || '0')
              return Number.isFinite(margin) && margin > 0 ? margin / PX_PER_INCH : 0
            },
            renderHTML: (attributes) => {
              const inches = Number(attributes.indentRight ?? 0)
              if (!inches) return {}
              return { style: `margin-right: ${inches * PX_PER_INCH}px` }
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
          },
          shading: {
            default: null,
            parseHTML: (element) => element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.shading) return {}
              return { style: `background-color: ${attributes.shading}` }
            }
          },
          border: {
            default: 'none',
            parseHTML: () => 'none',
            renderHTML: (attributes) => {
              const border = attributes.border as ParagraphBorder
              if (!border || border === 'none') return {}
              const rule = '1px solid #1f1f1f'
              if (border === 'all') return { style: `border: ${rule}; padding: 4px 6px;` }
              if (border === 'bottom') return { style: `border-bottom: ${rule}; padding-bottom: 4px;` }
              return { style: `border-top: ${rule}; padding-top: 4px;` }
            }
          },
          firstLineIndent: {
            default: null,
            parseHTML: (element) => {
              const value = parseFloat(element.style.textIndent || '')
              return Number.isFinite(value) ? value / 96 : null
            },
            renderHTML: (attributes) => {
              if (!attributes.firstLineIndent) return {}
              return { style: `text-indent: ${Number(attributes.firstLineIndent) * 96}px` }
            }
          },
          captionLabel: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-caption-label'),
            renderHTML: (attributes) => {
              if (!attributes.captionLabel) return {}
              return { class: 'docfile-caption', 'data-caption-label': attributes.captionLabel }
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
      setIndentLeft:
        (inches) =>
        ({ commands }) => {
          const clamped = Math.max(0, Math.min(6, inches))
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { indentLeft: clamped })
          )
        },
      setIndentRight:
        (inches) =>
        ({ commands }) => {
          const clamped = Math.max(0, Math.min(6, inches))
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { indentRight: clamped })
          )
        },
      increaseIndent:
        () =>
        ({ editor, commands }) => {
          const current = Number(
            editor.getAttributes('paragraph').indentLeft ?? editor.getAttributes('heading').indentLeft ?? 0
          )
          const clamped = Math.max(0, Math.min(6, current + INDENT_STEP_INCHES))
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { indentLeft: clamped })
          )
        },
      decreaseIndent:
        () =>
        ({ editor, commands }) => {
          const current = Number(
            editor.getAttributes('paragraph').indentLeft ?? editor.getAttributes('heading').indentLeft ?? 0
          )
          const clamped = Math.max(0, Math.min(6, current - INDENT_STEP_INCHES))
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { indentLeft: clamped })
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
        },
      setShading:
        (color) =>
        ({ commands }) => {
          return this.options.types.every((type) => commands.updateAttributes(type, { shading: color }))
        },
      setParagraphBorder:
        (border) =>
        ({ commands }) => {
          return this.options.types.every((type) => commands.updateAttributes(type, { border }))
        },
      setFirstLineIndent:
        (inches) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { firstLineIndent: inches })
          )
        },
      setCaptionLabel:
        (label) =>
        ({ commands }) => {
          return this.options.types.every((type) => commands.updateAttributes(type, { captionLabel: label }))
        }
    }
  }
})
