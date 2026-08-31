import { Mark, mergeAttributes } from '@tiptap/core'

// A named anchor on a text range, matching Word's Insert > Bookmark. Applied
// and removed via the generic setMark/unsetMark commands (see InsertTab) —
// this extension only needs to own the attribute schema and rendering.
export const BookmarkMark = Mark.create({
  name: 'bookmark',
  // Without this, typing right after a bookmarked/commented range inherits
  // the mark onto new, unrelated text — ProseMirror marks are inclusive at
  // their end boundary by default.
  inclusive: false,

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-bookmark'),
        renderHTML: (attributes) => {
          if (!attributes.name) return {}
          return { 'data-bookmark': attributes.name, title: `Bookmark: ${attributes.name}` }
        }
      }
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-bookmark]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'docfile-bookmark' }, HTMLAttributes), 0]
  }
})
