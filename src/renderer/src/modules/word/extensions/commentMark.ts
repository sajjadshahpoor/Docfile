import { Mark, mergeAttributes } from '@tiptap/core'

// A margin-note style comment on a text range, matching Word's Insert >
// Comment. Word renders these as balloons in a side pane; we approximate
// with a highlighted, dashed-underline span whose title tooltip shows the
// note — simpler, but round-trips to real w:comment/w:commentReference XML
// on export (see docxExport.ts) so the note survives in real Word too.
export const CommentMark = Mark.create({
  name: 'comment',
  // Without this, typing right after a commented range inherits the mark
  // onto new, unrelated text — ProseMirror marks are inclusive at their end
  // boundary by default.
  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) return {}
          return { 'data-comment-id': attributes.commentId }
        }
      },
      author: {
        default: 'Docfile User',
        parseHTML: (element) => element.getAttribute('data-comment-author'),
        renderHTML: (attributes) => ({ 'data-comment-author': attributes.author ?? 'Docfile User' })
      },
      text: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-comment-text'),
        renderHTML: (attributes) => ({
          'data-comment-text': attributes.text ?? '',
          title: `${attributes.author ?? 'Comment'}: ${attributes.text ?? ''}`
        })
      },
      date: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-date'),
        renderHTML: (attributes) => (attributes.date ? { 'data-comment-date': attributes.date } : {})
      }
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'docfile-comment' }, HTMLAttributes), 0]
  }
})
