import { Node, mergeAttributes } from '@tiptap/core'

export type NoteKind = 'footnote' | 'endnote'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnoteRef: {
      insertNote: (kind: NoteKind, text: string) => ReturnType
      updateNoteText: (noteId: string, text: string) => ReturnType
    }
  }
}

// An inline atom marking where a footnote/endnote number appears in the
// running text — the note's own text lives in the node's attrs (plain text
// only, not rich content, for this first pass) rather than in a second
// out-of-flow document part, since this app has no per-page layout to anchor
// a real bottom-of-page footnote area to. The visible number is a CSS
// counter (see index.css) scoped separately per kind, matching how Word
// numbers footnotes and endnotes independently.
export const FootnoteNode = Node.create({
  name: 'footnoteRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      noteId: { default: null },
      kind: { default: 'footnote' },
      text: { default: '' }
    }
  },

  parseHTML() {
    return [{ tag: 'sup[data-note-id]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        class: `docfile-note-ref docfile-note-${node.attrs.kind}`,
        'data-note-id': node.attrs.noteId,
        'data-kind': node.attrs.kind,
        title: node.attrs.text
      })
    ]
  },

  addCommands() {
    return {
      insertNote:
        (kind, text) =>
        ({ chain }) => {
          const noteId = `n${Date.now()}${Math.floor(Math.random() * 1000)}`
          return chain()
            .insertContent({ type: this.name, attrs: { noteId, kind, text } })
            .run()
        },
      updateNoteText:
        (noteId, text) =>
        ({ tr, state, dispatch }) => {
          let found = false
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'footnoteRef' && node.attrs.noteId === noteId) {
              if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, text })
              found = true
            }
          })
          return found
        }
    }
  }
})
