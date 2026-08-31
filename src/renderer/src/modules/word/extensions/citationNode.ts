import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citationRef: {
      insertCitation: (sourceId: string, displayText: string) => ReturnType
    }
  }
}

// An inline atom for an in-text citation, e.g. "(Smith, 2020)". Like
// footnoteRef, the formatted display text is baked into the node's attrs at
// insert time rather than looked up live, so "Update Citations and
// Bibliography" (see referencesActions.ts) re-resolves every instance
// against the current source list and style when either changes.
export const CitationNode = Node.create({
  name: 'citationRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      sourceId: { default: null },
      displayText: { default: '' }
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-citation-source]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'docfile-citation-ref',
        'data-citation-source': node.attrs.sourceId
      }),
      node.attrs.displayText
    ]
  },

  addCommands() {
    return {
      insertCitation:
        (sourceId, displayText) =>
        ({ chain }) => {
          return chain().insertContent({ type: this.name, attrs: { sourceId, displayText } }).run()
        }
    }
  }
})
