import { Extension, Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'

export const TRACK_AUTHOR = 'Docfile User'
export type MarkupView = 'all' | 'final' | 'original'

const SKIP_META = 'trackChangesSkip'

// Text a user types/pastes while tracking is on gets this mark instead of
// being plain content. Inclusive so continuing to type right after your own
// tracked insertion keeps extending the same run, matching Word.
export const TrackInsertMark = Mark.create({
  name: 'trackInsert',
  inclusive: true,
  addAttributes() {
    return {
      author: {
        default: TRACK_AUTHOR,
        parseHTML: (el) => el.getAttribute('data-track-author'),
        renderHTML: (attrs) => ({ 'data-track-author': attrs.author ?? TRACK_AUTHOR })
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-track-date'),
        renderHTML: (attrs) => (attrs.date ? { 'data-track-date': attrs.date } : {})
      }
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-track-insert]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'docfile-track-insert', 'data-track-insert': 'true' }, HTMLAttributes), 0]
  }
})

// Text removed while tracking is on gets this mark instead of actually being
// deleted — it stays in the document (struck through) until Accept/Reject.
export const TrackDeleteMark = Mark.create({
  name: 'trackDelete',
  inclusive: false,
  addAttributes() {
    return {
      author: {
        default: TRACK_AUTHOR,
        parseHTML: (el) => el.getAttribute('data-track-author'),
        renderHTML: (attrs) => ({ 'data-track-author': attrs.author ?? TRACK_AUTHOR })
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-track-date'),
        renderHTML: (attrs) => (attrs.date ? { 'data-track-date': attrs.date } : {})
      }
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-track-delete]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'docfile-track-delete', 'data-track-delete': 'true' }, HTMLAttributes), 0]
  }
})

export interface TrackChangesStorage {
  enabled: boolean
  markup: MarkupView
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    trackChangesController: {
      setTrackChangesEnabled: (enabled: boolean) => ReturnType
      setMarkupView: (mode: MarkupView) => ReturnType
      acceptAllChanges: () => ReturnType
      rejectAllChanges: () => ReturnType
    }
  }
}

// Marks the range a step inserted, mapped forward through every later step/
// transaction in this batch so the position lands correctly in newState's
// final coordinates — the standard technique for an appendTransaction that
// reacts to arbitrary edits (typing, paste, IME) without hooking each input
// path individually.
function markInsertions(transactions: readonly import('@tiptap/pm/state').Transaction[], newState: import('@tiptap/pm/state').EditorState): import('@tiptap/pm/state').Transaction | null {
  const tr = newState.tr
  let changed = false

  transactions.forEach((transaction, tIndex) => {
    if (!transaction.docChanged) return
    transaction.mapping.maps.forEach((stepMap, sIndex) => {
      stepMap.forEach((_fromA: number, _toA: number, fromB: number, toB: number) => {
        if (fromB === toB) return
        let from = fromB
        let to = toB
        for (let i = sIndex + 1; i < transaction.mapping.maps.length; i++) {
          from = transaction.mapping.maps[i].map(from, -1)
          to = transaction.mapping.maps[i].map(to, 1)
        }
        for (let later = tIndex + 1; later < transactions.length; later++) {
          from = transactions[later].mapping.map(from, -1)
          to = transactions[later].mapping.map(to, 1)
        }
        if (from < to && to <= newState.doc.content.size) {
          // Reuse the date of an immediately-preceding insertion by the same
          // author so continuous typing stays one mark (same attrs = same
          // mark identity), instead of stamping a fresh timestamp — and
          // therefore a new, unmerged span — on every single keystroke.
          const before = from > 0 ? newState.doc.resolve(from).nodeBefore : null
          const precedingDate = before?.isText
            ? (before.marks.find((m) => m.type.name === 'trackInsert')?.attrs.date as string | undefined)
            : undefined
          tr.addMark(
            from,
            to,
            newState.schema.marks.trackInsert.create({
              author: TRACK_AUTHOR,
              date: precedingDate ?? new Date().toISOString()
            })
          )
          changed = true
        }
      })
    })
  })

  if (!changed) return null
  tr.setMeta(SKIP_META, true)
  return tr
}

export const TrackChanges = Extension.create<Record<string, never>, TrackChangesStorage>({
  name: 'trackChangesController',

  addStorage() {
    return { enabled: false, markup: 'all' }
  },

  addCommands() {
    return {
      setTrackChangesEnabled:
        (enabled) =>
        ({ editor }) => {
          editor.storage.trackChangesController.enabled = enabled
          return true
        },
      setMarkupView:
        (mode) =>
        ({ editor }) => {
          editor.storage.trackChangesController.markup = mode
          return true
        },
      acceptAllChanges:
        () =>
        ({ tr, dispatch }) => {
          const deleteRanges: { from: number; to: number }[] = []
          tr.doc.descendants((node, pos) => {
            if (node.isText && node.marks.some((m) => m.type.name === 'trackDelete')) {
              deleteRanges.push({ from: pos, to: pos + node.nodeSize })
            }
          })
          if (dispatch) {
            deleteRanges.sort((a, b) => b.from - a.from).forEach((r) => tr.delete(r.from, r.to))
            tr.removeMark(0, tr.doc.content.size, tr.doc.type.schema.marks.trackInsert)
          }
          return true
        },
      rejectAllChanges:
        () =>
        ({ tr, dispatch }) => {
          const insertRanges: { from: number; to: number }[] = []
          tr.doc.descendants((node, pos) => {
            if (node.isText && node.marks.some((m) => m.type.name === 'trackInsert')) {
              insertRanges.push({ from: pos, to: pos + node.nodeSize })
            }
          })
          if (dispatch) {
            insertRanges.sort((a, b) => b.from - a.from).forEach((r) => tr.delete(r.from, r.to))
            tr.removeMark(0, tr.doc.content.size, tr.doc.type.schema.marks.trackDelete)
          }
          return true
        }
    }
  },

  addKeyboardShortcuts() {
    const handleDelete = (direction: 'backward' | 'forward') => (): boolean => {
      if (!this.editor.storage.trackChangesController.enabled) return false
      const { state, view } = this.editor
      const { from, to, empty } = state.selection
      const author = TRACK_AUTHOR
      const date = new Date().toISOString()
      const tr = state.tr

      if (!empty) {
        tr.addMark(from, to, state.schema.marks.trackDelete.create({ author, date }))
        tr.setSelection(TextSelection.create(tr.doc, from))
      } else {
        const rangeFrom = direction === 'backward' ? from - 1 : from
        const rangeTo = direction === 'backward' ? from : from + 1
        if (rangeFrom < 0 || rangeTo > state.doc.content.size) return false
        // Only intercept plain character-level deletes; let a delete that
        // would cross a node boundary (merging paragraphs, removing a list
        // item, etc.) fall through to normal, untracked behavior rather than
        // risk marking a doc-structure edit as if it were text.
        const $rangeFrom = state.doc.resolve(rangeFrom)
        if (!$rangeFrom.nodeAfter?.isText) return false
        tr.addMark(rangeFrom, rangeTo, state.schema.marks.trackDelete.create({ author, date }))
        tr.setSelection(TextSelection.create(tr.doc, direction === 'backward' ? rangeFrom : from))
      }
      tr.setMeta(SKIP_META, true)
      view.dispatch(tr)
      return true
    }

    return {
      Backspace: handleDelete('backward'),
      Delete: handleDelete('forward')
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: new PluginKey('trackChangesAutoMark'),
        appendTransaction(transactions, _oldState, newState) {
          if (!extension.editor.storage.trackChangesController.enabled) return null
          if (transactions.some((t) => t.getMeta(SKIP_META))) return null
          if (!transactions.some((t) => t.docChanged)) return null
          return markInsertions(transactions, newState)
        },
        props: {
          // Typing over a selection is a single combined replace, not a
          // backspace/delete keypress, so it needs its own interception:
          // mark the old selection as deleted, then insert the new text
          // after it (marked as inserted) instead of letting ProseMirror
          // silently replace the selection.
          handleTextInput(view, from, to, text) {
            if (!extension.editor.storage.trackChangesController.enabled) return false
            if (from === to) return false
            const { state, dispatch } = view
            const author = TRACK_AUTHOR
            const date = new Date().toISOString()
            const tr = state.tr
            tr.addMark(from, to, state.schema.marks.trackDelete.create({ author, date }))
            tr.insertText(text, to)
            tr.addMark(to, to + text.length, state.schema.marks.trackInsert.create({ author, date }))
            tr.setSelection(TextSelection.create(tr.doc, to + text.length))
            tr.setMeta(SKIP_META, true)
            dispatch(tr)
            return true
          }
        }
      })
    ]
  }
})
