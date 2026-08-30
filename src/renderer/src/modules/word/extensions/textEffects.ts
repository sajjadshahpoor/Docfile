import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textEffects: {
      setSmallCaps: (on: boolean) => ReturnType
      setAllCaps: (on: boolean) => ReturnType
    }
  }
}

// Word's Font dialog "Effects": Small caps and All caps are display-only —
// they don't change the underlying text, matching real Word (copy/export still
// has the original casing). CSS font-variant/text-transform give that for free.
export const TextEffects = Extension.create({
  name: 'textEffects',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          smallCaps: {
            default: false,
            parseHTML: (element) => element.style.fontVariant === 'small-caps',
            renderHTML: (attributes) => {
              if (!attributes.smallCaps) return {}
              return { style: 'font-variant: small-caps;' }
            }
          },
          allCaps: {
            default: false,
            parseHTML: (element) => element.style.textTransform === 'uppercase',
            renderHTML: (attributes) => {
              if (!attributes.allCaps) return {}
              return { style: 'text-transform: uppercase;' }
            }
          }
        }
      }
    ]
  },

  addCommands() {
    return {
      setSmallCaps:
        (on) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { smallCaps: on }).run()
        },
      setAllCaps:
        (on) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { allCaps: on }).run()
        }
    }
  }
})
