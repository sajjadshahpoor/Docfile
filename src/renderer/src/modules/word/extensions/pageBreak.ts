import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType
    }
  }
}

// A block-level node representing a hard page break. Renders as a visible
// divider in the editor (we don't paginate the preview) and maps to a real
// docx PageBreak on export, so Word/LibreOffice actually start a new page.
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-page-break]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-page-break': 'true' })]
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) => {
          // Insert a paragraph right after the break too — otherwise the break
          // node stays selected as a NodeSelection and typing would replace it
          // instead of adding content after it.
          return chain()
            .insertContent([{ type: this.name }, { type: 'paragraph' }])
            .run()
        }
    }
  }
})
