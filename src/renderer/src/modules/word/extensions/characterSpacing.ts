import { Extension } from '@tiptap/core'

export type SpacingPreset = 'condensed' | 'normal' | 'expanded'

const PRESET_PX: Record<Exclude<SpacingPreset, 'normal'>, string> = {
  condensed: '-0.5px',
  expanded: '1px'
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    characterSpacing: {
      setCharacterSpacing: (preset: SpacingPreset) => ReturnType
    }
  }
}

// Same extend-textStyle pattern as extensions/fontSize.ts — Word's Font dialog
// "Character Spacing" dropdown (Condensed/Normal/Expanded), approximated here
// with CSS letter-spacing rather than true OpenType kerning.
export const CharacterSpacing = Extension.create({
  name: 'characterSpacing',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          characterSpacing: {
            default: null,
            parseHTML: (element) => element.style.letterSpacing || null,
            renderHTML: (attributes) => {
              if (!attributes.characterSpacing) return {}
              return { style: `letter-spacing: ${attributes.characterSpacing}` }
            }
          }
        }
      }
    ]
  },

  addCommands() {
    return {
      setCharacterSpacing:
        (preset) =>
        ({ chain }) => {
          if (preset === 'normal') return chain().setMark('textStyle', { characterSpacing: null }).run()
          return chain().setMark('textStyle', { characterSpacing: PRESET_PX[preset] }).run()
        }
    }
  }
})
