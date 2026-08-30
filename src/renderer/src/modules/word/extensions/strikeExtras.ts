import BaseStrike from '@tiptap/extension-strike'

// Extends the official Strike mark with a "double" flag for Word's Double
// Strikethrough font effect — single strike already works via the plain <s> tag;
// this just adds an explicit double-line style on top when enabled.
export const StrikeWithDouble = BaseStrike.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      double: {
        default: false,
        parseHTML: (element) => element.style.textDecorationStyle === 'double',
        renderHTML: (attributes) => {
          if (!attributes.double) return {}
          return {
            style: 'text-decoration-line: line-through; text-decoration-style: double;'
          }
        }
      }
    }
  }
})
