import { Node, mergeAttributes } from '@tiptap/core'

export interface TocEntry {
  text: string
  level: number
  headingId: string
}

export interface TofEntry {
  text: string
  captionId: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tocBlock: {
      insertTableOfContents: (entries: TocEntry[]) => ReturnType
      updateTableOfContents: (entries: TocEntry[]) => ReturnType
    }
    tofBlock: {
      insertTableOfFigures: (label: string, entries: TofEntry[]) => ReturnType
      updateTableOfFigures: (blockId: string, entries: TofEntry[]) => ReturnType
    }
  }
}

// Both blocks are a snapshot taken at insert time, refreshed only when the
// user clicks Update — the same "bake it in, refresh on demand" approach
// already used for comments/bookmarks/footnotes in this app, rather than a
// live-bound view. Word's own TOC/TOF fields work the same way (you have to
// manually update them too), so this isn't actually a step down in fidelity.
export const TableOfContentsBlock = Node.create({
  name: 'tocBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      blockId: { default: null },
      entries: { default: [] }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-toc-block]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const entries = (node.attrs.entries as TocEntry[]) ?? []
    const rows =
      entries.length > 0
        ? entries.map((e) => [
            'div',
            { class: 'docfile-toc-row', style: `padding-left:${(e.level - 1) * 20}px` },
            ['span', { class: 'docfile-toc-text' }, e.text]
          ])
        : [['div', { class: 'docfile-toc-empty' }, 'No headings found — add Heading styles, then Update Table of Contents.']]

    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'docfile-toc-block', 'data-toc-block': 'true' }),
      ['div', { class: 'docfile-toc-title' }, 'Table of Contents'],
      ...rows
    ]
  },

  addCommands() {
    return {
      insertTableOfContents:
        (entries) =>
        ({ chain }) => {
          const blockId = `toc${Date.now()}`
          return chain()
            .insertContent([
              { type: this.name, attrs: { blockId, entries } },
              { type: 'paragraph' }
            ])
            .run()
        },
      updateTableOfContents:
        (entries) =>
        ({ tr, state, dispatch }) => {
          let found = false
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'tocBlock') {
              if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, entries })
              found = true
            }
          })
          return found
        }
    }
  }
})

export const TableOfFiguresBlock = Node.create({
  name: 'tofBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      blockId: { default: null },
      label: { default: 'Figure' },
      entries: { default: [] }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-tof-block]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const entries = (node.attrs.entries as TofEntry[]) ?? []
    const rows =
      entries.length > 0
        ? entries.map((e) => ['div', { class: 'docfile-toc-row' }, ['span', { class: 'docfile-toc-text' }, e.text]])
        : [['div', { class: 'docfile-toc-empty' }, `No ${node.attrs.label} captions found.`]]

    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'docfile-toc-block', 'data-tof-block': 'true' }),
      ['div', { class: 'docfile-toc-title' }, `Table of ${node.attrs.label}s`],
      ...rows
    ]
  },

  addCommands() {
    return {
      insertTableOfFigures:
        (label, entries) =>
        ({ chain }) => {
          const blockId = `tof${Date.now()}`
          return chain()
            .insertContent([
              { type: this.name, attrs: { blockId, label, entries } },
              { type: 'paragraph' }
            ])
            .run()
        },
      updateTableOfFigures:
        (blockId, entries) =>
        ({ tr, state, dispatch }) => {
          let found = false
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'tofBlock' && node.attrs.blockId === blockId) {
              if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, entries })
              found = true
            }
          })
          return found
        }
    }
  }
})
