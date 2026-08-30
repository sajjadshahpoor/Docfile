import BaseUnderline from '@tiptap/extension-underline'

export type UnderlineStyle = 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'

// Extends the official Underline mark with a line style + color, the same way
// extensions/fontSize.ts extends textStyle — Word's underline dropdown offers
// several line styles and an independent underline color.
export const UnderlineWithStyle = BaseUnderline.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      underlineStyle: {
        default: 'solid',
        parseHTML: (element) => element.style.textDecorationStyle || 'solid',
        renderHTML: (attributes) => {
          const style = (attributes.underlineStyle as UnderlineStyle) ?? 'solid'
          return {
            style: `text-decoration-line: underline; text-decoration-style: ${style};`
          }
        }
      },
      underlineColor: {
        default: null,
        parseHTML: (element) => element.style.textDecorationColor || null,
        renderHTML: (attributes) => {
          if (!attributes.underlineColor) return {}
          return { style: `text-decoration-color: ${attributes.underlineColor}` }
        }
      }
    }
  }
})
